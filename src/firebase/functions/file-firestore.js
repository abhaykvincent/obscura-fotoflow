import { db } from "../app";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, increment, collection, getDocs, query, where, documentId } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { getStorageForDomain } from "../../utils/uploadOperations";
import { generateMemorablePIN } from "../../utils/stringUtils";
import { fetchSmartGalleryFromFirestore, updateSmartGalleryInFirestore } from './smartGalleryFirestore';
import { organizePhotos } from "../../utils/smartGalleryUtils";
import { updateCollectionStatusByCollectionIdInFirestore } from './collection-firestore';
import { getWebStoragePath, getThumbStoragePath } from '../../utils/photoStorage';
import { mbToBytes } from '../../utils/storageUnits';
import {
    createProjectPhoto,
    addPhotoToCollection,
    getCollectionPhotoIds,
    fetchProjectPhotos,
    legacyPhotoToPhotoInput,
} from './photo-firestore';

/**
 * Merges canonical Project Photos with legacy uploadedFiles[] entries for the
 * migration window (union read).
 *
 * - Canonical Project Photos always win.
 * - Legacy entries already represented by a canonical photo (matching on
 *   photoId / fileId / id / url) are dropped.
 * - Result is sorted by name for stable gallery ordering.
 *
 * Dedupe uses strong identities only, so two different photos that happen to
 * share an original filename are never collapsed into one.
 *
 * @param {Object[]} projectPhotos - normalized canonical photos
 * @param {Object[]} legacyPhotos - normalized legacy uploadedFiles entries
 * @returns {Object[]} deduped, name-sorted union
 */
export const mergeCollectionPhotos = (projectPhotos = [], legacyPhotos = []) => {
    const canonicalIdentity = new Set();
    projectPhotos.forEach((p) => {
        [p.photoId, p.id, p.fileId, p.url].forEach((key) => {
            if (key) canonicalIdentity.add(key);
        });
    });

    const photos = [...projectPhotos];
    legacyPhotos.forEach((f) => {
        const tokens = [f.photoId, f.fileId, f.id, f.url].filter(Boolean);
        const alreadyRepresented = tokens.length > 0 && tokens.some((token) => canonicalIdentity.has(token));
        if (alreadyRepresented) {
            return;
        }
        tokens.forEach((token) => canonicalIdentity.add(token));
        photos.push(f);
    });

    return photos.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
};

const FIRESTORE_IN_QUERY_LIMIT = 30;

/**
 * Normalizes a canonical Project Photo document so legacy top-level `url` and
 * `thumbUrl` fields are populated alongside `urls.{web,thumb}`.
 */
export const normalizeProjectPhoto = (photo, fallbackId = '') => {
    const photoId = photo.id || photo.photoId || fallbackId;
    return {
        ...photo,
        photoId,
        url: photo.urls?.web || photo.url || '',
        thumbUrl: photo.urls?.thumb || photo.thumbUrl || '',
    };
};

const normalizeLegacyPhoto = (file) => ({
    ...file,
    photoId: file.photoId || file.fileId || file.id || file.url || file.name,
    url: file.url || '',
    thumbUrl: file.thumbUrl || '',
});

/**
 * Fetches all canonical Project Photos for a project in a single Firestore
 * collection read, keyed by photoId. Ideal when resolving multiple collections
 * at once (e.g. Selection Gallery).
 *
 * @returns {Promise<Map<string, Object>>}
 */
export const fetchAllProjectPhotosMap = async (domain, projectId) => {
    const photosRef = collection(db, 'studios', domain, 'projects', projectId, 'photos');
    const snap = await getDocs(photosRef);
    const map = new Map();
    snap.docs.forEach((d) => {
        const normalized = normalizeProjectPhoto(d.data(), d.id);
        map.set(d.id, normalized);
        if (normalized.photoId) {
            map.set(normalized.photoId, normalized);
        }
    });
    return map;
};

