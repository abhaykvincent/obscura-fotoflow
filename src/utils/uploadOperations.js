import {
    uploadBytesResumable,
    getDownloadURL,
    ref,
    uploadBytes,
    getStorage,
    connectStorageEmulator,
} from "firebase/storage";
import { db, storage as defaultStorage, app } from '../firebase/app';
import { delay } from "./generalUtils";
import { showAlert } from "../app/slices/alertSlice";
import {
    startUploadSession,
    setUploadStatus,
    setFileProcessing,
    setFileMetadata,
    initFileDerivatives,
    updateDerivativeProgress,
    setDerivativeVerified,
    setFileVerifying,
    setFileCompleted,
    setFileFailed,
    retryDerivative,
    UPLOAD_PARENT_STATES,
    UPLOAD_DERIVATIVE_STATES,
    UPLOAD_SESSION_STATUS,
    PROCESSING_STEPS,
} from "../app/slices/uploadSlice";
import { trackEvent } from "../analytics/utils";
import { addUploadedFilesToFirestore, addUploadCompletionEventToFirestore } from "../firebase/functions/firestore";
import { fetchProjects } from "../app/slices/projectsSlice";

import imageCompression from 'browser-image-compression';
import { extractExifData } from "./fileUtils";
import { doc, updateDoc, getDoc } from "firebase/firestore";

const storageInstances = {};

const metadata = {
    cacheControl: 'public, max-age=41536000', // Cache for 1 year
};

/**
 * Generates collision-proof upload IDs
 */
export const generateUploadId = (sessionId, file, index) => {
    const randomSuffix = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    return `${sessionId || 'session'}_file_${index}_${randomSuffix}`;
};

export const getStorageForDomain = async (domain, bucketUrl) => {
    if (storageInstances[domain]) {
        return storageInstances[domain];
    }
    let finalBucketUrl = bucketUrl;

    if (!finalBucketUrl) {
        const studioRef = doc(db, "studios", domain);
        const studioSnap = await getDoc(studioRef);

        if (studioSnap.exists()) {
            const studioData = studioSnap.data();
            if (studioData.bucketUrl) {
                finalBucketUrl = studioData.bucketUrl;
            }
        }
    }

    if (finalBucketUrl) {
        const newStorage = getStorage(app, finalBucketUrl);

        if (process.env.NODE_ENV === 'development') {
            const EMULATOR_HOST = window.location.hostname || 'localhost';
            const EMULATOR_PORT = parseInt(process.env.REACT_APP_EMULATOR_PORT, 10);
            if (EMULATOR_PORT) {
                connectStorageEmulator(newStorage, EMULATOR_HOST, EMULATOR_PORT);
            }
        }

        storageInstances[domain] = newStorage;
        return newStorage;
    }

    return defaultStorage;
};

/**
 * Worker Pool to manage concurrent uploads and compressions.
 */
export class UploadWorkerPool {
    constructor(concurrency = 4) {
        this.concurrency = concurrency;
        this.queue = [];
        this.activeCount = 0;
    }

    enqueue(task) {
        return new Promise((resolve, reject) => {
            this.queue.push({ task, resolve, reject });
            this.next();
        });
    }

    async next() {
        if (this.activeCount >= this.concurrency || this.queue.length === 0) {
            return;
        }

        this.activeCount++;
        const { task, resolve, reject } = this.queue.shift();

        try {
            const result = await task();
            resolve(result);
        } catch (error) {
            reject(error);
        } finally {
            this.activeCount--;
            this.next();
        }
    }
}

/**
 * Extracts image dimensions asynchronously
 */
export const getImageDimensions = (file) => {
    return new Promise((resolve) => {
        if (typeof window === 'undefined' || typeof Image === 'undefined' || typeof URL === 'undefined') {
            resolve({ width: 0, height: 0 });
            return;
        }
        const img = new Image();
        img.onload = () => {
            resolve({ width: img.naturalWidth, height: img.naturalHeight });
            URL.revokeObjectURL(img.src);
        };
        img.onerror = () => {
            resolve({ width: 0, height: 0 });
            URL.revokeObjectURL(img.src);
        };
        img.src = URL.createObjectURL(file);
    });
};

/**
 * Derivative Upload Worker (FF-UPLOAD-05, FF-UPLOAD-14, FF-UPLOAD-15)
 * 
 * Uploads a single derivative (web or thumb), updates only its derivative facts in Redux,
 * handles exponential backoff retries, performs verification, and returns the result.
 * Does NOT independently decide parent file completion.
 */
