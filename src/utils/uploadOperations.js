import {
    uploadBytesResumable,
    getDownloadURL,
    ref,
    list,
    uploadBytes,
} from "firebase/storage";
import { db, storage } from '../firebase/app';
import { delay } from "./generalUtils";
import { showAlert } from "../app/slices/alertSlice";
import { 
    updateUploadFile, 
    // The following actions will be used in handleUpload or other parts
    // startUploadSession, 
    // setUploadStatus, 
    // clearUploadSession 
} from "../app/slices/uploadSlice";
import { trackEvent } from "../analytics/utils";
import { addUploadedFilesToFirestore } from "../firebase/functions/firestore";

import imageCompression from 'browser-image-compression';
import { addAllFileSizesToMB } from "./fileUtils";
import { doc, updateDoc } from "firebase/firestore";
import { set } from "date-fns";

// Image Compression
const compressImages = async (files, maxWidthOrHeight) => {
    const options = {
        maxSizeMB: 1,
        maxWidthOrHeight,
        useWebWorker: true,
    };
    return Promise.all(
        [...files].map((file) => imageCompression(file, options).catch((error) => {
            console.error('Image compression failed:', error);
            return file; // Return the original file on error
        }))
    );
};


// Firebase Cloud Storage
const metadata = {
    cacheControl: 'public, max-age=31536000', // Cache for 1 year
  };
// File Single upload function
// Remove setUploadLists, add dispatch and fileId
export const uploadFile = async (domain, id, collectionId, file, dispatch, fileId) => {
    const MAX_RETRIES = 5;
    const INITIAL_RETRY_DELAY = 500;
    let retries = 0;

    // Dispatch action to indicate start of upload for this file
    // Assuming fileId is derived from original file object if `file` here is the compressed one.
    // For simplicity, we'll use file.name as part of the ID if fileId isn't directly the name.
    // It's crucial that fileId matches what was used in startUploadSession.
    dispatch(updateUploadFile({ fileId, changes: { status: 'uploading', progress: 0 } }));

    return new Promise((resolve, reject) => {
        const storageRef = ref(storage, `${domain}/${id}/${collectionId}/${file.name}`);
        let uploadTask;

        try {
            uploadTask = uploadBytesResumable(storageRef, file, metadata);

            uploadTask.on('state_changed',
                (snapshot) => {
                    // Optional: Dispatch progress updates
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    dispatch(updateUploadFile({ fileId, changes: { progress } }));
                },
                (error) => {
                    console.error(`Error during initial upload for ${file.name} (ID: ${fileId}):`, error);
                    dispatch(updateUploadFile({ fileId, changes: { status: 'failed', error: error.message } }));
                    retries++;
                    // Simplified retry logic for clarity, actual retry might need to preserve uploadTask instance
                    // or re-initialize it carefully. The original retryUpload function is complex.
                    // For this refactor, we'll just mark as failed and let higher-level retry handle it if designed so.
                    // If retryUpload is essential within uploadFile, it also needs dispatch calls.
                    // The original retryUpload is kept below but might need fileId propagation if used.
                    try {
                        retryUpload(); 
                    } catch (retryError) {
                        console.error(`Error during retry upload for ${file.name} (ID: ${fileId}):`, retryError);
                        dispatch(updateUploadFile({ fileId, changes: { status: 'failed', error: retryError.message } }));
                        return reject(retryError); 
                    }
                },
                async () => {
                    let url = await getDownloadURL(uploadTask.snapshot.ref);
                    dispatch(updateUploadFile({ fileId, changes: { status: 'uploaded', url: url, progress: 100 } }));
                    resolve({
                        name: file.name, // Original name might be needed if fileId is different
                        lastModified: file.lastModified,
                        url,
                        fileId // Include fileId in resolution if useful for caller
                    });
                }
            );
        }
        catch (error) {
            console.error("Error uploading file:", error);
            dispatch(updateUploadFile({ fileId, changes: { status: 'failed', error: error.message } }));
            return reject(error);
        }

        // Nested retryUpload function, ensure it uses dispatch and fileId
        async function retryUpload() {
            if (uploadTask) { // Check if uploadTask exists
                uploadTask.cancel(); // Cancel the current upload task
                uploadTask.off('state_changed'); // Remove all listeners
            }

            if (retries < MAX_RETRIES) {
                let retryDelay = INITIAL_RETRY_DELAY * Math.pow(2, retries);
                console.log(`Retrying upload of ${file.name} (ID: ${fileId}) in ${retryDelay / 1000} seconds`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));

                // Re-initialize uploadTask for retry
                uploadTask = uploadBytesResumable(storageRef, file, metadata);
                dispatch(updateUploadFile({ fileId, changes: { status: 'uploading', progress: 0, retryAttempt: retries } }));


                uploadTask.on('state_changed',
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        dispatch(updateUploadFile({ fileId, changes: { progress } }));
                    },
                    async (error) => {
                        console.error(`Error during upload retry for ${file.name} (ID: ${fileId}):`, error);
                        retries++;
                        // If retry fails, dispatch 'failed' status
                        if (retries >= MAX_RETRIES) {
                            dispatch(updateUploadFile({ fileId, changes: { status: 'failed', error: error.message } }));
                            reject(new Error(`Exceeded maximum retries (${MAX_RETRIES}) for ${file.name}`));
                        } else {
                            // It's better to dispatch 'failed' here and let the main promise reject,
                            // or ensure retryUpload itself returns a promise that's handled.
                            // For now, simple dispatch and continue to next retry.
                             dispatch(updateUploadFile({ fileId, changes: { status: 'retrying', error: error.message } }));
                            await retryUpload(); // Recursive call, be cautious with state
                        }
                    },
                    async () => {
                        console.log(`%c ${file.name} (ID: ${fileId}) File uploaded successfully on ${retries + 1} retry`, 'color:yellow');
                        let url = await getDownloadURL(uploadTask.snapshot.ref);
                        dispatch(updateUploadFile({ fileId, changes: { status: 'uploaded', url: url, progress: 100 } }));
                        resolve({
                            name: file.name,
                            url,
                            fileId
                        });
                    }
                );
            } else {
                console.log(`==========================`);
                console.log(`%c ${file.name} (ID: ${fileId}) File upload failed after ${MAX_RETRIES} retries`, 'color:red');
                console.log(`==========================`);
                dispatch(updateUploadFile({ fileId, changes: { status: 'failed', error: `Exceeded maximum retries (${MAX_RETRIES})` } }));
                reject(new Error(`Exceeded maximum retries (${MAX_RETRIES}) for ${file.name}`));
            }
        }
    });
};

