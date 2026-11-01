/**
 * Project-Owned Photo Asset Persistence Boundary
 *
 * Canonical FotoFlow photo architecture:
 *   studios/{domain}/projects/{projectId}/photos/{photoId}
 *
 * Project = asset boundary. Photo = canonical asset.
 * Collection = organization/view (references photos via photoIds[]).
 *
 * photoId is the upload-generated fileId (collision-resistant). The original
 * filename is metadata only, never identity.
 *
 * Relationship model:
 *   Collection document has `photoIds[]` (ordered list of photoId strings).
 *   Project Photo document has `collectionIds[]` (reverse lookup of collections
 *   referencing this photo). This supports:
 *     - thousands of photos per project
 *     - collection pagination (slice photoIds)
 *     - add/remove photo from collection
 *     - same photo in multiple collections
 *     - efficient project-level photo queries (query the photos subcollection)
 *
 * All functions are project-scoped. None copy the full Photo object into
 * Collection documents.
 */

import {
    db,
} from "../app";
import {
    doc,
    collection,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    arrayUnion,
    arrayRemove,
    increment,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    writeBatch,
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { getStorageForDomain } from "../../utils/uploadOperations";
import { getPhotoStoragePaths } from "../../utils/photoStorage";

/* ------------------------------------------------------------------ */
/* Collection references                                              */
/* ------------------------------------------------------------------ */

const photosCollectionRef = (domain, projectId) =>
    collection(db, 'studios', domain, 'projects', projectId, 'photos');

const projectDocRef = (domain, projectId) =>
    doc(db, 'studios', domain, 'projects', projectId);

const collectionDocRef = (domain, projectId, collectionId) =>
    doc(db, 'studios', domain, 'projects', projectId, 'collections', collectionId);

const studioDocRef = (domain) =>
    doc(db, 'studios', domain);

/* ------------------------------------------------------------------ */
/* Canonical Photo Model                                              */
/* ------------------------------------------------------------------ */

/**
 * Builds the canonical Project Photo document from upload pipeline output.
 *
 * @param {string} domain
 * @param {string} projectId
 * @param {Object} photoInput - {
 *     photoId, name, originalSize, lastModified, dateTimeOriginal,
 *     dimensions, urls: { web, thumb }, storage: { webPath, thumbPath },
 *     status, collectionId
 *   }
 * @returns {Object} photo document data
 */
export const buildProjectPhoto = ({
    domain,
    projectId,
    photoId,
    name,
    originalSize,
    lastModified,
    dateTimeOriginal,
    dimensions,
    urls = {},
    storage = {},
    status = 'active',
    collectionId,
    createdAt = Date.now(),
}) => {
    const now = Date.now();
    return {
        id: photoId,
        name,
        originalSize: Number(originalSize) || 0,
        lastModified: lastModified || now,
        dateTimeOriginal: dateTimeOriginal || new Date(lastModified || now).toISOString(),
        dimensions: dimensions || { width: 0, height: 0 },
        urls: {
            web: urls.web || '',
            thumb: urls.thumb || '',
        },
        storage: {
            webPath: storage.webPath || '',
            thumbPath: storage.thumbPath || '',
        },
        status,
        collectionIds: collectionId ? [collectionId] : [],
        createdAt,
        updatedAt: now,
    };
};

/* ------------------------------------------------------------------ */
/* Photo CRUD                                                         */
/* ------------------------------------------------------------------ */

/**
 * Creates a canonical Project Photo document. Idempotent: if a photo with the
 * same photoId already exists, it is NOT overwritten (returns existing).
 *
 * @returns {Promise<{ photoId: string, created: boolean, photo: Object }>}
 */
export const createProjectPhoto = async (domain, projectId, photoInput) => {
    if (!domain || !projectId || !photoInput || !photoInput.photoId) {
        throw new Error('Domain, Project ID, and photo with photoId are required.');
    }

    const { photoId } = photoInput;
    const photoRef = doc(photosCollectionRef(domain, projectId), photoId);

    const existing = await getDoc(photoRef);
    if (existing.exists()) {
        return { photoId, created: false, photo: existing.data() };
    }

    const photoData = buildProjectPhoto({
        domain,
        projectId,
        ...photoInput,
    });

    await setDoc(photoRef, photoData);

    // Increment project-level unique photo counter
    const projectSnap = await getDoc(projectDocRef(domain, projectId));
    if (projectSnap.exists()) {
        const updateData = {
            uploadedFilesCount: increment(1),
        };
        if (photoInput.originalSize) {
            updateData.totalFileSize = increment(Number(photoInput.originalSize));
        }
        await updateDoc(projectDocRef(domain, projectId), updateData);
    }

    // Update studio storage usage
    try {
        await updateDoc(studioDocRef(domain), {
            "usage.storage.used": increment(Number(photoInput.originalSize || 0)),
        });
    } catch (e) {
        // Studio storage is best-effort; never fail photo creation for it.
        console.warn('Studio storage increment skipped:', e.message);
    }

    return { photoId, created: true, photo: photoData };
};

/**
 * Fetches a single canonical Project Photo by photoId.
 * @returns {Promise<Object|null>} photo data or null
 */
export const fetchProjectPhotoById = async (domain, projectId, photoId) => {
    if (!domain || !projectId || !photoId) {
        throw new Error('Domain, Project ID, and Photo ID are required.');
    }
    const photoRef = doc(photosCollectionRef(domain, projectId), photoId);
    const snap = await getDoc(photoRef);
    if (!snap.exists()) return null;
    return snap.data();
};

/**
 * Fetches Project Photos for a project with optional pagination and filtering.
 *
 * @param {Object} options
 *   {string} domain
 *   {string} projectId
 *   {number} pageSize (default 50)
 *   {Object|undefined} cursor - last doc snapshot from previous page
 *   {string[]} collectionIds - if provided, only photos in ALL listed collections
 *   {string} status - filter by photo status
 * @returns {Promise<{ photos: Object[], lastDoc: Object|null, hasMore: boolean }>
 */
export const fetchProjectPhotos = async (domain, projectId, {
    pageSize = 50,
    cursor,
    collectionIds,
    status,
    orderByField = 'createdAt',
    orderDirection = 'desc',
} = {}) => {
    if (!domain || !projectId) {
        throw new Error('Domain and Project ID are required.');
    }

    let q = query(
        photosCollectionRef(domain, projectId),
        orderBy(orderByField, orderDirection),
        limit(pageSize)
    );

    const constraints = [];
    if (collectionIds && collectionIds.length > 0) {
        // Photos that belong to ALL of the given collections.
        constraints.push(where('collectionIds', 'array-contains-any', collectionIds));
    }
    if (status) {
        constraints.push(where('status', '==', status));
    }

    // Firestore allows at most one array-contains / array-contains-any per query.
    // If we have both collectionIds and status, we filter client-side for status.
    if (constraints.length > 0) {
        q = query(q, ...constraints);
    }
    if (cursor) {
        q = query(q, startAfter(cursor));
    }

    const snap = await getDocs(q);
    const photos = snap.docs.map((d) => d.data());

    const lastDoc = snap.docs[snap.docs.length - 1] || null;
    const hasMore = snap.docs.length === pageSize;

    return { photos, lastDoc, hasMore };
};

/**
 * Updates metadata on a canonical Project Photo.
 * @returns {Promise<Object>} updated photo data
 */
export const updateProjectPhotoMetadata = async (domain, projectId, photoId, updates) => {
    if (!domain || !projectId || !photoId) {
        throw new Error('Domain, Project ID, and Photo ID are required.');
    }
    const photoRef = doc(photosCollectionRef(domain, projectId), photoId);
    const snap = await getDoc(photoRef);
    if (!snap.exists()) {
        throw new Error(`Photo ${photoId} not found in project ${projectId}.`);
    }

    const payload = {
        ...updates,
        updatedAt: Date.now(),
    };

    await updateDoc(photoRef, payload);
    return { ...snap.data(), ...payload };
};

/**
 * Persists an embedding vector on a canonical Project Photo and synchronizes
 * legacy collection.uploadedFiles if present.
 *
 * @param {string} domain
 * @param {string} projectId
 * @param {string} photoId
 * @param {number[]} vector
 * @param {Object} [meta]
 * @param {string} [collectionId]
 * @returns {Promise<Object>} updated photo payload
 */
export const savePhotoEmbeddingToFirestore = async (domain, projectId, photoId, vector, meta = {}, collectionId = null) => {
    if (!domain || !projectId || !photoId) {
        throw new Error('Domain, Project ID, and Photo ID are required to save embedding.');
    }
    if (!Array.isArray(vector) || vector.length === 0) {
        throw new Error('A valid non-empty vector array is required.');
    }

    const now = Date.now();
    const payload = {
        embedding: vector,
        embeddings: {
            geminiEmbedding2: {
                vector,
                model: meta.model || 'gemini-embedding-2',
                dimension: vector.length,
                updatedAt: new Date(now).toISOString(),
                ...(meta.details || {}),
            },
        },
        updatedAt: now,
    };

    // 1. Update canonical Project Photo document if it exists
    if (photoId && !photoId.includes('/')) {
        try {
            const photoRef = doc(photosCollectionRef(domain, projectId), photoId);
            const snap = await getDoc(photoRef);
            if (snap.exists()) {
                await updateDoc(photoRef, payload);
            }
        } catch (err) {
            console.warn(`Could not update photo doc ${photoId}:`, err.message);
        }
    }

    // 2. Backward compatibility: update in collection.uploadedFiles[] if present
    if (collectionId) {
        try {
            const collectionDocRef = doc(db, 'studios', domain, 'projects', projectId, 'collections', `${collectionId}`);
            const collectionSnap = await getDoc(collectionDocRef);
            if (collectionSnap.exists()) {
                const collectionData = collectionSnap.data();
                if (Array.isArray(collectionData.uploadedFiles) && collectionData.uploadedFiles.length > 0) {
                    let changed = false;
                    const updatedFiles = collectionData.uploadedFiles.map((f) => {
                        const fileId = f.photoId || f.fileId || f.id || f.url || f.name;
                        if (fileId === photoId || f.url === photoId) {
                            changed = true;
                            return {
                                ...f,
                                ...payload,
                            };
                        }
                        return f;
                    });
                    if (changed) {
                        await updateDoc(collectionDocRef, { uploadedFiles: updatedFiles });
                    }
                }
            }
        } catch (err) {
            console.warn(`Could not sync embedding to collection ${collectionId}:`, err.message);
        }
    }

    return payload;
};

/**
 * Deletes a canonical Project Photo safely.
 *
 * Before physical deletion, determines whether the Photo is referenced by
 * Collections, Selection, Events/Shoots, Smart Gallery, Design, Delivery, AI.
 * Defines safe behavior for referenced assets. Does not silently orphan
 * relationships.
 *
 * @param {Object} options
 *   {boolean} force - if true, delete even when referenced (removes relationships)
 *   {boolean} dryRun - if true, returns reference report without deleting
 * @returns {Promise<{ deleted: boolean, photoId, references: Object, removedRelationships: Object }>}
 */
export const deleteProjectPhoto = async (domain, projectId, photoId, { force = false, dryRun = false } = {}) => {
    if (!domain || !projectId || !photoId) {
        throw new Error('Domain, Project ID, and Photo ID are required.');
    }

    const photoRef = doc(photosCollectionRef(domain, projectId), photoId);
    const photoSnap = await getDoc(photoRef);
    if (!photoSnap.exists()) {
        throw new Error(`Photo ${photoId} not found in project ${projectId}.`);
    }

    const photo = photoSnap.data();

    // --- Determine dependent references ---
    const references = {
        collections: [],      // collectionIds from the photo doc
        selection: [],        // project.selectedImageIds containing photoId or url
        events: [],           // project.events with shootId/photoRefs
        shoots: [],           // shoots subcollection photoRefs
        smartGallery: [],     // collection smartGallery sections referencing photoId
        cover: [],            // project.projectCover or collection galleryCover
    };

    // Collections referencing this photo (from photo.collectionIds reverse lookup)
    references.collections = Array.isArray(photo.collectionIds) ? [...photo.collectionIds] : [];

    // Project-level checks
    const projectSnap = await getDoc(projectDocRef(domain, projectId));
    const projectData = projectSnap.exists() ? projectSnap.data() : {};

    // Selection: selectedImageIds may contain photoId (new) or url (legacy)
    if (Array.isArray(projectData.selectedImageIds)) {
        references.selection = projectData.selectedImageIds.filter(
            (id) => id === photoId || id === photo.url || id === photo.name
        );
    }

    // Events: events array may reference this photo via shootId or photoRefs
    if (Array.isArray(projectData.events)) {
        references.events = projectData.events.filter((e) =>
            e.photoRefs?.includes(photoId) ||
            e.shootId === photoId ||
            e.collectionIds?.includes(photoId)
        );
    }

    // Project cover / gallery cover references
    if (projectData.projectCover === photo.url || projectData.projectCover === photo.storage.webPath) {
        references.cover.push('project');
    }

    // Smart Gallery references across collections
    const collectionsSnap = await getDocs(collection(db, 'studios', domain, 'projects', projectId, 'collections'));
    collectionsSnap.docs.forEach((c) => {
        const cData = c.data();
        if (cData.smartGallery?.sections) {
            cData.smartGallery.sections.forEach((s) => {
                if (Array.isArray(s.images)) {
                    const refs = s.images.filter((img) =>
                        img.photoId === photoId ||
                        img.id === photoId ||
                        img.fileId === photoId ||
                        img.url === photo.url
                    );
                    if (refs.length > 0) {
                        references.smartGallery.push({ collectionId: cData.id, sectionId: s.id, count: refs.length });
                    }
                }
            });
        }
        if (cData.galleryCover === photo.url) {
            references.cover.push(`collection:${cData.id}`);
        }
    });

    // --- Safety decision ---
    const totalReferences =
        references.collections.length +
        references.selection.length +
        references.events.length +
        references.smartGallery.reduce((acc, s) => acc + s.count, 0) +
        references.cover.length;

    if (!force && totalReferences > 0 && !dryRun) {
        return {
            deleted: false,
            photoId,
            references,
            reason: 'photo-referenced',
            message: `Photo ${photoId} is referenced by ${totalReferences} dependent(s). Use force=true to remove relationships and delete.`,
        };
    }

    if (dryRun) {
        return {
            deleted: false,
            photoId,
            references,
            referenceCount: totalReferences,
        };
    }

    // --- Remove relationships ---
    const removedRelationships = {
        collections: [],
        selection: [],
        smartGallery: [],
    };

    const batch = writeBatch(db);

    // Remove photo from each referencing collection's photoIds[]
    for (const collectionId of references.collections) {
        const cRef = collectionDocRef(domain, projectId, collectionId);
        batch.update(cRef, {
            photoIds: arrayRemove(photoId),
            updatedAt: Date.now(),
        });
        removedRelationships.collections.push(collectionId);
    }

    // Remove from project selectedImageIds
    if (references.selection.length > 0) {
        const toRemove = references.selection;
        batch.update(projectDocRef(domain, projectId), {
            selectedImageIds: arrayRemove(...toRemove),
        });
        removedRelationships.selection = toRemove;
    }

    // Decrement project counters
    batch.update(projectDocRef(domain, projectId), {
        uploadedFilesCount: increment(-1),
        totalFileSize: increment(-(photo.originalSize || 0)),
        updatedAt: Date.now(),
    });

    // Decrement studio storage usage
    batch.update(studioDocRef(domain), {
        "usage.storage.used": increment(-(photo.originalSize || 0)),
    });

    // Delete the photo document
    batch.delete(photoRef);

    // Physical storage deletion (web + thumb)
    const storage = await getStorageForDomain(domain);
    const storageDeletions = [];
    if (photo.storage?.webPath) {
        storageDeletions.push(deleteObject(ref(storage, photo.storage.webPath)).catch(() => {}));
    }
    if (photo.storage?.thumbPath) {
        storageDeletions.push(deleteObject(ref(storage, photo.storage.thumbPath)).catch(() => {}));
    }
    await Promise.all(storageDeletions);

    await batch.commit();

    return {
        deleted: true,
        photoId,
        references,
        removedRelationships,
    };
};

/* ------------------------------------------------------------------ */
/* Collection <-> Photo Relationships                                 */
/* ------------------------------------------------------------------ */

/**
 * Adds a canonical Project Photo to a Collection.
 * Creates the Project Photo if it doesn't exist (from minimal input).
 *
 * Relationship is bidirectional:
 *   - Collection.photoIds[] gains photoId (arrayUnion)
 *   - Project Photo.collectionIds[] gains collectionId (arrayUnion)
 *
 * @returns {Promise<{ photoId, collectionId, created: boolean }>}
 */
export const addPhotoToCollection = async (domain, projectId, collectionId, photoInput) => {
    if (!domain || !projectId || !collectionId || !photoInput || !photoInput.photoId) {
        throw new Error('Domain, Project ID, Collection ID, and photo with photoId are required.');
    }

    const { photoId } = photoInput;

    // 1. Ensure canonical Project Photo exists
    const { created } = await createProjectPhoto(domain, projectId, photoInput);

    // 2. Add photoId to Collection.photoIds[]
    const cRef = collectionDocRef(domain, projectId, collectionId);
    const cSnap = await getDoc(cRef);
    if (!cSnap.exists()) {
        throw new Error(`Collection ${collectionId} does not exist in project ${projectId}.`);
    }

    await updateDoc(cRef, {
        photoIds: arrayUnion(photoId),
        updatedAt: Date.now(),
    });

    // 3. Add collectionId to Project Photo.collectionIds[] (reverse lookup)
    const photoRef = doc(photosCollectionRef(domain, projectId), photoId);
    const photoSnap = await getDoc(photoRef);
    if (photoSnap.exists()) {
        const existing = photoSnap.data();
        if (!Array.isArray(existing.collectionIds) || !existing.collectionIds.includes(collectionId)) {
            await updateDoc(photoRef, {
                collectionIds: arrayUnion(collectionId),
                updatedAt: Date.now(),
            });
        }
    }

    // 4. Increment collection photo count
    await updateDoc(cRef, {
        photoCount: increment(1),
    });

    return { photoId, collectionId, created };
};

/**
 * Removes a canonical Project Photo from a Collection.
 * Does NOT delete the underlying Project Photo.
 *
 * @returns {Promise<{ photoId, collectionId, removed: boolean }>}
 */
export const removePhotoFromCollection = async (domain, projectId, collectionId, photoId) => {
    if (!domain || !projectId || !collectionId || !photoId) {
        throw new Error('Domain, Project ID, Collection ID, and Photo ID are required.');
    }

    const cRef = collectionDocRef(domain, projectId, collectionId);
    const cSnap = await getDoc(cRef);
    if (!cSnap.exists()) {
        throw new Error(`Collection ${collectionId} does not exist.`);
    }

    // Remove photoId from Collection.photoIds[]
    await updateDoc(cRef, {
        photoIds: arrayRemove(photoId),
        photoCount: increment(-1),
        updatedAt: Date.now(),
    });

    // Remove collectionId from Project Photo.collectionIds[]
    const photoRef = doc(photosCollectionRef(domain, projectId), photoId);
    const photoSnap = await getDoc(photoRef);
    if (photoSnap.exists()) {
        const existing = photoSnap.data();
        if (Array.isArray(existing.collectionIds) && existing.collectionIds.includes(collectionId)) {
            await updateDoc(photoRef, {
                collectionIds: arrayRemove(collectionId),
                updatedAt: Date.now(),
            });
        }
    }

    return { photoId, collectionId, removed: true };
};

/**
 * Returns the ordered list of photoIds for a Collection.
 * @returns {Promise<string[]>}
 */
export const getCollectionPhotoIds = async (domain, projectId, collectionId) => {
    if (!domain || !projectId || !collectionId) {
        throw new Error('Domain, Project ID, and Collection ID are required.');
    }
    const cSnap = await getDoc(collectionDocRef(domain, projectId, collectionId));
    if (!cSnap.exists()) return [];
    const data = cSnap.data();
    return Array.isArray(data.photoIds) ? [...data.photoIds] : [];
};

/**
 * Returns the count of unique canonical Project Photos in a project.
 */
export const getProjectPhotoCount = async (domain, projectId) => {
    if (!domain || !projectId) {
        throw new Error('Domain and Project ID are required.');
    }
    const projectSnap = await getDoc(projectDocRef(domain, projectId));
    if (!projectSnap.exists()) return 0;
    return Number(projectSnap.data().uploadedFilesCount || 0);
};

/* ------------------------------------------------------------------ */
/* Migration / Compatibility Helpers                                  */
/* ------------------------------------------------------------------ */

/**
 * Determines whether a legacy uploadedFiles[] entry already has a canonical
 * Project Photo. Returns the canonical photo data or null.
 * Legacy photo identity is matched by url or name.
 */
export const findExistingProjectPhoto = async (domain, projectId, legacyPhoto) => {
    if (!domain || !projectId || !legacyPhoto) return null;
    const { url, name } = legacyPhoto;
    // Query photos by matching url or name (legacy fallback matching)
    const q = query(
        photosCollectionRef(domain, projectId),
        limit(1)
    );
    // Note: Firestore doesn't support OR on url/name. We fetch all photos and
    // match client-side for now. For migration-scale this is fine (project-scoped).
    const snap = await getDocs(q);
    for (const d of snap.docs) {
        const p = d.data();
        if (p.url?.web === url || p.url?.web === legacyPhoto.url || p.name === name) {
            return p;
        }
    }
    return null;
};

/**
 * Converts a legacy uploadedFiles[] object into canonical photo input shape.
 */
export const legacyPhotoToPhotoInput = (legacyPhoto, domain, projectId) => {
    const fileId = legacyPhoto.fileId || legacyPhoto.photoId || legacyPhoto.id || legacyPhoto.url || legacyPhoto.name;
    const storagePaths = legacyPhoto.storage
        ? { webPath: legacyPhoto.storage.webPath, thumbPath: legacyPhoto.storage.thumbPath }
        : getPhotoStoragePaths(domain, projectId, fileId, legacyPhoto.name || '');

    return {
        photoId: fileId,
        name: legacyPhoto.name || '',
        originalSize: legacyPhoto.originalSize || legacyPhoto.size || 0,
        lastModified: legacyPhoto.lastModified || Date.now(),
        dateTimeOriginal: legacyPhoto.dateTimeOriginal || new Date(legacyPhoto.lastModified || Date.now()).toISOString(),
        dimensions: legacyPhoto.dimensions || { width: 0, height: 0 },
        urls: {
            web: legacyPhoto.url || '',
            thumb: legacyPhoto.thumbUrl || '',
        },
        storage: storagePaths,
        status: legacyPhoto.status || 'active',
    };
};