export const uploadDerivativeWorker = async ({
    storage,
    derivativeType,
    domain,
    projectId,
    collectionId,
    file,
    fileName,
    dispatch,
    fileId,
    maxRetries = 5,
    initialRetryDelay = 1000,
}) => {
    let retries = 0;

    dispatch(updateDerivativeProgress({
        fileId,
        derivativeType,
        bytesTransferred: 0,
        totalBytes: file.size,
        status: UPLOAD_DERIVATIVE_STATES.UPLOADING,
    }));

    const executeUpload = () => {
        return new Promise((resolve, reject) => {
            const storageRef = ref(storage, `${derivativeType}/${domain}/${projectId}/${collectionId}/${fileName}`);
            const uploadMetadata = {
                ...metadata,
                contentType: file.type || (derivativeType === 'thumb' ? 'image/webp' : 'image/jpeg'),
            };

            const uploadTask = uploadBytesResumable(storageRef, file, uploadMetadata);

            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    dispatch(updateDerivativeProgress({
                        fileId,
                        derivativeType,
                        bytesTransferred: snapshot.bytesTransferred,
                        totalBytes: snapshot.totalBytes,
                        status: UPLOAD_DERIVATIVE_STATES.UPLOADING,
                    }));
                },
                (error) => {
                    console.error(`Error uploading ${fileName} (${derivativeType}):`, error);
                    handleRetry(error);
                },
                async () => {
                    try {
                        // Verification Phase (FF-UPLOAD-15)
                        const url = await getDownloadURL(uploadTask.snapshot.ref);
                        if (!url) {
                            throw new Error(`Verification failed: download URL empty for ${derivativeType}`);
                        }

                        dispatch(setDerivativeVerified({
                            fileId,
                            derivativeType,
                            url,
                        }));

                        resolve({
                            derivativeType,
                            url,
                            totalBytes: uploadTask.snapshot.totalBytes,
                            fileName,
                        });
                    } catch (verifyError) {
                        handleRetry(verifyError);
                    }
                }
            );

            const handleRetry = async (error) => {
                if (retries < maxRetries) {
                    retries++;
                    const delayMs = initialRetryDelay * Math.pow(2, retries);
                    console.log(`Retrying ${fileName} (${derivativeType}) in ${delayMs}ms... (Attempt ${retries}/${maxRetries})`);
                    
                    dispatch(retryDerivative({ fileId, derivativeType }));
                    await delay(delayMs);
                    executeUpload().then(resolve).catch(reject);
                } else {
                    dispatch(updateDerivativeProgress({
                        fileId,
                        derivativeType,
                        status: UPLOAD_DERIVATIVE_STATES.FAILED,
                    }));
                    reject(error);
                }
            };
        });
    };

    return executeUpload();
};

/**
 * Backward compatibility wrapper for uploadFile
 */
export const uploadFile = async (
    storage,
    type,
    domain,
    id,
    collectionId,
    file,
    dispatch,
    fileId,
    dateTimeOriginal,
    dimensions
) => {
    const result = await uploadDerivativeWorker({
        storage,
        derivativeType: type,
        domain,
        projectId: id,
        collectionId,
        file,
        fileName: file.name,
        dispatch,
        fileId,
    });

    return {
        name: file.name,
        lastModified: file.lastModified,
        dateTimeOriginal,
        url: result.url,
        fileId,
        dimensions,
        type,
    };
};

/**
 * Phase 3 & 4: Process file (EXIF, Dimensions, Compression) with discrete processing stages
 */