/**
 * Resolves a single collection object (already carrying `photoIds` and/or
 * `uploadedFiles`) against a preloaded `projectPhotosMap` using the standard
 * canonical + legacy union read. Makes zero network calls.
 */
export const resolveCollectionPhotosFromMap = (collectionData = {}, projectPhotosMap = new Map()) => {
    const photoIds = Array.isArray(collectionData.photoIds) ? collectionData.photoIds : [];
    const projectPhotos = [];
    photoIds.forEach((photoId) => {
        const p = projectPhotosMap.get(photoId);
        if (p) projectPhotos.push(p);
    });
    const legacyPhotos = (collectionData.uploadedFiles || []).map(normalizeLegacyPhoto);
    return mergeCollectionPhotos(projectPhotos, legacyPhotos);
};

const chunkArray = (items, chunkSize) => {
    const chunks = [];
    for (let i = 0; i < items.length; i += chunkSize) {
        chunks.push(items.slice(i, i + chunkSize));
    }
    return chunks;
};

/**
 * Resolves canonical Project Photo documents by ID using batched
 * `documentId() in [...]` queries (parallel, max 30 IDs per query) instead of
 * N+1 sequential getDoc calls. Returns a Map keyed by both document ID and
 * photoId.
 *
 * @returns {Promise<Map<string, Object>>}
 */
export const fetchProjectPhotosByIds = async (domain, projectId, photoIds = []) => {
    const photosById = new Map();
    const uniqueIds = [...new Set(photoIds.filter(Boolean))];
    if (uniqueIds.length === 0) {
        return photosById;
    }

    const photosRef = collection(db, 'studios', domain, 'projects', projectId, 'photos');
    await Promise.all(chunkArray(uniqueIds, FIRESTORE_IN_QUERY_LIMIT).map(async (chunk) => {
        try {
            const snap = await getDocs(query(photosRef, where(documentId(), 'in', chunk)));
            snap.docs.forEach((d) => {
                const normalized = normalizeProjectPhoto(d.data(), d.id);
                photosById.set(d.id, normalized);
                if (normalized.photoId) photosById.set(normalized.photoId, normalized);
            });
        } catch (e) {
            console.warn(`Failed to fetch photo batch for project ${projectId}:`, e.message);
        }
    }));

    return photosById;
};

/**
 * Builds the ordered reference list for a collection: canonical photoIds[] in
 * their stored order, followed by legacy uploadedFiles[] entries that are not
 * already represented by a canonical photoId.
 *
 * @returns {{ refs: Object[], total: number }}
 */
export const buildCollectionPhotoRefs = (collectionData = {}) => {
    const photoIds = Array.isArray(collectionData.photoIds) ? collectionData.photoIds : [];
    const canonicalIds = [...new Set(photoIds.filter(Boolean))];
    const canonicalIdSet = new Set(canonicalIds);

    const legacyPhotos = (collectionData.uploadedFiles || [])
        .map(normalizeLegacyPhoto)
        .filter((file) => {
            const tokens = [file.photoId, file.fileId, file.id, file.url].filter(Boolean);
            return tokens.length === 0 || !tokens.some((token) => canonicalIdSet.has(token));
        });

    const refs = [
        ...canonicalIds.map((photoId) => ({ type: 'canonical', photoId })),
        ...legacyPhotos.map((photo) => ({ type: 'legacy', photo })),
    ];

    return { refs, total: refs.length };
};

/**
 * Loads a single ordered page of collection photos.
 *
 * Only the canonical photo documents referenced by the requested slice of
 * photoIds[] are read, in parallel batches. Results are reconstructed in the
 * original photoIds[] order (Firestore does not guarantee `in` order).
 */
