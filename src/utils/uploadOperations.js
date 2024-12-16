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
import { trackEvent } from "../analytics/utils";
import { addUploadedFilesToFirestore } from "../firebase/functions/firestore";

import imageCompression from 'browser-image-compression';
import { addAllFileSizesToMB } from "./fileUtils";
import { doc, updateDoc } from "firebase/firestore";
import { set } from "date-fns";

// Image Compression
const compressImages = async (files, maxWidthOrHeight) => {
    const options = {
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

// File Single upload function
export const uploadFile = async (domain,id, collectionId, file,sliceIndex,setUploadLists) => {
    const MAX_RETRIES = 5;
    const INITIAL_RETRY_DELAY = 500;
    let retries = 0;
    return new Promise((resolve, reject) => {
        const storageRef = ref(storage, `${domain}/${id}/${collectionId}/${file.name}`);
        let uploadTask;
        let lastUpdateTime = 0
        try {
            let fileUploaded = false;
            uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on('state_changed',
                () => {
                    
                },
                (error) => {
                    // Handle retry for unsuccessful Uploads
                    console.error(`Error during initial upload for ${file.name}:`, error);
                    retries++;
                    try{
                     retryUpload(); // Initiate the retry mechanism
                    }
                    catch(error) {
                        console.error(`Error during retry upload for ${file.name}:`, error);
                        return reject(error); // Reject the promise with final error
                    }
                },
                async () => {
                    // Handle successful uploads on complete 
                    let url = await getDownloadURL(uploadTask.snapshot.ref);
                    fileUploaded = true;
                    /* setUploadLists((prevState) => {
                        return prevState.map((fileProgress) => {

                            // remove the file from the list
                            if(fileProgress.name === file.name ){
                                return {
                                    ...fileProgress,
                                    status:"uploaded",
                                    url
                                };
                            }
                            return {
                                    ...fileProgress,
                            };
                        })
                    }) */
                    
                        resolve({
                        name: file.name,
                        lastModified:file.lastModified,
                        url
                    }); // Resolve the promise when the file is successfully uploaded
                    
                },
                () => {
                    // Handle upload cancellation
                    console.log(`Upload of ${file.name} cancelled.`);
                }
            );
        } 
        catch (error) {
            console.error("Error uploading file:", error);
            return reject(error); // Reject the promise with the error  
        }

        async function retryUpload() {
            uploadTask.cancel(); // Cancel the current upload task
            uploadTask.on('state_changed', null, null, null);
            if (retries < MAX_RETRIES) {
                let retryDelay = INITIAL_RETRY_DELAY * Math.pow(2, retries); // Exponential backoff
    
                console.log(`Retrying upload of ${file.name} in ${retryDelay / 1000} seconds`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
    
                uploadTask = uploadBytesResumable(storageRef, file);
    
                uploadTask.on('state_changed',
                    () => {},
                    async (error) => {
                            console.error(`Error during upload retry for ${file.name}:`, error);
                            retries++;
                            await retryUpload(); // Initiate the retry mechanism
                        },
                        async () => {
                            console.log(`%c ${file.name} File uploaded successfully on ${retries + 1} retry`, 'color:yellow');
                            let url = await getDownloadURL(uploadTask.snapshot.ref);
                            resolve({
                                name: file.name,
                                url
                            });
                        }
                );
            } else {
                console.log(`==========================`);
                console.log(`%c ${file.name} File upload failed after ${MAX_RETRIES} retries`, 'color:red');
                console.log(`==========================`);
                reject(new Error(`Exceeded maximum retries (${MAX_RETRIES}) for ${file.name}`));
            }
        }

    });
};
// Upload a slice of files with sliceSize : 5
const sliceUpload = async (domain,slice, id, collectionId,setUploadLists) => {
        /* setUploadLists(prevState => {
            return prevState.map((file, index) => {
                if (slice[index] && file.name === slice[index].name) {
                    return {
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        status: 'initializing'
                    }
                }
                else{

                    return {
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        status: file.status};
                }
            })
        })  */
   

    try {
        const [compressedFiles, compressedThumbnailFiles] = await Promise.all([
            compressImages([...slice], 720), // Pass a copy for full-sized images
            compressImages([...slice], 300) // Pass a copy for thumbnails
        ]);

        console.log(compressedFiles, compressedThumbnailFiles)
        
        const thumbnailUploadPromises = await Promise.all(
            compressedThumbnailFiles.map((file, sliceIndex) =>
                uploadFile(domain, id, `${collectionId}-thumb`, file, sliceIndex, setUploadLists)
            )
        );
        const uploadPromises = await Promise.all(
            compressedFiles.map((file, sliceIndex) =>
                uploadFile(domain, id, collectionId, file, sliceIndex, setUploadLists)
            )
        );
        
        console.log(thumbnailUploadPromises)
        console.log(uploadPromises)
        
        // Combine all upload promises and resolve them concurrently
        const results = Promise.all([ ...thumbnailUploadPromises,...uploadPromises]); 
        return results;
    } catch (error) {
        console.error("Error during slice upload:", error);
        throw error; // Rethrow to allow the caller to handle the error
    }
};

// Upload ENTRY POINT
export const handleUpload = async (domain,files, id, collectionId,importFileSize, setUploadLists,setUploadStatus, retries = 2) => {

    setUploadLists(files.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'pending'
    })))
    setUploadStatus('open');
    // Slice the files array into smaller arrays of size sliceSize
    const sliceSize = 4;
    console.log('%c ' + files.length + ' files to upload', 'color:yellow');
    let uploadedFiles = [];

    // Upload the slices sequentially
    for (let i = 0; i < files.length; i += sliceSize) {
        const slice = files.slice(i, i + sliceSize);
        try {
            // Upload Single Slice

            const startTime = Date.now()
            console.groupCollapsed('Uploading Slice ' + (i / sliceSize + 1) + ' of ' + Math.ceil(files.length / sliceSize));

            const results = await sliceUpload(domain,slice, id, collectionId,setUploadLists);
            uploadedFiles.push(...results);
            console.log(results)
            const endTime = Date.now();  // Record the end time
            const duration = (endTime - startTime) / 1000;  // Calculate duration in seconds
            console.log(`%c Slice upload duration : ${duration} seconds`, 'color:#0071a4');
            //console group end
            
            console.groupEnd();
        } catch (error) {
            console.error("Error uploading files:", error);
            throw error; // Propagate the error if needed
        }
        // Add a delay after each slice (if needed)
        if (i + sliceSize < files.length) {
            await delay(100);
        }
    }
    return Promise.all(uploadedFiles)
        .then((uploadResults) => {
            console.log('Upload results:', uploadResults);
            let failedFiles = [];
            let filteredUploadedFiles = [];
            uploadResults = [].concat(...uploadResults);
            uploadResults = uploadResults.filter(result => result !== undefined);

            uploadResults.forEach((result, index) => {
                if (result?.status === 'rejected'){
                    failedFiles.push(files[index]);
                }
                    if(result.name.includes('thumb-')){
                    }
                    else{
                        filteredUploadedFiles.push({...result, thumbAvailable:true});
                    }
            });
            if (failedFiles.length == 0) {
                setUploadStatus('completed')
                console.log("%c All files uploaded successfully!", 'color:green');
      
                let getPIN ;
                // UPDATE Project in Firestore
                addUploadedFilesToFirestore(domain,id, collectionId,importFileSize, filteredUploadedFiles)
                .then((response) => {
                    getPIN = response.pin
                    showAlert('success', 'All files uploaded successfully!')
                    
                    trackEvent('gallery_uploaded', {
                        domain: domain,
                        size: importFileSize,
                        files: filteredUploadedFiles.length,
                    });
                    setUploadLists([])
                    setUploadStatus('completed')

                    return {filteredUploadedFiles,pin:response.pin}
                })
                .catch((error) => {
                    console.error('Error adding uploaded files to project:', error.message);
                    showAlert('error', error.message)
                    throw error;
                });
                return {uploadedFiles,pin:getPIN}
            }
            else {
                console.log("Some files failed to upload. Reuploading missed files...");
                return handleUpload(domain, failedFiles, id, collectionId,setUploadLists, retries - 1);
            }
        })
        .catch((error) => {
            console.error("Error uploading files:", error);
            throw error; // Propagate the error if needed
        });
}
export const uploadCover = async (file, project) => {
    const storageRef = ref(storage, `${project.domain}/${project.id}/covers/${file.name}`);
    await uploadBytes(storageRef, file);
    const newCoverUrl = await getDownloadURL(storageRef);

    const projectDocRef = doc(db, "studios", project.domain, "projects", project.id);
    await updateDoc(projectDocRef, { projectCover: newCoverUrl });

    return newCoverUrl;
};


// Firestore Database
