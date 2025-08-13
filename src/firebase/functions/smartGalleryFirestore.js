import { db } from "../app";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export const fetchSmartGalleryFromFirestore = async (domain, projectId, collectionId) => {
    try {
        const collectionDocRef = doc(db, 'studios', domain, 'projects', projectId, 'collections', collectionId);
        const collectionSnapshot = await getDoc(collectionDocRef);

        if (collectionSnapshot.exists()) {
            const collectionData = collectionSnapshot.data();
            return collectionData.smartGallery || null;
        } else {
            console.warn(`Collection ${collectionId} not found for project ${projectId} in domain ${domain}`);
            return null;
        }
    } catch (error) {
        console.error(`Error fetching smart gallery for collection ${collectionId}:`, error);
        throw error;
    }
};

export const updateSmartGallerySectionsInFirestore = async (domain, projectId, collectionId, sections) => {
    try {
        const collectionDocRef = doc(db, 'studios', domain, 'projects', projectId, 'collections', collectionId);
        await updateDoc(collectionDocRef, {
            'smartGallery.sections': sections,
            'smartGallery.updatedAt': Date.now(),
        });
        console.log(`Smart gallery sections updated successfully for collection ${collectionId}.`);
    } catch (error) {
        console.error(`Error updating smart gallery sections for collection ${collectionId}:`, error);
        throw error;
    }
};