export const loadCollectionPhotosPage = async (domain, projectId, collectionData = {}, offset = 0, limit = 16) => {
    const { refs, total } = buildCollectionPhotoRefs(collectionData);
    const start = Math.max(0, offset);
    const end = start + Math.max(0, limit);
    const pageRefs = refs.slice(start, end);

    const canonicalIds = pageRefs
        .filter((ref) => ref.type === 'canonical')
        .map((ref) => ref.photoId);
    const photosById = await fetchProjectPhotosByIds(domain, projectId, canonicalIds);

    const photos = [];
    pageRefs.forEach((ref) => {
        if (ref.type === 'legacy') {
            photos.push(ref.photo);
            return;
        }
        const photo = photosById.get(ref.photoId);
        if (photo) photos.push(photo);
    });

    return {
        photos,
        total,
        offset: start,
        nextOffset: Math.min(end, total),
        hasMore: end < total,
    };
};

/**
 * Fetches one page of a Collection's images for the Project-Owned Photo union
 * read. Reads the collection metadata once (unless `collectionData` is supplied
 * by a previous page) and resolves only the requested photoIds slice.
 *
 * @param {Object} [options]
 *   {number} offset - starting index into the ordered collection
 *   {number} limit - page size
 *   {Object} collectionData - previously returned metadata to avoid a re-read
 * @returns {Promise<{photos, total, offset, nextOffset, hasMore, collectionData}>}
 */
export const fetchCollectionPhotosPage = async (
    domain,
    projectId,
    collectionId,
    { offset = 0, limit = 16, collectionData } = {}
) => {
    let data = collectionData;
    if (!data) {
        const collectionDocRef = doc(db, 'studios', domain, 'projects', projectId, 'collections', `${collectionId}`);
        const collectionSnapshot = await getDoc(collectionDocRef);
        if (!collectionSnapshot.exists()) {
            return {
                photos: [],
                total: 0,
                offset: 0,
                nextOffset: 0,
                hasMore: false,
                collectionData: null,
            };
        }
        data = collectionSnapshot.data();
    }

    const page = await loadCollectionPhotosPage(domain, projectId, data, offset, limit);
    return { ...page, collectionData: data };
};

/**
 * Fetch all images for a Collection with Project-Owned Photo union read.
 *
 * Delegates to the same ordered, batched loader as `fetchCollectionPhotosPage`
 * so callers that need the complete list (e.g. Share gallery) stay consistent
 * with the paginated studio gallery. New galleries should prefer
 * `fetchCollectionPhotosPage`.
 *
 * @returns {Promise<Object[]>} array of photo objects (canonical shape where possible)
 */
export const fetchImages = async (domain, projectId, collectionId) => {
    const result = await fetchCollectionPhotosPage(domain, projectId, collectionId, {
        offset: 0,
        limit: Number.MAX_SAFE_INTEGER,
    });
    return result.photos;
};

/**
 * addUploadedFilesToFirestore — Compatibility layer.
 *
 * After the Project-Owned Photo refactor, handleUpload already:
 *   1. Creates the canonical Project Photo (createProjectPhoto) — which also
 *      increments project uploadedFilesCount and totalFileSize.
 *   2. Creates the Collection → Photo relationship (addPhotoToCollection) —
 *      which also increments collection photoCount.
 *
 * This function now only updates Collection-level metadata (galleryCover,
 * favoriteImages, smartGallery) for backward compatibility. It does NOT
 * re-increment project counters (avoid double counting) and does NOT write
 * the full photo object into uploadedFiles[].
 *
 * Legacy dummy-upload callers (UploadButton) still pass full photo objects;
 * those are handled here as a temporary compat path.
 */
