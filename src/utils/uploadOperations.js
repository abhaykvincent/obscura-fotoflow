import {
    uploadBytesResumable,
    getDownloadURL,
    ref,
    list,
} from "firebase/storage";
import { db, storage } from '../firebase/app';
import { delay } from "./generalUtils";
import { showAlert } from "../app/slices/alertSlice";
import { trackEvent } from "../analytics/utils";
import { addUploadedFilesToFirestore } from "../firebase/functions/firestore";


// Firebase Cloud Storage

// File Single upload function
export const uploadFile = (domain,id, collectionId, file,setUploadLists) => {
    console.log(file)
    
    const MAX_RETRIES = 5;
    const INITIAL_RETRY_DELAY = 500;
    let retries = 0;

    return new Promise((resolve, reject) => {
        
        const storageRef = ref(storage, `${domain}/${id}/${collectionId}/${file.name}`);
        let uploadTask;

        try {
            console.log(`Uploading ${file.name}...`)
            uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on('state_changed',
                // Handle progress Uploads
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    //setUploadList aarraay of filee object  matches file.name with the progress of the upload
                    setUploadLists((prevState) => {
                        return prevState.map((fileProgress) => {
                            if (fileProgress.name === file.name) {
                                return {
                                    name: file.name,
                                    size: file.size,
                                    type: file.type,
                                    status: 'uploading',
                                    progress: Math.round(progress)
                                }
                            }
                            return fileProgress;
                        })
                    })
                    
                },
                (error) => {
                    // Handle unsuccessful Uploads
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
                    console.log(`%c ${file.name} File uploaded successfully in the first try`, 'color:green');
                    let url = await getDownloadURL(uploadTask.snapshot.ref);
                    console.log(`Download URL for ${file.name}: ${url}`);
                    await setUploadLists((prevState) => {
                        return prevState.map((fileProgress) => {
                            if (fileProgress.name === file.name) {
                                return {
                                    name: file.name,
                                    size: file.size,
                                    type: file.type,
                                    status:'uploaded',
                                    url
                                }
                            }
                            return fileProgress;
                        })
                    })
                    resolve({
                        name: file.name,
                        lastModified:file.lastModified,
                        url
                    }); // Resolve the promise when the file is successfully uploaded
                }
            );
        } catch (error) {
            console.error("Error uploading file:", error);
            return reject(error); // Reject the promise with the error  
        }

        async function retryUpload() {
            uploadTask.cancel(); // Cancel the current upload task

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
    //update uploadList files that maatches current slice eaach files status as initializing
    setUploadLists(prevState => {
        return prevState.map((file, index) => {
            if (slice[index] && file.name === slice[index].name) {
                console.log('%c ' + file.name + ' file status changed to initializing', 'color:yellow');
                return {
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    status: 'initializing'
                }
            }
            return file;
        })
    })
    const uploadPromises = slice.map(file => {
        return uploadFile(domain,id, collectionId, file,setUploadLists);
    });

    // Use Promise.all to initiate all file uploads simultaneously
    const results = await Promise.all(uploadPromises);
    console.log("!!!! inside slice", 'color:red');

    return results;
};

// Upload ENTRY POINT
export const handleUpload = async (domain,files, id, collectionId,importFileSize, setUploadLists,setUploadStatus, retries = 2) => {
    setUploadLists(files)
    // Slice the files array into smaller arrays of size sliceSize
    const sliceSize = 5;
    console.log('%c ' + files.length + ' files to upload', 'color:yellow');
    let uploadedFiles = [];

    // Upload the slices sequentially
    for (let i = 0; i < files.length; i += sliceSize) {
        const slice = files.slice(i, i + sliceSize);
        try {
            // Upload Single Slice
            const results = await sliceUpload(domain,slice, id, collectionId,setUploadLists);
            uploadedFiles.push(...results);
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
        .then((results) => {
            let failedFiles = [];
            let uploadedFiles = [];
            results = [].concat(...results);
            results.forEach((result, index) => {
                if (result.status === 'rejected')
                    failedFiles.push(files[index]);
                else
                    uploadedFiles.push(result);
            });

            if (failedFiles.length == 0) {
                setUploadStatus('completed')
                console.log("%c All files uploaded successfully!", 'color:green');
                

                addUploadedFilesToFirestore(domain,id, collectionId,importFileSize, uploadedFiles)
                    .then(() => {
                        showAlert('success', 'All files uploaded successfully!')
                        trackEvent('gallery_uploaded', {
                            domain: domain,
                            size: importFileSize,
                            files: uploadedFiles.length,
                        });
                    })
                    .catch((error) => {
                        console.error('Error adding uploaded files to project:', error.message);
                        showAlert('error', error.message)
                        throw error;
                    });
                return uploadedFiles;
            } else {
                console.log("Some files failed to upload. Reuploading missed files...");
                return handleUpload(domain, failedFiles, id, collectionId,setUploadLists, retries - 1);
            }
        })
        .catch((error) => {
            console.error("Error uploading files:", error);
            throw error; // Propagate the error if needed
        });
}



// Firestore Database
