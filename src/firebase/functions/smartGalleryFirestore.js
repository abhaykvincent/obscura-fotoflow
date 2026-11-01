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

/**
 * Resolves a smart gallery image entry to a canonical Project Photo reference.
 * Legacy entries contain full photo objects; new entries contain photoId references.
 * Returns a normalized entry with both photoId and a display snapshot.
 */
const normalizeGalleryImage = (image) => {
    if (!image) return null;
    // Already a canonical photo reference (new model)
    if (image.photoId || image.id || image.fileId) {
        return {
            photoId: image.photoId || image.id || image.fileId,
            name: image.name || '',
            url: image.url || '',
            thumbUrl: image.thumbUrl || '',
        };
    }
    // Legacy full photo object — keep for compat; the url is used as identity
    return {
        photoId: image.url || image.name || '',
        name: image.name || '',
        url: image.url || '',
        thumbUrl: image.thumbUrl || '',
    };
};

export const fetchSmartGalleryFromFirestore = async (domain, projectId, collectionId) => {
    try {
        // --- Studio-status enforcement ---
        const studioDocRef = doc(db, 'studios', domain);
        const studioSnapshot = await getDoc(studioDocRef);
        if (studioSnapshot.exists()) {
            const studioStatus = (studioSnapshot.data()?.status || 'active').toLowerCase();
            if (studioStatus === 'suspended' || studioStatus === 'inactive') {
                const err = new Error(studioStatus === 'suspended' ? 'Studio suspended.' : 'Studio inactive.');
                err.code = studioStatus === 'suspended' ? 'studio-suspended' : 'studio-inactive';
                throw err;
            }
        }

        const collectionDocRef = doc(db, 'studios', domain, 'projects', projectId, 'collections', collectionId);
        const collectionSnapshot = await getDoc(collectionDocRef);

        if (collectionSnapshot.exists()) {
            const collectionData = collectionSnapshot.data();
            // Convert any Firestore Timestamps in smartGallery to milliseconds
            if (collectionData.smartGallery) {
                const gallery = convertTimestampsToMillis(collectionData.smartGallery);
                // Normalize section images to photo references (compat: legacy full objects OK)
                if (gallery.sections) {
                    gallery.sections = gallery.sections.map((section) => {
                        if (section.images && Array.isArray(section.images)) {
                            return {
                                ...section,
                                images: section.images.map(normalizeGalleryImage).filter(Boolean),
                            };
                        }
                        return section;
                    });
                }
                return gallery;
            } else {
                debugger
                // Simulate smartGallery data if missing
                // Legacy fallback: build from uploadedFiles (compat)
                const legacyFiles = collectionData.uploadedFiles || [];
                return {
                    name: collectionData.name || '',
                    projectCover: collectionData.uploadedFiles?.[0]?.url || '',
                    focusPoint: { x: 0.5, y: 0.5 },
                    sections: [
                        {
                            id: 'default-grid',
                            type: 'image-grid',
                            images: legacyFiles.map(normalizeGalleryImage).filter(Boolean),
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
            updatedAt: Date.now(),
        });
        console.log(`Smart gallery updated successfully for collection ${collectionId}.`);
    } catch (error) {
        console.error(`Error updating smart gallery for collection ${collectionId}:`, error);
        throw error;
    }
};