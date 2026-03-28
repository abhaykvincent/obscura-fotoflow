import {
    uploadBytesResumable,
    getDownloadURL,
    ref,
    list,
    uploadBytes,
    getStorage,
    connectStorageEmulator,
} from "firebase/storage";
import { db, storage as defaultStorage, app } from '../firebase/app';
import { delay } from "./generalUtils";
import { showAlert } from "../app/slices/alertSlice";
import { 
    updateUploadFile, 
    startUploadSession, 
    setUploadStatus, 
    clearUploadSession 
} from "../app/slices/uploadSlice";
import { trackEvent } from "../analytics/utils";
import { addUploadedFilesToFirestore, addUploadCompletionEventToFirestore } from "../firebase/functions/firestore";
import { fetchProjects } from "../app/slices/projectsSlice";

import imageCompression from 'browser-image-compression';
import { addAllFileSizesToMB, extractExifData } from "./fileUtils";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { set } from "date-fns";

const storageInstances = {};

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

    // If a bucketUrl is found, create and connect a new storage instance.
    if (finalBucketUrl) {
        const newStorage = getStorage(app, finalBucketUrl);

        if (process.env.NODE_ENV === 'development') {
            const EMULATOR_HOST = window.location.hostname
            const EMULATOR_PORT = parseInt(process.env.REACT_APP_EMULATOR_PORT, 10);
            connectStorageEmulator(newStorage, EMULATOR_HOST, EMULATOR_PORT);
        }

        storageInstances[domain] = newStorage;
        return newStorage;
    }

    // If no bucketUrl is found for the domain, fall back to the default storage.
    return defaultStorage;
}

/**
 * Worker Pool to manage concurrent uploads and compressions.
 */
