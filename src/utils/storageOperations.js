import {
    list,
    ref,
    deleteObject,
    listAll
} from "firebase/storage";
import { getStorageForDomain } from "./uploadOperations";
import { getCdnUrl } from "./cdnUrl";
import { getCollectionPhotoIds, fetchProjectPhotoById } from "../firebase/functions/photo-firestore";

// Fetch Images
//
// Project-Owned Photo Assets: photos live at web/{domain}/{projectId}/{photoId}.{ext},
// not under a collection subfolder. Collection-scoped reads now use the
// Collection → Photo relationship (photoIds[]) resolved via Firestore, then each
// canonical Project Photo's CDN URL is generated from its storage path.
//
// Legacy collection-bound listing (web/{domain}/{projectId}/{collectionId}) is
// kept only as a fallback during the migration window.

export const fetchImageUrls = async (domain, projectId, collectionId, setImageUrls, page, pageSize) => {
    console.log(`Fetching images for page ${page}`);

    try {
        // New path: resolve Collection → Photo relationship via Firestore
        const photoIds = await getCollectionPhotoIds(domain, projectId, collectionId);

        if (photoIds && photoIds.length > 0) {
            const startAt = (page - 1) * pageSize;
            const endAt = startAt + pageSize;
            const pagePhotoIds = photoIds.slice(startAt, endAt);

            const imageUrls = [];
            for (const photoId of pagePhotoIds) {
                try {
                    const photo = await fetchProjectPhotoById(domain, projectId, photoId);
                    if (photo && photo.storage?.webPath) {
                        const cdnUrl = getCdnUrl(photo.storage.webPath);
                        imageUrls.push(cdnUrl);
                    }
                } catch (e) {
                    console.warn(`Failed to resolve photo ${photoId} URL:`, e.message);
                }
            }
            setImageUrls(imageUrls);
            return;
        }

        // Legacy fallback: list storage at the project level (all photos under
        // web/{domain}/{projectId}/) — collectionId is not in the path anymore.
        const storage = await getStorageForDomain(domain);
        const storageRef = ref(storage, `web/${domain}/${projectId}`);

        const imageUrls = [];
        const startAt = (page - 1) * pageSize;
        const endAt = startAt + pageSize;

        const listResult = await list(storageRef);

        let currentIndex = 0;
        for (const item of listResult.items) {
            if (currentIndex >= startAt && currentIndex < endAt) {
                const cdnUrl = getCdnUrl(item.fullPath);
                imageUrls.push(cdnUrl);
            }

            currentIndex++;
            if (currentIndex === endAt) break;
        }

        setImageUrls(imageUrls);
    } catch (error) {
        console.error("Error fetching images:", error);
    }

    console.log('Fetching images FINISHED');
};

export const fetchImageInfo = async (domain, projectId, collectionId) => {
    try {
        // New path: resolve via Firestore photoIds relationship
        const photoIds = await getCollectionPhotoIds(domain, projectId, collectionId);

        if (photoIds && photoIds.length > 0) {
            const imageInfoList = [];
            for (const photoId of photoIds) {
                try {
                    const photo = await fetchProjectPhotoById(domain, projectId, photoId);
                    if (photo) {
                        imageInfoList.push({
                            name: photo.name || '',
                            photoId: photo.id,
                            isSelected: false,
                        });
                    }
                } catch (e) {
                    console.warn(`Failed to fetch photo info ${photoId}:`, e.message);
                }
            }
            return imageInfoList;
        }

        // Legacy fallback: list storage at project level
        const storage = await getStorageForDomain(domain);
        const storageRef = ref(storage, `web/${domain}/${projectId}`);
        const imageInfoList = [];

        const listResult = await list(storageRef);

        for (const item of listResult.items) {
            const imageName = item.name.split('/').pop();
            imageInfoList.push({
                name: imageName,
                isSelected: false,
            });
        }

        return imageInfoList;
    } catch (error) {
        console.error("Error fetching image info:", error);
    }

    return [];
};


export const deleteCollectionFromStorage = async (domain, id, collectionId) => {
    // Under Project-Owned Photo Assets, canonical photo storage
    // (web/{domain}/{projectId}/{photoId}) belongs to the Project, not the
    // Collection. Deleting a Collection must NEVER delete Project Photos.
    //
    // This function is kept as a no-op / collection-stub cleanup only. It does
    // NOT list or delete anything under web/{domain}/{id}/{collectionId} because
    // photos are no longer stored under collection-scoped paths.
    //
    // If any legacy collection-scoped storage objects remain (pre-migration),
    // they are cleaned up by a separate, verified legacy cleanup phase — not here.

    console.log(`deleteCollectionFromStorage: collection ${collectionId} — no canonical photo storage deleted (Project-owned).`);
};

// Project-level storage deletion — used when a Project is deleted.
// Photos live at web/{domain}/{projectId}/{photoId}, thumb/{domain}/{projectId}/{photoId},
// which are all directly under the project prefix. This lists at the project level
// and deletes everything under web/, thumb/, covers/ for the project.
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

                // 2. Iterate through projectList prefixes (collections or other subfolders)
                for (const collectionRef of projectList.prefixes) {
                    const collectionList = await listAll(collectionRef);
                    const deletionPromises = collectionList.items.map(imageRef => deleteObject(imageRef));
                    await Promise.all(deletionPromises);
                }

                // 3. Delete any files directly under the projectRef
                //    (e.g. web/{domain}/{projectId}/{photoId}.{ext})
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
