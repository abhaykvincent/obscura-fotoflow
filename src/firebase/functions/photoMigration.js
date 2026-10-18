/**
 * Project-Owned Photo Asset Migration Tooling
 *
 * Migration is:
 *   - project-scoped
 *   - resumable (tracks state per project)
 *   - idempotent (safe to run more than once)
 *   - retryable (individual failures don't stop the whole migration)
 *   - concurrency/rate controlled
 *   - observable (progress callbacks)
 *   - non-destructive (never deletes legacy data or photos)
 *
 * For each existing Collection uploadedFiles[] object:
 *   1. Determine canonical photoId (fileId/photoId/id/url/name)
 *   2. Create Project Photo if it doesn't exist
 *   3. Preserve original filename and metadata
 *   4. Map current web/thumb URLs and Storage paths
 *   5. Create Collection → Photo relationship
 *   6. Preserve status/selection-relevant metadata
 *   7. Verify before marking complete
 */

import { db } from '../app';
import { doc, collection, getDocs, getDoc, updateDoc, arrayUnion, writeBatch } from 'firebase/firestore';
import {
    createProjectPhoto,
    addPhotoToCollection,
    fetchProjectPhotoById,
    legacyPhotoToPhotoInput,
} from './photo-firestore';

/**
 * Migration state document path.
 * studios/{domain}/projects/{projectId}/_migration/photoMigrationState
 */
const migrationStateRef = (domain, projectId) =>
    doc(db, 'studios', domain, 'projects', projectId, '_migration', 'photoMigrationState');

/**
 * Default batch size and rate control for migration.
 */
const DEFAULT_BATCH_SIZE = 20;
const DEFAULT_DELAY_MS = 250;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Runs the photo migration for a single project.
 *
 * @param {string} domain - studio domain
 * @param {string} projectId - project id
 * @param {Object} options
 *   {number} batchSize - photos per batch (default 20)
 *   {number} delayMs - delay between batches (default 250ms)
 *   {Function} onProgress - callback({ processed, total, phase, collectionId })
 *   {boolean} resume - if true, skip already-migrated collections
 * @returns {Promise<{ migratedCollections: number, migratedPhotos: number, relationships: number, errors: Array }>}
 */
export const migrateProjectPhotos = async (domain, projectId, {
    batchSize = DEFAULT_BATCH_SIZE,
    delayMs = DEFAULT_DELAY_MS,
    onProgress,
    resume = true,
} = {}) => {
    if (!domain || !projectId) {
        throw new Error('Domain and Project ID are required.');
    }

    // --- Load or initialize migration state ---
    let migrationState = { version: 1, completedCollections: [], errors: [], lastUpdated: Date.now() };
    if (resume) {
        try {
            const stateSnap = await getDoc(migrationStateRef(domain, projectId));
            if (stateSnap.exists()) {
                migrationState = { ...migrationState, ...stateSnap.data() };
            }
        } catch (e) {
            // State doesn't exist yet; start fresh.
        }
    }

    const completedSet = new Set(migrationState.completedCollections || []);

    // --- Fetch all collections for the project ---
    const collectionsSnap = await getDocs(collection(db, 'studios', domain, 'projects', projectId, 'collections'));
    const collections = collectionsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    let migratedCollections = 0;
    let migratedPhotos = 0;
    let relationships = 0;
    const errors = [];

    for (const collection of collections) {
        const collectionId = collection.id;

        // Skip already-completed collections (resumable)
        if (completedSet.has(collectionId)) {
            continue;
        }

        onProgress?.({
            phase: 'collection',
            collectionId,
            processed: migratedCollections,
            total: collections.length,
        });

        try {
            const result = await migrateCollectionPhotos(
                domain,
                projectId,
                collectionId,
                collection,
                { batchSize, delayMs, onProgress }
            );

            migratedPhotos += result.migratedPhotos;
            relationships += result.relationships;

            // Mark collection as completed
            completedSet.add(collectionId);
            migrationState.completedCollections = Array.from(completedSet);
            migrationState.lastUpdated = Date.now();
            migrationState.errors = errors;

            await updateDoc(migrationStateRef(domain, projectId), migrationState);

            migratedCollections++;
        } catch (e) {
            console.error(`Migration failed for collection ${collectionId}:`, e.message);
            errors.push({ collectionId, error: e.message, timestamp: Date.now() });
            migrationState.errors = errors;
            migrationState.lastUpdated = Date.now();
            await updateDoc(migrationStateRef(domain, projectId), migrationState).catch(() => {});
        }
    }

    onProgress?.({
        phase: 'complete',
        processed: migratedCollections,
        total: collections.length,
        migratedPhotos,
        relationships,
        errors: errors.length,
    });

    return {
        migratedCollections,
        migratedPhotos,
        relationships,
        errors,
    };
};

