import {
    uploadBytesResumable,
    getDownloadURL,
    list,
    ref,
    deleteObject,
    listAll
} from "firebase/storage";
import { db } from '../firebase/app';
import { getStorageForDomain } from "./uploadOperations";

// Fetch Images
export const fetchImageUrls = async (domain, projectId, collectionId, setImageUrls, page, pageSize) => {
    console.log(`Fetching images for page ${page}`);
    
    const storage = await getStorageForDomain(domain);
    // Reference to the images folder within the specific studio, project, and collection
    // New architecture: web/{domain}/{projectId}/{collectionId}
    const storageRef = ref(storage, `web/${domain}/${projectId}/${collectionId}`);

    try {
        const imageUrls = []; // Create an empty array to store the image URLs
    
        // Calculate starting and ending indexes based on the page and page size
        const startAt = (page - 1) * pageSize;
        const endAt = startAt + pageSize;

        const listResult = await list(storageRef);

        let currentIndex = 0;
        for (const item of listResult.items) {
            if (currentIndex >= startAt && currentIndex < endAt) {
                const downloadURL = await getDownloadURL(item);
                imageUrls.push(downloadURL);
            }

            currentIndex++;
            if (currentIndex === endAt) break; // Break the loop once endAt is reached
        }

        setImageUrls(imageUrls); // Set the image URLs outside the loop
    } catch (error) {
        console.error("Error fetching images:", error);
    }

    console.log('Fetching images FINISHED');
};

export const fetchImageInfo = async (domain, projectId, collectionId) => {
    const storage = await getStorageForDomain(domain);
    // Reference to the images folder within the specific studio, project, and collection
    // New architecture: web/{domain}/{projectId}/{collectionId}
    const storageRef = ref(storage, `web/${domain}/${projectId}/${collectionId}`);
    const imageInfoList = [];

    try {
        const listResult = await list(storageRef);

        for (const item of listResult.items) {
            const downloadURL = await getDownloadURL(item);
            const imageName = item.name.split('/').pop(); // Extracting the image name

            // Pushing image info (name and empty status) into the list
            imageInfoList.push({
                name: imageName,
                isSelected: false 
            });
        }
    } catch (error) {
        console.error("Error fetching image info:", error);
    }

    return imageInfoList;
};


export const deleteCollectionFromStorage = async (domain,id, collectionId) => {
    const storage = await getStorageForDomain(domain);
    
    // Delete web version
    const storageRefWeb = ref(storage, `web/${domain}/${id}/${collectionId}`);
    try {
        const listResult = await list(storageRefWeb);
        for (const item of listResult.items) {
            await deleteObject(item);
        }
    } catch (e) { console.warn("Web collection not found or already deleted", e); }

    // Delete thumbnail version
    const storageRefThumb = ref(storage, `thumb/${domain}/${id}/${collectionId}`);
    try {
        const listThumbResult = await list(storageRefThumb);
        for (const item of listThumbResult.items) {
            await deleteObject(item);
        }
    } catch (e) { console.warn("Thumb collection not found or already deleted", e); }

}

// stoage is in format project/collection/image
export const deleteProjectFromStorage = async (domain, bucketUrl, projectId) => {
    console.log(domain, bucketUrl, projectId);
    try {
        const storage = await getStorageForDomain(domain, bucketUrl);
        
        const prefixes = ['web', 'thumb', 'covers'];
        
        for (const prefix of prefixes) {
            const projectRef = ref(storage, `${prefix}/${domain}/${projectId}`);
            try {
                // 1. List all items and prefixes directly under the project path
                const projectList = await list(projectRef);
                console.log(`Cleaning ${prefix} prefix for project...`);

                // 2. Iterate through projectList prefixes (collections) to delete their contents
                for (const collectionRef of projectList.prefixes) {
                    const collectionList = await listAll(collectionRef);
                    const deletionPromises = collectionList.items.map(imageRef => deleteObject(imageRef));
                    await Promise.all(deletionPromises);
                }

                // 3. Delete any files directly under the projectRef
                const topLevelFileDeletionPromises = projectList.items.map(fileRef => deleteObject(fileRef));
                await Promise.all(topLevelFileDeletionPromises);
            } catch (e) {
                console.warn(`Could not clean ${prefix} folder for project ${projectId}:`, e.message);
            }
        }
        
        console.log('Project contents deleted successfully from all prefix folders.');
    } catch (error) {
        console.error('Error during project deletion from storage:', error);
        throw error; 
    }
};
  
// Line Complexity -> 3.5 -> 1.0