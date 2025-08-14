import { db } from "../app";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore"; // Import Timestamp

// Helper function to convert Firestore Timestamps to Unix timestamps (milliseconds)
const convertTimestampsToMillis = (obj) => {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (obj instanceof Timestamp) {
        return obj.toMillis();
    }

    if (Array.isArray(obj)) {
        return obj.map(item => convertTimestampsToMillis(item));
    }

    const newObj = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            newObj[key] = convertTimestampsToMillis(obj[key]);
        }
    }
    return newObj;
};

export const fetchSmartGalleryFromFirestore = async (domain, projectId, collectionId) => {
    try {
        const collectionDocRef = doc(db, 'studios', domain, 'projects', projectId, 'collections', collectionId);
        const collectionSnapshot = await getDoc(collectionDocRef);

        if (collectionSnapshot.exists()) {
            const collectionData = collectionSnapshot.data();
            // Convert any Firestore Timestamps in smartGallery to milliseconds
            const smartGallery = convertTimestampsToMillis(collectionData.smartGallery) || null;
            return smartGallery;
        } else {
            console.warn(`Collection ${collectionId} not found for project ${projectId} in domain ${domain}`);
            return null;
        }
    } catch (error) {
        console.error(`Error fetching smart gallery for collection ${collectionId}:`, error);
        throw error;
    }
};

export const updateSmartGalleryInFirestore = async (domain, projectId, collectionId, smartGallery) => {
    try {
        console.log(domain, projectId, collectionId, smartGallery)
        const collectionDocRef = doc(db, 'studios', domain, 'projects', projectId, 'collections', collectionId);
        await updateDoc(collectionDocRef, {
            smartGallery: smartGallery,
        });
        console.log(`Smart gallery updated successfully for collection ${collectionId}.`);
    } catch (error) {
        console.error(`Error updating smart gallery for collection ${collectionId}:`, error);
        throw error;
    }
};