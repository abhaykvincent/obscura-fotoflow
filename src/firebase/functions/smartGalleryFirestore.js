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
            if (collectionData.smartGallery) {
                return convertTimestampsToMillis(collectionData.smartGallery);
            } else {
                // Simulate smartGallery data if missing
                return {
                    name: collectionData.name || '',
                    projectCover: collectionData.uploadedFiles?.[0]?.url || '',
                    focusPoint: { x: 0.5, y: 0.5 },
                    sections: [
                        {
                            id: 'default-grid',
                            type: 'image-grid',
                            images: collectionData.uploadedFiles || []
                        }
                    ],
                    coverSize: 'default',
                    textPosition: 'center',
                    overlayColor: 'rgba(0,0,0,0.3)'
                };
            }
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