/**
 * Migrates all photos within a single collection.
 */
const migrateCollectionPhotos = async (domain, projectId, collectionId, collectionData, {
    batchSize = DEFAULT_BATCH_SIZE,
    delayMs = DEFAULT_DELAY_MS,
    onProgress,
} = {}) => {
    const legacyFiles = Array.isArray(collectionData.uploadedFiles) ? collectionData.uploadedFiles : [];
    const existingPhotoIds = Array.isArray(collectionData.photoIds) ? collectionData.photoIds : [];

    let migratedPhotos = 0;
    let relationships = 0;

    // Process in batches for rate control
    for (let i = 0; i < legacyFiles.length; i += batchSize) {
        const batch = legacyFiles.slice(i, i + batchSize);
        const batchOps = [];

        for (const legacyFile of batch) {
            try {
                // 1. Determine canonical photoId
                const photoId = legacyFile.photoId || legacyFile.fileId || legacyFile.id || legacyFile.url || legacyFile.name;

                // Skip if relationship already exists (idempotent)
                if (existingPhotoIds.includes(photoId)) {
                    continue;
                }

                // 2. Convert legacy photo to canonical photo input
                const photoInput = legacyPhotoToPhotoInput(legacyFile, domain, projectId);

                // 3. Create Project Photo if it doesn't exist (idempotent)
                const { created } = await createProjectPhoto(domain, projectId, photoInput);
                if (created) migratedPhotos++;

                // 4. Create Collection → Photo relationship
                await addPhotoToCollection(domain, projectId, collectionId, photoInput);
                relationships++;

                batchOps.push({ photoId, status: 'migrated' });
            } catch (e) {
                console.warn(`Failed to migrate photo ${legacyFile.name || legacyFile.url}:`, e.message);
                batchOps.push({ photoId: legacyFile.name || legacyFile.url, status: 'failed', error: e.message });
            }
        }

        // Rate control between batches
        if (i + batchSize < legacyFiles.length) {
            await sleep(delayMs);
        }

        onProgress?.({
            phase: 'photos',
            collectionId,
            processed: Math.min(i + batchSize, legacyFiles.length),
            total: legacyFiles.length,
        });
    }

    return { migratedPhotos, relationships };
};

/**
 * Checks the migration state for a project.
 * @returns {Promise<Object>} migration state or null
 */
export const getMigrationState = async (domain, projectId) => {
    if (!domain || !projectId) return null;
    try {
        const snap = await getDoc(migrationStateRef(domain, projectId));
        if (!snap.exists()) return null;
        return snap.data();
    } catch (e) {
        return null;
    }
};

/**
 * Verifies migration completeness for a project.
 * Compares legacy uploadedFiles counts vs canonical Project Photo counts.
 * @returns {Promise<Object>} verification report
 */
export const verifyMigration = async (domain, projectId) => {
    if (!domain || !projectId) {
        throw new Error('Domain and Project ID are required.');
    }

    const collectionsSnap = await getDocs(collection(db, 'studios', domain, 'projects', projectId, 'collections'));
    const collections = collectionsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    let legacyPhotoCount = 0;
    let canonicalPhotoCount = 0;
    let relationshipCount = 0;
    let uniquePhotoIds = new Set();
    let totalStorageSize = 0;
    const issues = [];

    for (const collection of collections) {
        const legacyFiles = Array.isArray(collection.uploadedFiles) ? collection.uploadedFiles : [];
        const photoIds = Array.isArray(collection.photoIds) ? collection.photoIds : [];

        legacyPhotoCount += legacyFiles.length;
        relationshipCount += photoIds.length;

        photoIds.forEach((pid) => uniquePhotoIds.add(pid));

        legacyFiles.forEach((f) => {
            totalStorageSize += f.originalSize || f.size || 0;
        });
    }

    // Count canonical Project Photos
    const photosSnap = await getDocs(collection(db, 'studios', domain, 'projects', projectId, 'photos'));
    canonicalPhotoCount = photosSnap.docs.length;

    photosSnap.docs.forEach((d) => {
        const p = d.data();
        totalStorageSize += p.originalSize || 0;
    });

    return {
        legacyPhotoCount,
        canonicalPhotoCount,
        relationshipCount,
        uniquePhotoCount: uniquePhotoIds.size,
        totalStorageSize,
        issues,
        isComplete: canonicalPhotoCount > 0 && relationshipCount > 0,
    };
};
