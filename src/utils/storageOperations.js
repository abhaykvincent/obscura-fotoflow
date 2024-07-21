import {
    uploadBytesResumable,
    getDownloadURL,
    list,
    ref,
    deleteObject
} from "firebase/storage";
import { db, storage } from '../firebase/app';

// Fetch Images
export const fetchImageUrls = async (id, collectionId, setImageUrls, page, pageSize) => {
    console.log(`Fetching images for page ${page}`);
    const storageRef = ref(storage, `${id}/${collectionId}`);
    try {
        const imageUrls = []; // Create an empty array to store the image URLs
    
        // Calculate starting and ending indexes based on the page and page size
        const startAt = (page - 1) * pageSize;
        const endAt = startAt + pageSize;

        const listResult = await list(storageRef);

        let currentIndex = 0;
        for (const item of listResult.items) {
            if (currentIndex >= startAt && currentIndex < endAt) {
                //await new Promise((resolve) => setTimeout(resolve, 10)); // Add a delay of 10 milliseconds
                const downloadURL = await getDownloadURL(item);
                imageUrls.push(downloadURL);
            }

            currentIndex++;
            // Break the loop once endAt is reached
            if (currentIndex === endAt) break;
        }
        setImageUrls(imageUrls); // Set the image URLs outside the loop
    } catch (error) {
        console.error("Error fetching images:", error);
    }
    console.log('Fetching images FINISHED');
};
export const fetchImageInfo = async (id, collectionId) => {
    const storageRef = ref(storage, `${id}/${collectionId}`);
    const imageInfoList = [];

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
    return imageInfoList;
};

export const deleteCollectionFromStorage = async (id, collectionId) => {
const storageRef = ref(storage, `${id}/${collectionId}`);
const listResult = await list(storageRef);

for (const item of listResult.items) {
    await deleteObject(item);
}
}

// stoage is in format project/collection/image
export const deleteProjectFromStorage = async (projectId) => {
try {
    const projectRef = ref(storage, projectId);
    const projectList = await list(projectRef);

    // Iterate through projectList prefixes (collections)
    for (const collectionRef of projectList.prefixes) {
    const collectionList = await list(collectionRef);

    // Iterate through images in each collection
    for (const imageRef of collectionList.items) {
        await deleteObject(imageRef);
        console.log('Image deleted successfully.');
    }

    // Delete the collection directory after deleting its contents
    await deleteObject(collectionRef);
    console.log('Collection directory deleted successfully.');
    }

    // Delete the project directory after deleting its contents
    await deleteObject(projectRef);
    console.log('Project directory deleted successfully.');
} catch (error) {
    console.error('Error deleting images:', error);
}
};
  
// Line Complexity -> 3.5 -> 1.0