export const addUploadedFilesToFirestore = async (domain, projectId, collectionId, importFileSize, uploadedFiles, sectionId) => {
    let color = domain === '' ? 'gray' : 'green';
    const studioDocRef = doc(db, 'studios', domain);
    const projectsCollectionRef = collection(studioDocRef, 'projects');
    const projectDocRef = doc(projectsCollectionRef, projectId);
    const subCollectionId = `${collectionId}`;
    const collectionDocRef = doc(projectDocRef, 'collections', subCollectionId);

    const projectData = await getDoc(projectDocRef);

    if (projectData.exists()) {
        const collectionData = await getDoc(collectionDocRef);

        if (!collectionData.exists()) {
            throw new Error('Collection does not exist.');
        }

        // --- Collection-level metadata updates (compat) ---
        const updateData = {
            updatedAt: Date.now(),
        };

        // Preserve galleryCover if not already set (compat with legacy behavior)
        if (!collectionData.galleryCover && uploadedFiles.length > 0) {
            updateData.galleryCover = uploadedFiles[0]?.url || '';
        }

        // Preserve favoriteImages if not set
        if ((!collectionData.favoriteImages || collectionData.favoriteImages[0] === '') && uploadedFiles.length >= 2) {
            updateData.favoriteImages = [
                uploadedFiles.length >= 2 ? uploadedFiles[1]?.url || '' : '',
                uploadedFiles.length >= 3 ? uploadedFiles[2]?.url || '' : '',
            ];
        }

        // Increment collection photoCount is handled by addPhotoToCollection
        // (called from handleUpload for new uploads). Dummy/legacy callers
        // that bypass addPhotoToCollection need it here; we skip when
        // photoIds already reflect the added photos.
        const hasPhotoIds = Array.isArray(collectionData.photoIds) && collectionData.photoIds.length > 0;
        if (uploadedFiles.length > 0 && !hasPhotoIds) {
            updateData.photoCount = increment(uploadedFiles.length);
        }

        await updateDoc(collectionDocRef, updateData)
            .catch(error => {
                console.error(`%cError updating collection metadata ${collectionId} in project ${projectId}: ${error.message}`, `color: red;`);
                throw error;
            });

        // --- Smart Gallery compat (legacy: full photo objects in sections) ---
        const currentSmartGallery = await fetchSmartGalleryFromFirestore(domain, projectId, collectionId);

        let updatedSections = [];
        let sectionFound = false;
        if (sectionId) {
            updatedSections = currentSmartGallery.sections.map(section => {
                if (section.id === sectionId) {
                    sectionFound = true;
                    const mergedImages = [...section.images, ...uploadedFiles];
                    mergedImages.sort((a, b) => {
                        const dateA = new Date(a.dateTimeOriginal || a.lastModified).getTime();
                        const dateB = new Date(b.dateTimeOriginal || b.lastModified).getTime();
                        return dateA - dateB;
                    });
                    return {
                        ...section,
                        images: mergedImages,
                    };
                }
                return section;
            });
        }

        if (!sectionFound) {
            updatedSections = organizePhotos(uploadedFiles, collectionId, currentSmartGallery.sections);
        }

        const updatedSmartGallery = {
            ...currentSmartGallery,
            sections: updatedSections,
            projectCover: projectData.data().projectCover === '' ? uploadedFiles[0]?.url : projectData.data().projectCover
        };
        await updateSmartGalleryInFirestore(domain, projectId, collectionId, updatedSmartGallery);

        const pin = generateMemorablePIN(4);

        // --- Project-level compat updates (avoid double counting with createProjectPhoto) ---
        // For new uploads via handleUpload, counters were already incremented by
        // createProjectPhoto. We only update here for legacy/dummy paths that
        // bypass handleUpload's Project Photo creation.
        const projectUpdates = {
            status: "active",
            pin: projectData.data().pin || generateMemorablePIN(4),
        };

        // Only bump uploadedFilesCount/totalFileSize if createProjectPhoto did NOT
        // already do so. New uploads via handleUpload create Project Photos which
        // increment these counters, so we skip here to avoid double counting.
        // Legacy/dummy callers: they pass files without storage-backed Project Photos,
        // so we still increment for those (until dummy uploads are also migrated).
        const existingCounts = projectData.data();
        const alreadyHasProjectPhotos = existingCounts.uploadedFilesCount > 0;

        if (!alreadyHasProjectPhotos) {
            projectUpdates.uploadedFilesCount = (existingCounts.uploadedFilesCount || 0) + uploadedFiles.length;
            // importFileSize is decimal MB; project totalFileSize is bytes.
            projectUpdates.totalFileSize = mbToBytes(importFileSize, 'importFileSize') + (existingCounts.totalFileSize || 0);
        }

        // Update project collections array metadata (galleryCover on collection entries)
        projectUpdates.collections = projectData.data().collections.map((collection) => {
            if (collection.id === collectionId) {
                return {
                    ...collection,
                    galleryCover: collection.galleryCover ? collection.galleryCover : uploadedFiles[0]?.url,
                    favoriteImages: collection.favoriteImages && collection.favoriteImages[0] !== ''
                        ? collection.favoriteImages
                        : [
                            uploadedFiles.length >= 2 ? uploadedFiles[1]?.url || '' : '',
                            uploadedFiles.length >= 3 ? uploadedFiles[2]?.url || '' : ''
                          ],
                };
            }
            return collection;
        });

        await updateDoc(projectDocRef, projectUpdates);

        // Studio storage accounting is owned exclusively by
        // createProjectPhoto(). This compatibility path must not increment it
        // again for the same asset (that caused duplicate counting).

        return({pin});
        color = '#54a134';

    } else {
        console.error('Project not found.');
        throw new Error('Project not found.');
    }
};
export const deleteFileFromFirestoreAndStorage = async (domain, projectId, collectionId, fileUrl, fileName) => {
    // Validate required parameters
    if (!domain || !projectId || !collectionId || !fileUrl || !fileName) {
        throw new Error('Domain, Project ID, Collection ID, File URL, and File Name are required.');
    }

    console.log(`Deleting file ${fileName} from project: ${projectId}, collection: ${collectionId}`);

    const projectDocRef = doc(db, 'studios', domain, 'projects', projectId);
    const collectionDocRef = doc(projectDocRef, 'collections', collectionId);

    // Resolve the canonical photoId from the file URL or name.
    // New path: photoId is the upload-generated fileId; the storage path is
    // web/{domain}/{projectId}/{photoId}.{ext} — collectionId is not in the path.
    let photoId = null;
    try {
        const storagePath = (typeof window !== 'undefined' && window.URL && window.URL.canParse)
            ? new URL(fileUrl).pathname.replace(/^\/+/, '')
            : null;
        if (storagePath) {
            const { extractPhotoIdFromPath } = await import('../../utils/photoStorage');
            photoId = extractPhotoIdFromPath(storagePath);
        }
    } catch { /* ignore */ }

    // Fallback: derive photoId from filename (legacy compat)
    if (!photoId && fileName) {
        photoId = fileName.replace(/\.[^/.]+$/, '');
    }

    const storage = await getStorageForDomain(domain);

    // 1. Delete from Firebase Storage — canonical project-owned path
    // Try the new project-owned path first, then the legacy collection-bound path.
    const storagePathsToTry = [];
    if (photoId) {
        storagePathsToTry.push(getWebStoragePath(domain, projectId, photoId, fileName));
        storagePathsToTry.push(getThumbStoragePath(domain, projectId, photoId, fileName));
    }
    // Legacy compat path (do not use for new deletes, only for cleanup)
    storagePathsToTry.push(`${domain}/${projectId}/${collectionId}/${fileName}`);

    for (const path of storagePathsToTry) {
        try {
            await deleteObject(ref(storage, path));
            console.log(`Deleted storage object: ${path}`);
        } catch (e) {
            // Object may not exist; continue trying other paths
        }
    }

    // 2. Remove from Collection → Photo relationship and legacy uploadedFiles[]
    const collectionSnapshot = await getDoc(collectionDocRef);
    if (!collectionSnapshot.exists()) {
        throw new Error('Collection does not exist.');
    }

    const collectionData = collectionSnapshot.data();

    // Remove photoId from Collection.photoIds[] (new relationship model)
    if (photoId && Array.isArray(collectionData.photoIds) && collectionData.photoIds.includes(photoId)) {
        await updateDoc(collectionDocRef, {
            photoIds: arrayRemove(photoId),
            photoCount: increment(-1),
            updatedAt: Date.now(),
        });
    }

    // Remove from legacy uploadedFiles[] (compat fallback)
    if (collectionData.uploadedFiles && Array.isArray(collectionData.uploadedFiles)) {
        const updatedFiles = collectionData.uploadedFiles.filter(file => file.url !== fileUrl || file.name !== fileName);
        if (updatedFiles.length !== collectionData.uploadedFiles.length) {
            await updateDoc(collectionDocRef, { ...collectionData, uploadedFiles: updatedFiles });
        }
    }

    console.log(`File ${fileName} removed from Firestore`);
};
// Photo Selection
export const addSelectedImagesToFirestore = async (domain, projectId, collectionId, images, page, size, totalPages) => {
    if (!domain || !projectId || !collectionId || !images) {
        throw new Error('Domain, Project ID, Collection ID, and Images are required.');
    }

    let status = page === totalPages ? 'selected' : 'selecting';
    console.log(`%cUpdating image statuses for project: ${projectId}, collection: ${collectionId}`, `color: #0099ff;`);

    const projectDocRef = doc(db, 'studios', domain, 'projects', projectId);

    try {
        // New relationship model: selection status lives on the canonical Project Photo,
        // not inside Collection.uploadedFiles[]. Update each photo's status field.
        const photoRefs = images.map((img) => {
            const photoId = img.photoId || img.fileId || img.id || img.url || img.name;
            return doc(db, 'studios', domain, 'projects', projectId, 'photos', photoId);
        });

        // Use individual updates (Firestore batch not imported here; use updateDoc per photo)
        for (const photoRef of photoRefs) {
            const snap = await getDoc(photoRef);
            if (snap.exists()) {
                await updateDoc(photoRef, {
                    status,
                    updatedAt: Date.now(),
                });
            }
        }

        // Keep legacy collection.uploadedFiles[] status in sync for compat reads
        const collectionDocRef = doc(projectDocRef, 'collections', collectionId);
        const collectionSnapshot = await getDoc(collectionDocRef);
        if (collectionSnapshot.exists()) {
            const collectionData = collectionSnapshot.data();
            if (collectionData.uploadedFiles && Array.isArray(collectionData.uploadedFiles)) {
                const startIndex = (page - 1) * size;
                const endIndex = page * size;
                const updatedImages = collectionData.uploadedFiles.map((image, index) => {
                    if (index >= startIndex && index < endIndex) {
                        const isSelected = images.some(img => {
                            const imgKey = img.photoId || img.fileId || img.id || img.url || img.name;
                            const imgUrl = image.url || image.name;
                            return imgKey === imgUrl || img.url === imgUrl;
                        });
                        return {
                            ...image,
                            status: isSelected ? 'selected' : image.status || 'unselected'
                        };
                    }
                    return image;
                });
                await updateDoc(collectionDocRef, { ...collectionData, uploadedFiles: updatedImages });
            }
        }

        updateCollectionStatusByCollectionIdInFirestore(domain, projectId, collectionId, status, true);

        // Update status on the project
        const projectSnapshot = await getDoc(projectDocRef);
        if (projectSnapshot.exists()) {
            const projectData = projectSnapshot.data();
            await updateDoc(projectDocRef, { ...projectData, status: status });
            console.log(`%cSelected images status updated successfully for project: ${projectId}.`, `color: #54a134;`);
        } else {
            console.log(`%cProject ${projectId} does not exist.`, 'color: red;');
            throw new Error('Project does not exist.');
        }
    } catch (error) {
        console.error(`%cError updating image status for project: ${projectId}, collection: ${collectionId} - ${error.message}`, 'color: red;');
        throw error;
    }
};
export const removeUnselectedImagesFromFirestore = async (domain, projectId, collectionId, images, page, size, totalPages) => {
    if (!domain || !projectId || !collectionId || !images) {
      throw new Error('Domain, Project ID, Collection ID, and Images are required.');
    }
  
    let status = page === totalPages ? 'selected' : 'selecting';
    console.log(`Removing unselected image statuses for project: ${projectId}, collection: ${collectionId}`);
  
    const projectDocRef = doc(db, 'studios', domain, 'projects', projectId);
  
    try {
      // New relationship model: update status on canonical Project Photos
      for (const img of images) {
        const photoId = img.photoId || img.fileId || img.id || img.url || img.name;
        const photoRef = doc(db, 'studios', domain, 'projects', projectId, 'photos', photoId);
        const snap = await getDoc(photoRef);
        if (snap.exists()) {
          await updateDoc(photoRef, {
              status: 'unselected',
              updatedAt: Date.now(),
          });
        }
      }

      // Keep legacy collection.uploadedFiles[] in sync for compat reads
      const collectionDocRef = doc(projectDocRef, 'collections', collectionId);
      const collectionSnapshot = await getDoc(collectionDocRef);
      if (!collectionSnapshot.exists()) {
        throw new Error('Collection does not exist.');
      }

      const collectionData = collectionSnapshot.data();
      const updatedImages = collectionData.uploadedFiles.map((image) => {
        if (images.some(img => {
            const imgKey = img.photoId || img.fileId || img.id || img.url || img.name;
            return imgKey === image.url || img.url === image.url;
        })) {
          return { ...image, status: 'unselected' };
        } else {
          return image;
        }
      });

      await updateDoc(collectionDocRef, { ...collectionData, uploadedFiles: updatedImages });

      const projectSnapshot = await getDoc(projectDocRef);
      if (projectSnapshot.exists()) {
        const projectData = projectSnapshot.data();
        await updateDoc(projectDocRef, { ...projectData, status: status });
        console.log(`Unselected images status updated successfully for project: ${projectId}.`);
      } else {
        throw new Error('Project does not exist.');
      }
    } catch (error) {
      console.error(`Error updating unselected images: ${error.message}`);
      throw error;
    }
  };