export const processFileArtifacts = async (fileObj, dispatch) => {
    const { id: fileId, rawFile, name } = fileObj;

    // Step 1: EXIF Extraction
    dispatch(setFileProcessing({
        fileId,
        step: PROCESSING_STEPS.EXIF,
        progress: 25,
    }));

    let dateTimeOriginal;
    try {
        const exifData = await extractExifData(rawFile);
        if (exifData?.DateTimeOriginal?.value) {
            const rawDate = Array.isArray(exifData.DateTimeOriginal.value)
                ? exifData.DateTimeOriginal.value[0]
                : exifData.DateTimeOriginal.value;
            if (typeof rawDate === 'string') {
                const formattedDateString = rawDate.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
                const parsedDate = new Date(formattedDateString);
                if (!isNaN(parsedDate.getTime())) {
                    dateTimeOriginal = parsedDate.toISOString();
                }
            }
        }
    } catch (e) {
        console.warn(`Could not extract EXIF for ${name}:`, e);
    }

    if (!dateTimeOriginal) {
        dateTimeOriginal = new Date(rawFile.lastModified || Date.now()).toISOString();
    }

    // Step 2: Dimensions Extraction
    dispatch(setFileProcessing({
        fileId,
        step: PROCESSING_STEPS.DIMENSIONS,
        progress: 50,
    }));

    let dimensions = { width: 0, height: 0 };
    try {
        dimensions = await getImageDimensions(rawFile);
    } catch (e) {
        console.warn(`Could not read dimensions for ${name}:`, e);
    }

    dispatch(setFileMetadata({
        fileId,
        metadata: { dateTimeOriginal, dimensions },
    }));

    // Step 3: Compression
    dispatch(setFileProcessing({
        fileId,
        step: PROCESSING_STEPS.COMPRESSION,
        progress: 75,
    }));

    const compressedWeb = await imageCompression(rawFile, {
        maxWidthOrHeight: 4096,
        maxSizeMB: 4,
        useWebWorker: true,
    });

    const compressedThumb = await imageCompression(rawFile, {
        maxWidthOrHeight: 1024,
        maxSizeMB: 0.1,
        fileType: 'image/webp',
        initialQuality: 0.7,
        useWebWorker: true,
    });

    const webFile = new File([compressedWeb], name, { type: compressedWeb.type || 'image/jpeg' });
    const thumbFile = new File([compressedThumb], name, { type: compressedThumb.type || 'image/webp' });

    dispatch(setFileProcessing({
        fileId,
        step: PROCESSING_STEPS.DONE,
        progress: 100,
    }));

    dispatch(initFileDerivatives({
        fileId,
        derivatives: {
            web: { totalBytes: webFile.size, status: UPLOAD_DERIVATIVE_STATES.PENDING },
            thumb: { totalBytes: thumbFile.size, status: UPLOAD_DERIVATIVE_STATES.PENDING },
        },
    }));

    return {
        fileId,
        name,
        rawFile,
        webFile,
        thumbFile,
        dateTimeOriginal,
        dimensions,
    };
};

/**
 * Main Upload Pipeline Entry Point
 */