// Upload a slice of files with sliceSize : 5
// Remove setUploadLists, add dispatch
const sliceUpload = async (domain, slice, id, collectionId, dispatch, originalFilesInfo) => {
    // originalFilesInfo is an array of {name, id} for files in this slice
    // to correctly map compressed files back to their original IDs.

    /* Removed old code that directly manipulated local state via setUploadLists */
    // Example: setUploadLists(prevState => { ... }) is no longer needed here.
    // Status updates are handled by uploadFile via dispatch.

    try {
        // Image compression logic remains the same.
        // The key is to correctly pass the fileId for the *original* file
        // to uploadFile, even when uploading a compressed version.
        const [compressedFiles, compressedThumbnailFiles] = await Promise.all([
            compressImages([...slice.map(item => item.rawFile)], 1920),
            compressImages([...slice.map(item => item.rawFile)], 480)
        ]);

        // We need to map these compressed files back to their original fileIds.
        // Assuming slice elements are objects like { rawFile: File, id: string }
        // where 'id' is the fileId generated in handleUpload.

        const thumbnailUploadPromises = compressedThumbnailFiles.map((compressedFile, index) => {
            const originalFile = slice[index]; // Get the original file info (name, id)
            const fileId = originalFile.id; // This is the crucial part: use the pre-generated ID
            // Create a new File object for the compressed data but with original name for storage path
            const namedCompressedFile = new File([compressedFile], originalFile.rawFile.name, { type: compressedFile.type });
            return uploadFile(domain, id, `${collectionId}-thumb`, namedCompressedFile, dispatch, fileId);
        });

        const uploadPromises = compressedFiles.map((compressedFile, index) => {
            const originalFile = slice[index];
            const fileId = originalFile.id;
            const namedCompressedFile = new File([compressedFile], originalFile.rawFile.name, { type: compressedFile.type });
            return uploadFile(domain, id, collectionId, namedCompressedFile, dispatch, fileId);
        });
        
        // Combine all upload promises and resolve them concurrently
        const results = Promise.all([...thumbnailUploadPromises, ...uploadPromises]);
        return results;
    } catch (error) {
        console.error("Error during slice upload:", error);
        // If compression or setup fails, we might need to mark all files in slice as failed.
        slice.forEach(fileInfo => {
            dispatch(updateUploadFile({ fileId: fileInfo.id, changes: { status: 'failed', error: "Slice processing error" } }));
        });
        throw error; // Rethrow to allow the caller to handle the error
    }
};