export const toggleFileFavoriteInFirestore = async (domain, projectId, collectionId, photoId) => {
    if (!domain || !projectId || !collectionId || !photoId) {
        throw new Error('Domain, Project ID, Collection ID, and Photo ID are required.');
    }

    const collectionDocRefPath = doc(db, 'studios', domain, 'projects', projectId, 'collections', collectionId);

    try {
        const collectionSnapshot = await getDoc(collectionDocRefPath);
        if (!collectionSnapshot.exists()) {
            throw new Error('Collection does not exist.');
        }

        const collectionData = collectionSnapshot.data();

        // New relationship model: toggle status on the Project Photo (canonical)
        const photoRef = doc(db, 'studios', domain, 'projects', projectId, 'photos', photoId);
        const photoSnap = await getDoc(photoRef);
        let newStatus;
        if (photoSnap.exists()) {
            const photoData = photoSnap.data();
            newStatus = photoData.status === 'selected' ? 'unselected' : 'selected';
            await updateDoc(photoRef, {
                status: newStatus,
                updatedAt: Date.now(),
            });
        } else {
            // Legacy fallback: toggle within collection.uploadedFiles[]
            const updatedFiles = collectionData.uploadedFiles.map(file => {
                const fileKey = file.photoId || file.fileId || file.url || file.name;
                if (fileKey === photoId) {
                    return {
                        ...file,
                        status: file.status === 'selected' ? 'unselected' : 'selected'
                    };
                }
                return file;
            });
            await updateDoc(collectionDocRefPath, { uploadedFiles: updatedFiles });
            const updatedFile = updatedFiles.find(file => (file.photoId || file.fileId || file.url || file.name) === photoId);
            newStatus = updatedFile?.status;
        }

        console.log(`File favorite status toggled successfully.`);
        return newStatus;
    } catch (error) {
        console.error('Error toggling file favorite:', error.message);
        throw error;
    }
};