export const handleUpload = async ({
    domain,
    files,
    id,
    collectionId,
    importFileSize,
    dispatch,
    collectionName,
    sectionId,
    bucketUrl,
    concurrency = 4,
}) => {
    console.log(`Starting upload pipeline for ${files.length} files to bucket: ${bucketUrl || 'default'}`);
    const storage = await getStorageForDomain(domain, bucketUrl);
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // 1. Initialize Canonical Session State with Collision-Proof IDs (FF-UPLOAD-13)
    const initialFiles = files.map((file, index) => {
        const fileId = generateUploadId(sessionId, file, index);
        return {
            id: fileId,
            name: file.name,
            size: file.size,
            originalSize: file.size,
            rawFile: file,
        };
    });

    dispatch(startUploadSession({
        sessionId,
        files: initialFiles.map(({ rawFile, ...rest }) => rest),
    }));
    dispatch(setUploadStatus(UPLOAD_SESSION_STATUS.OPEN));

    const pool = new UploadWorkerPool(concurrency);

    // 2. Process and Upload Each File Deterministically
    const uploadTasks = initialFiles.map((fileObj) => pool.enqueue(async () => {
        try {
            // Stage A: Processing (EXIF, Dimensions, Compression)
            const processed = await processFileArtifacts(fileObj, dispatch);

            // Stage B: Parallel Derivative Uploads (FF-UPLOAD-05)
            const [webResult, thumbResult] = await Promise.all([
                uploadDerivativeWorker({
                    storage,
                    derivativeType: 'web',
                    domain,
                    projectId: id,
                    collectionId,
                    file: processed.webFile,
                    fileName: fileObj.name,
                    dispatch,
                    fileId: fileObj.id,
                }),
                uploadDerivativeWorker({
                    storage,
                    derivativeType: 'thumb',
                    domain,
                    projectId: id,
                    collectionId,
                    file: processed.thumbFile,
                    fileName: fileObj.name,
                    dispatch,
                    fileId: fileObj.id,
                }),
            ]);

            // Stage C: Deterministic File Completion & Verification (FF-UPLOAD-06, FF-UPLOAD-15)
            dispatch(setFileVerifying({ fileId: fileObj.id }));

            if (!webResult?.url || !thumbResult?.url) {
                throw new Error(`Incomplete derivatives for ${fileObj.name}`);
            }

            dispatch(setFileCompleted({
                fileId: fileObj.id,
                urls: {
                    web: webResult.url,
                    thumb: thumbResult.url,
                },
            }));

            return {
                name: fileObj.name,
                lastModified: fileObj.rawFile.lastModified,
                dateTimeOriginal: processed.dateTimeOriginal,
                dimensions: processed.dimensions,
                url: webResult.url,
                thumbUrl: thumbResult.url,
                thumbAvailable: true,
                fileId: fileObj.id,
            };
        } catch (error) {
            console.error(`Failed to complete upload for ${fileObj.name}:`, error);
            dispatch(setFileFailed({
                fileId: fileObj.id,
                error: error.message || 'Upload failed',
            }));
            return null;
        }
    }));

    const results = await Promise.allSettled(uploadTasks);

    const finalUploadedFiles = results
        .filter((r) => r.status === 'fulfilled' && r.value !== null)
        .map((r) => r.value);

    const allSucceeded = finalUploadedFiles.length === initialFiles.length && initialFiles.length > 0;

    if (finalUploadedFiles.length > 0) {
        try {
            const { pin } = await addUploadedFilesToFirestore(
                domain,
                id,
                collectionId,
                importFileSize,
                finalUploadedFiles,
                sectionId
            );
            await addUploadCompletionEventToFirestore(
                domain,
                id,
                collectionId,
                finalUploadedFiles,
                importFileSize,
                collectionName
            );

            trackEvent('gallery_uploaded', {
                domain,
                size: importFileSize,
                files: finalUploadedFiles.length,
            });

            dispatch(fetchProjects({ currentDomain: domain }));

            if (allSucceeded) {
                dispatch(setUploadStatus(UPLOAD_SESSION_STATUS.COMPLETED));
                showAlert('success', 'All files uploaded successfully!');
                return { uploadedFiles: finalUploadedFiles, pin, error: null };
            } else {
                dispatch(setUploadStatus(UPLOAD_SESSION_STATUS.FAILED));
                showAlert('error', 'Some files failed to upload. Check the list.');
                return { uploadedFiles: finalUploadedFiles, pin, error: 'Partial failure' };
            }
        } catch (error) {
            console.error('Firestore update failed:', error);
            dispatch(setUploadStatus(UPLOAD_SESSION_STATUS.FAILED));
            showAlert('error', 'Upload record failed to save.');
            return { uploadedFiles: finalUploadedFiles, error: error.message, pin: null };
        }
    } else {
        dispatch(setUploadStatus(UPLOAD_SESSION_STATUS.FAILED));
        showAlert('error', 'No files were uploaded.');
        return { uploadedFiles: [], error: 'All files failed', pin: null };
    }
};

/**
 * Upload Cover Photo
 */
export const uploadCover = async (file, project) => {
    const storage = await getStorageForDomain(project.domain);
    const storageRef = ref(storage, `covers/${project.domain}/${project.id}/${file.name}`);

    const uploadMetadata = {
        ...metadata,
        contentType: file.type || 'image/jpeg',
    };

    await uploadBytes(storageRef, file, uploadMetadata);
    const newCoverUrl = await getDownloadURL(storageRef);

    const projectDocRef = doc(db, "studios", project.domain, "projects", project.id);
    await updateDoc(projectDocRef, { projectCover: newCoverUrl });

    return newCoverUrl;
};

/**
 * Upload Studio Logo
 */
export const uploadStudioLogo = async (file, studioDomain) => {
    const storage = await getStorageForDomain(studioDomain);
    const storageRef = ref(storage, `branding/${studioDomain}/logo/${file.name}`);

    const uploadMetadata = {
        ...metadata,
        contentType: file.type || 'image/jpeg',
    };

    await uploadBytes(storageRef, file, uploadMetadata);
    const newLogoUrl = await getDownloadURL(storageRef);

    const studioDocRef = doc(db, "studios", studioDomain);
    await updateDoc(studioDocRef, { studioLogo: newLogoUrl });

    return newLogoUrl;
};