// Upload ENTRY POINT
// Remove setUploadLists, setUploadStatus (local setters), add dispatch
export const handleUpload = async (domain, files, id, collectionId, importFileSize, dispatch,retries = 2, sliceSize = 32 ) => {
    // 1. Generate initialFileObjects with unique IDs for Redux state
    // Using file.name as fileId here, acknowledge potential uniqueness issues.
    // A more robust approach: file.name + '-' + file.lastModified + '-' + file.size or UUID
    const initialFileObjects = files.map(file => ({
        id: file.name, // Using file.name as fileId. CONSIDER ROBUSTNESS.
        name: file.name,
        size: file.size,
        status: 'pending',
        progress: 0,
        url: null,
        rawFile: file, // Keep raw file for compression
    }));

    // Dispatch startUploadSession with these initial objects
    // Note: startUploadSession needs to be imported from uploadSlice
    // For now, assuming it's available. If not, this will be a placeholder.
    // import { startUploadSession } from "../app/slices/uploadSlice"; needs to be added.
    dispatch({ type: 'upload/startUploadSession', payload: initialFileObjects.map(({rawFile, ...rest}) => rest) }); // Dispatch only serializable data
    dispatch({ type: 'upload/setUploadStatus', payload: 'open' });


    console.log('%c ' + files.length + ' files to upload', 'color:yellow');
    let uploadedFilesCollector = []; // To collect results from sliceUpload

    // Prepare file data for slices, including their original fileId
    const filesWithIds = files.map(file => ({
        rawFile: file,
        id: file.name, // Must match the id used in initialFileObjects
        name: file.name, // Keep name for convenience if needed
    }));


    // Upload the slices sequentially
    for (let i = 0; i < filesWithIds.length; i += sliceSize) {
        const sliceOfFilesWithIds = filesWithIds.slice(i, i + sliceSize);
        try {
            const startTime = Date.now();
            console.groupCollapsed('Uploading Slice ' + (i / sliceSize + 1) + ' of ' + Math.ceil(filesWithIds.length / sliceSize));
            
            // Pass dispatch and the current slice (which includes fileId)
            const results = await sliceUpload(domain, sliceOfFilesWithIds, id, collectionId, dispatch);
            uploadedFilesCollector.push(...results); // results is an array of promises from uploadFile

            const endTime = Date.now();
            const duration = (endTime - startTime) / 1000;
            console.log(`%c Slice upload duration : ${duration} seconds`, 'color:#0071a4');
            console.groupEnd();
        } catch (error) {
            console.error("Error uploading slice:", error);
            // Error handling for slice: individual files within slice should have been marked
            // as 'failed' by sliceUpload or uploadFile.
            // If sliceUpload itself throws (e.g., compression error before individual uploads),
            // then handleUpload needs to decide how to mark related files.
            // The current sliceUpload tries to mark files as failed.
            // We might want to dispatch a global upload status update here too.
            // dispatch(setUploadStatus('failed')); // Or some error status
            // For now, rely on individual file statuses and proceed to next slice or finish.
        }
        if (i + sliceSize < filesWithIds.length) {
            await delay(100); // Consider if this delay is still necessary
        }
    }

    // Wait for all upload promises from all slices to settle
    return Promise.allSettled(uploadedFilesCollector)
        .then((settledResults) => {
            console.log('Upload results (settled):', settledResults);
            
            let allSucceeded = true;
            const finalUploadedFiles = [];
            const failedFileOriginals = []; // Store original file objects for retry

            settledResults.forEach((result, index) => {
                // Each result corresponds to an uploadFile call (original or thumbnail)
                // We are interested in the original file uploads for addUploadedFilesToFirestore
                // Thumbnails are handled, but their direct result isn't usually added to this list.
                if (result.status === 'fulfilled' && result.value && result.value.url && !result.value.url.includes('-thumb')) {
                    finalUploadedFiles.push({
                        name: result.value.name, // Name from resolved promise
                        url: result.value.url,
                        lastModified: result.value.lastModified, // Ensure this is passed through
                        thumbAvailable: true, // Assuming thumb was also attempted
                    });
                } else if (result.status === 'rejected' || (result.status === 'fulfilled' && (!result.value || !result.value.url))) {
                    // This logic needs to be robust. If a file (non-thumbnail) failed, mark allSucceeded false.
                    // And identify which *original file* from the input `files` array failed.
                    // This is tricky because `settledResults` is a flat list of main + thumb uploads.
                    // We need to map back to the original `filesWithIds` using fileId if possible.
                    // For simplicity in this step, if any promise rejected, we assume not all succeeded.
                    // A more precise check would iterate through `initialFileObjects` and check their final status in Redux store.
                    allSucceeded = false;
                    // Identifying the failed original file requires careful mapping.
                    // For now, we'll assume that if any part of a file's upload (main or thumb) fails,
                    // the `uploadFile` promise for the main file would reject or not yield a URL.
                    // This part needs refinement to correctly identify which *original files* to retry.
                }
            });

            // Check Redux store for final status of each file
            // This is a more reliable way to check success than trying to parse settledResults directly for all cases.
            // For this, we would need `getState` or select the list:
            // const currentUploadList = getState().upload.uploadList; // PSEUDOCODE for getting state
            // allSucceeded = initialFileObjects.every(f => currentUploadList[f.id]?.status === 'uploaded');
            // For now, we'll use a simplified check based on promise rejections.
            // Re-evaluating `allSucceeded` based on `finalUploadedFiles` count vs `initialFileObjects`
            // This isn't perfect because thumbnails are separate.
            // A better check would be to iterate through `initialFileObjects` and see if each one has a corresponding successful upload in `finalUploadedFiles`
            
            const successfullyUploadedOriginals = new Set(finalUploadedFiles.map(f => f.name));
            initialFileObjects.forEach(origFile => {
                if (!successfullyUploadedOriginals.has(origFile.name)) {
                    allSucceeded = false;
                    // Find the original file from the input `files` array.
                    const failedInputFile = files.find(f => f.name === origFile.name);
                    if (failedInputFile) {
                        failedFileOriginals.push(failedInputFile);
                    }
                }
            });


            // After removing recursive retry, 'allSucceeded' reflects if all initial files passed *individual* retries.
            // The 'retries' parameter for handleUpload is no longer used for recursion.
            if (allSucceeded) {
                dispatch({ type: 'upload/setUploadStatus', payload: 'completed' });
                console.log("%c All files processed successfully (after individual retries)!", 'color:green');
                
                let getPIN;
                // Only successfully uploaded files are passed to Firestore
                return addUploadedFilesToFirestore(domain, id, collectionId, importFileSize, finalUploadedFiles)
                    .then((response) => {
                        getPIN = response.pin;
                        showAlert('success', 'All files uploaded successfully!');
                        trackEvent('gallery_uploaded', {
                            domain: domain,
                            size: importFileSize,
                            files: finalUploadedFiles.length,
                        });
                        return { uploadedFiles: finalUploadedFiles, pin: getPIN, error: null };
                    })
                    .catch((error) => {
                        console.error('Error adding uploaded files to project:', error.message);
                        showAlert('error', error.message);
                        dispatch({ type: 'upload/setUploadStatus', payload: 'failed' }); // Or 'completed_with_firestore_error'
                        // Even if Firestore fails, some files might have uploaded to storage.
                        return { uploadedFiles: finalUploadedFiles, error: error.message, pin: null }; 
                    });
            } else {
                // Some files failed even after individual retries within uploadFile.
                console.log("Some files failed to upload after individual retries.");
                dispatch({ type: 'upload/setUploadStatus', payload: 'failed' }); // Or 'completed_with_errors'
                showAlert('error', 'Some files failed to upload. Please check the upload list for details.');
                // Return the files that did succeed, along with an error message.
                return { uploadedFiles: finalUploadedFiles, error: "Some files failed to upload.", pin: null };
            }
        })
        .catch((error) => {
            // This catch handles errors from Promise.allSettled or critical issues before it.
            console.error("Critical error during file upload processing:", error);
            dispatch({ type: 'upload/setUploadStatus', payload: 'failed' });
            showAlert('error', 'A critical error occurred during upload: ' + error.message);
            // Ensure a consistent return structure even for critical errors.
            return { uploadedFiles: [], error: error.message, pin: null };
        });
};


// Upload Cover Photo
export const uploadCover = async (file, project) => {
// Upload a slice of files with sliceSize : 5

    const storageRef = ref(storage, `${project.domain}/${project.id}/covers/${file.name}`);
    await uploadBytes(storageRef, file);
    const newCoverUrl = await getDownloadURL(storageRef);

    const projectDocRef = doc(db, "studios", project.domain, "projects", project.id);
    await updateDoc(projectDocRef, { projectCover: newCoverUrl });

    return newCoverUrl;
};


// Firestore Database