export const updateImageLikeCountInFirestore = async (domain, projectId, collectionId, photoId, action = 'increment') => {
    if (!domain || !projectId || !collectionId || !photoId) {
        throw new Error('Domain, Project ID, Collection ID, and Photo ID are required.');
    }

    const collectionDocRefPath = doc(db, 'studios', domain, 'projects', projectId, 'collections', collectionId);

    try {
        const collectionSnapshot = await getDoc(collectionDocRefPath);
        if (!collectionSnapshot.exists()) {
            throw new Error('Collection does not exist.');
        }

        const collectionData = collectionSnapshot.data();

        // New relationship model: update likes on the Project Photo (canonical)
        const photoRef = doc(db, 'studios', domain, 'projects', projectId, 'photos', photoId);
        const photoSnap = await getDoc(photoRef);
        let newLikes;
        if (photoSnap.exists()) {
            const photoData = photoSnap.data();
            const currentLikes = photoData.likes || 0;
            newLikes = action === 'increment' ? currentLikes + 1 : Math.max(0, currentLikes - 1);
            await updateDoc(photoRef, {
                likes: newLikes,
                updatedAt: Date.now(),
            });
        } else {
            // Legacy fallback: update within collection.uploadedFiles[]
            const updatedFiles = collectionData.uploadedFiles.map(file => {
                const fileKey = file.photoId || file.fileId || file.url || file.name;
                if (fileKey === photoId) {
                    const currentLikes = file.likes || 0;
                    return {
                        ...file,
                        likes: action === 'increment' ? currentLikes + 1 : Math.max(0, currentLikes - 1)
                    };
                }
                return file;
            });
            await updateDoc(collectionDocRefPath, { ...collectionData, uploadedFiles: updatedFiles });
            const updatedFile = updatedFiles.find(f => (f.photoId || f.fileId || f.url || f.name) === photoId);
            newLikes = updatedFile?.likes;
        }

        return newLikes;
    } catch (error) {
        console.error(`Error updating image like count: ${error.message}`);
        throw error;
    }
};