class UploadWorkerPool {
    constructor(concurrency = 4) {
        this.concurrency = concurrency;
        this.queue = [];
        this.activeCount = 0;
        this.results = [];
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

// Firebase Cloud Storage
const metadata = {
    cacheControl: 'public, max-age=41536000', // Cache for 1 year
};

// File Single upload function
export const uploadFile = async (storage, type, domain, id, collectionId, file, dispatch, fileId, dateTimeOriginal, dimensions) => {
    const MAX_RETRIES = 5;
    const INITIAL_RETRY_DELAY = 1000;
    let retries = 0;

    // Dispatch action to indicate start of upload for this file if it's the web version
    if (type === 'web') {
        dispatch(updateUploadFile({ fileId, changes: { status: 'uploading', progress: 0 } }));
    }

    return new Promise((resolve, reject) => {
        const storageRef = ref(storage, `${type}/${domain}/${id}/${collectionId}/${file.name}`);
        let uploadTask;

        const startTask = () => {
            const uploadMetadata = {
                ...metadata,
                contentType: file.type || 'image/jpeg'
            };
            uploadTask = uploadBytesResumable(storageRef, file, uploadMetadata);

            uploadTask.on('state_changed',
                (snapshot) => {
                    if (type === 'web') {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        dispatch(updateUploadFile({ fileId, changes: { progress } }));
                    }
                },
                (error) => {
                    console.error(`Error during upload for ${file.name} (${type}):`, error);
                    handleRetry(error);
                },
                async () => {
                    const url = await getDownloadURL(uploadTask.snapshot.ref);
                    if (type === 'web') {
                        dispatch(updateUploadFile({ fileId, changes: { status: 'uploaded', url, progress: 100 } }));
                    }
                    resolve({
                        name: file.name,
                        lastModified: file.lastModified,
                        dateTimeOriginal,
                        url,
                        fileId,
                        dimensions,
                        type,
                    });
                }
            );
        };

        const handleRetry = async (error) => {
            if (retries < MAX_RETRIES) {
                retries++;
                const delayMs = INITIAL_RETRY_DELAY * Math.pow(2, retries);
                console.log(`Retrying ${file.name} (${type}) in ${delayMs}ms... (Attempt ${retries})`);
                await delay(delayMs);
                startTask();
            } else {
                if (type === 'web') {
                    dispatch(updateUploadFile({ fileId, changes: { status: 'failed', error: error.message } }));
                }
                reject(error);
            }
        };

        startTask();
    });
};

// Upload ENTRY POINT
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
    concurrency = 4
}) => {
    console.log(`Starting upload for ${files.length} files to bucket: ${bucketUrl || 'default'}`);
    const storage = await getStorageForDomain(domain, bucketUrl);
    
    // 1. Initial Processing & State Setup
    const initialFileObjects = await Promise.all(files.map(async (file) => {
        const getImageDimensions = (file) => {
            return new Promise((resolve) => {
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

        const exifData = await extractExifData(file);
        let dateTimeOriginal;
        if (exifData?.DateTimeOriginal?.value) {
            const rawDate = Array.isArray(exifData.DateTimeOriginal.value) ? exifData.DateTimeOriginal.value[0] : exifData.DateTimeOriginal.value;
            if (typeof rawDate === 'string') {
                const formattedDateString = rawDate.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
                dateTimeOriginal = new Date(formattedDateString);
            }
        }
        
        if (!dateTimeOriginal || isNaN(dateTimeOriginal.getTime())) {
            dateTimeOriginal = new Date(file.lastModified || Date.now());
        }

        const dimensions = await getImageDimensions(file);

        return {
            id: `${file.name}-${file.size}-${file.lastModified}`,
            name: file.name,
            size: file.size,
            status: 'pending',
            progress: 0,
            url: null,
            rawFile: file,
            dateTimeOriginal,
            dimensions,
        };
    }));

    dispatch(startUploadSession(initialFileObjects.map(({ rawFile, dateTimeOriginal, ...rest }) => ({
        ...rest,
        dateTimeOriginal: dateTimeOriginal.toISOString()
    }))));
    dispatch(setUploadStatus('open'));

    const pool = new UploadWorkerPool(concurrency);
    const uploadTasks = initialFileObjects.map(fileObj => pool.enqueue(async () => {
        try {
            // Sequential compression per file to save memory
            const compressedWeb = await imageCompression(fileObj.rawFile, { 
                maxWidthOrHeight: 4096, 
                maxSizeMB: 4, 
                useWebWorker: true 
            });
            const compressedThumb = await imageCompression(fileObj.rawFile, { 
                maxWidthOrHeight: 1024, 
                maxSizeMB: 0.1, 
                fileType: 'image/webp', 
                initialQuality: 0.7, 
                useWebWorker: true 
            });

            // Parallel upload of web and thumb for the same file
            const [webResult] = await Promise.all([
                uploadFile(storage, 'web', domain, id, collectionId, new File([compressedWeb], fileObj.name, { type: compressedWeb.type }), dispatch, fileObj.id, fileObj.dateTimeOriginal, fileObj.dimensions),
                uploadFile(storage, 'thumb', domain, id, collectionId, new File([compressedThumb], fileObj.name, { type: compressedThumb.type }), dispatch, fileObj.id)
            ]);

            return webResult;
        } catch (error) {
            console.error(`Failed to process ${fileObj.name}:`, error);
            dispatch(updateUploadFile({ fileId: fileObj.id, changes: { status: 'failed', error: error.message } }));
            return null; // Return null so allSettled can identify failure
        }
    }));

    const results = await Promise.allSettled(uploadTasks);
    
    const finalUploadedFiles = results
        .filter(r => r.status === 'fulfilled' && r.value !== null)
        .map(r => ({
            name: r.value.name,
            url: r.value.url,
            lastModified: r.value.lastModified,
            dateTimeOriginal: r.value.dateTimeOriginal,
            dimensions: r.value.dimensions,
            thumbAvailable: true,
        }));

    const allSucceeded = finalUploadedFiles.length === initialFileObjects.length;

    if (finalUploadedFiles.length > 0) {
        try {
            const { pin } = await addUploadedFilesToFirestore(domain, id, collectionId, importFileSize, finalUploadedFiles, sectionId);
            await addUploadCompletionEventToFirestore(domain, id, collectionId, finalUploadedFiles, importFileSize, collectionName);
            
            trackEvent('gallery_uploaded', {
                domain,
                size: importFileSize,
                files: finalUploadedFiles.length,
            });

            dispatch(fetchProjects({ currentDomain: domain }));

            if (allSucceeded) {
                dispatch(setUploadStatus('completed'));
                showAlert('success', 'All files uploaded successfully!');
                return { uploadedFiles: finalUploadedFiles, pin, error: null };
            } else {
                dispatch(setUploadStatus('failed'));
                showAlert('error', 'Some files failed to upload. Check the list.');
                return { uploadedFiles: finalUploadedFiles, pin, error: 'Partial failure' };
            }
        } catch (error) {
            console.error('Firestore update failed:', error);
            dispatch(setUploadStatus('failed'));
            showAlert('error', 'Upload record failed to save.');
            return { uploadedFiles: finalUploadedFiles, error: error.message, pin: null };
        }
    } else {
        dispatch(setUploadStatus('failed'));
        showAlert('error', 'No files were uploaded.');
        return { uploadedFiles: [], error: 'All files failed', pin: null };
    }
};





// Upload Cover Photo
export const uploadCover = async (file, project) => {
// Upload a slice of files with sliceSize : 5
    const storage = await getStorageForDomain(project.domain);
    const storageRef = ref(storage, `covers/${project.domain}/${project.id}/${file.name}`);
    
    const uploadMetadata = {
        ...metadata,
        contentType: file.type || 'image/jpeg'
    };
    
    await uploadBytes(storageRef, file, uploadMetadata);
    const newCoverUrl = await getDownloadURL(storageRef);

    const projectDocRef = doc(db, "studios", project.domain, "projects", project.id);
    await updateDoc(projectDocRef, { projectCover: newCoverUrl });

    return newCoverUrl;
};

// Upload Studio Logo
export const uploadStudioLogo = async (file, studioDomain) => {
    const storage = await getStorageForDomain(studioDomain);
    const storageRef = ref(storage, `branding/${studioDomain}/logo/${file.name}`);
    
    const uploadMetadata = {
        ...metadata,
        contentType: file.type || 'image/jpeg'
    };

    await uploadBytes(storageRef, file, uploadMetadata);
    const newLogoUrl = await getDownloadURL(storageRef);

    const studioDocRef = doc(db, "studios", studioDomain);
    await updateDoc(studioDocRef, { studioLogo: newLogoUrl });

    return newLogoUrl;
};

// Firestore Database
