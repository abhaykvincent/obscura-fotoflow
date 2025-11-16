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
    const storageRef = ref(storage, `${domain}/${projectId}/${collectionId}`);

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
    const storageRef = ref(storage, `${domain}/${projectId}/${collectionId}`);
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
    const storageRef = ref(storage, `${domain}/${id}/${collectionId}`);
    const listResult = await list(storageRef);

    for (const item of listResult.items) {
        await deleteObject(item);
    }

    const storageRefThumb = ref(storage, `${domain}/${id}/${collectionId}-thumb`);
    const listThumbResult = await list(storageRefThumb);

    for (const item of listThumbResult.items) {
        await deleteObject(item);
    }

}

// stoage is in format project/collection/image
export const deleteProjectFromStorage = async (domain, bucketUrl, projectId) => {
    console.log(domain, bucketUrl, projectId);
    try {
        const storage = await getStorageForDomain(domain, bucketUrl);
        const projectRef = ref(storage, `${domain}/${projectId}`);
        
        // 1. List all items and prefixes directly under the project path
        const projectList = await list(projectRef);
        console.log('Project prefixes (collections):', projectList.prefixes);

        // 2. Iterate through projectList prefixes (collections) to delete their contents
        for (const collectionRef of projectList.prefixes) {
            console.log('Listing contents of collection:', collectionRef.fullPath);
            const collectionList = await listAll(collectionRef); // Use listAll for a complete list
            console.log(collectionList.items.length, 'images found in collection.');

            // Iterate through images in each collection
            const deletionPromises = collectionList.items.map(imageRef => {
                console.log('Deleting image:', imageRef.fullPath);
                return deleteObject(imageRef);
            });

            // Wait for all image deletions in the current collection to complete
            await Promise.all(deletionPromises);
            console.log(`All images in collection ${collectionRef.name} deleted successfully.`);
            
            // NOTE: Do NOT call deleteObject(collectionRef). Folders are not objects.
        }

        // 3. Delete any files directly under the projectRef (if there are any)
        const topLevelFileDeletionPromises = projectList.items.map(fileRef => {
            console.log('Deleting top-level file:', fileRef.fullPath);
            return deleteObject(fileRef);
        });
        
        await Promise.all(topLevelFileDeletionPromises);
        
        console.log('Project contents deleted successfully. (Virtual folder removed).');
    } catch (error) {
        // Use a clearer error message
        console.error('Error during project deletion from storage:', error);
        // You might want to throw the error again to handle it up the chain
        throw error; 
    }
};
  
// Line Complexity -> 3.5 -> 1.0