// Cover photo
export const setCoverPhotoInFirestore = async (domain, projectId, image) => {
    if (!domain || !projectId || !image) {
        throw new Error('Domain, Project ID, and Image are required.');
    }

    const studioDocRef = doc(db, 'studios', domain);
    const projectsCollectionRef = collection(studioDocRef, 'projects');
    const projectDocRef = doc(projectsCollectionRef, projectId);

    try {
        const projectSnapshot = await getDoc(projectDocRef);

        if (projectSnapshot.exists()) {
            await updateDoc(projectDocRef, { projectCover: image });
            console.log(`%cCover photo updated successfully for project: ${projectId}.`, `color: #54a134;`);
        } else {
            console.log(`%cProject ${projectId} does not exist.`, 'color: red;');
            throw new Error('Project does not exist.');
        }
    } catch (error) {
        console.error(`%cError updating cover photo for project: ${projectId} - ${error.message}`, 'color: red;');
        throw error;
    }
};
export const setGalleryCoverPhotoInFirestore = async (domain, projectId, collectionId, image) => {
    if (!domain || !projectId || !collectionId || !image) {
        throw new Error('Domain, Project ID, Collection ID, and Image are required.');
    }
    const studioDocRef = doc(db, 'studios', domain);
    const projectsCollectionRef = collection(studioDocRef, 'projects');
    const projectDocRef = doc(projectsCollectionRef, projectId);
    try {
        const projectSnapshot = await getDoc(projectDocRef);
        if (!projectSnapshot.exists()) {
            throw new Error('Project does not exist.');
        }

        const projectData = projectSnapshot.data();
        const { collections } = projectData;

        // Find the specific collection by collectionId
        const collectionIndex = collections.findIndex(c => c.id === collectionId);
        if (collectionIndex === -1) {
            throw new Error('Collection ID does not exist.');
        }

        // Update the galleryCover for the found collection
        const updatedCollections = [...collections];
        updatedCollections[collectionIndex] = {
            ...updatedCollections[collectionIndex],
            galleryCover: image
        };

        // Save the updated collections array back to Firestore
        await updateDoc(projectDocRef, { collections: updatedCollections });
} catch (error) {
        console.error(`%cError updating gallery cover photo for project: ${projectId}, collection: ${collectionId} - ${error.message}`, 'color: red;');
        throw error;
    }
};
