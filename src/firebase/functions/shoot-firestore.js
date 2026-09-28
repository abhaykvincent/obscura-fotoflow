import { db } from "../app";
import {
    doc,
    collection,
    getDoc,
    getDocs,
    query,
    where,
    limit,
    runTransaction,
    serverTimestamp,
    arrayUnion,
    increment,
} from "firebase/firestore";

// Canonical shoots sub-collection:
// studios/{domain}/projects/{projectId}/shoots/{YYYY-MM-DD}
// Deterministic doc ID per calendar date gives idempotency and makes
// concurrent transactions on the same date serialize in Firestore.
export const shootsCollectionRef = (domain, projectId) =>
    collection(db, 'studios', domain, 'projects', projectId, 'shoots');

/**
 * Normalize any EXIF / file date value to a 'YYYY-MM-DD' calendar key.
 * Accepts ISO strings, Date objects, Firestore Timestamps, numbers.
 * Returns null when the value cannot be parsed.
 */
export const extractCaptureDateKey = (dateTimeOriginal) => {
    if (dateTimeOriginal === undefined || dateTimeOriginal === null || dateTimeOriginal === '') {
        return null;
    }
    let d;
    try {
        if (typeof dateTimeOriginal?.toDate === 'function') {
            d = dateTimeOriginal.toDate();
        } else if (dateTimeOriginal instanceof Date) {
            d = dateTimeOriginal;
        } else {
            d = new Date(dateTimeOriginal);
        }
    } catch {
        return null;
    }
    if (Number.isNaN(d?.getTime?.())) {
        return null;
    }
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

/**
 * Query Firestore for an existing shoot for this projectId + date.
 * Checks the deterministic doc ID first, then falls back to a
 * field query so legacy shoots created with random IDs are still found.
 *
 * @returns {Promise<{ id: string, data: object } | null>}
 */
export const findExistingShoot = async (domain, projectId, dateKey) => {
    if (!domain || !projectId || !dateKey) {
        throw new Error('Domain, Project ID, and date (YYYY-MM-DD) are required.');
    }
    const shootsRef = shootsCollectionRef(domain, projectId);

    // Fast path: deterministic ID lookup.
    const directSnap = await getDoc(doc(shootsRef, dateKey));
    if (directSnap.exists()) {
        return { id: directSnap.id, data: directSnap.data() };
    }

    // Fallback: field query for legacy / non-deterministic docs.
    const q = query(shootsRef, where('date', '==', dateKey), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) {
        const found = snap.docs[0];
        return { id: found.id, data: found.data() };
    }
    return null;
};

/**
 * Lookup-before-create with race-condition protection.
 *
 * - Groups must be de-duplicated by callers (one call per unique dateKey).
 * - Uses a Firestore transaction on the deterministic doc ID
 *   (shoots/{YYYY-MM-DD}) so parallel uploads for the same calendar date
 *   serialize: the loser sees the winner's doc and attaches instead of
 *   creating a duplicate.
 *
 * IF existingShoot found -> attach gallery/photo refs to existingShoot.id.
 * ELSE -> create single new Shoot { projectId, date, title, createdAt }.
 *
 * @returns {Promise<{ id: string, created: boolean }>}
 */
export const getOrCreateShootForDate = async (
    domain,
    projectId,
    dateKey,
    { title = '', collectionId = null, photoRefs = [], filesCount = 0, totalSize = 0 } = {}
) => {
    if (!domain || !projectId || !dateKey) {
        throw new Error('Domain, Project ID, and date (YYYY-MM-DD) are required.');
    }

    const shootsRef = shootsCollectionRef(domain, projectId);
    const shootDocRef = doc(shootsRef, dateKey);

    return runTransaction(db, async (transaction) => {
        const snap = await transaction.get(shootDocRef);

        if (snap.exists()) {
            // Attach new photo / gallery references to the existing shoot.
            const updates = {
                updatedAt: serverTimestamp(),
                filesCount: increment(filesCount),
                totalSize: increment(totalSize),
            };
            if (collectionId) {
                updates.collectionIds = arrayUnion(collectionId);
            }
            if (photoRefs && photoRefs.length > 0) {
                updates.photoRefs = arrayUnion(...photoRefs);
            }
            transaction.update(shootDocRef, updates);
            return { id: snap.id, created: false };
        }

        // No shoot for this date -> create exactly one.
        transaction.set(shootDocRef, {
            id: dateKey,
            projectId,
            date: dateKey,
            title,
            collectionIds: collectionId ? [collectionId] : [],
            photoRefs: photoRefs || [],
            filesCount,
            totalSize,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return { id: dateKey, created: true };
    });
};

/**
 * Batch entry point for the EXIF upload handler.
 * Groups uploaded files by capture-date key FIRST (in-memory dedupe),
 * then issues exactly one transaction per unique calendar date, so
 * N parallel photos on the same date -> 1 shoot, not N shoots.
 *
 * @returns {Promise<Array<{ dateKey: string, shootId: string, created: boolean, filesCount: number }>>}
 */
export const ensureShootsForUploadedFiles = async (
    domain,
    projectId,
    uploadedFiles,
    { projectTitle = '', collectionId = null, importFileSize = 0 } = {}
) => {
    if (!domain || !projectId || !uploadedFiles || uploadedFiles.length === 0) {
        return [];
    }

    // 1. In-memory grouping by YYYY-MM-DD (dedupes parallel photos in one batch).
    const filesByDateKey = {};
    for (const file of uploadedFiles) {
        const dateKey = extractCaptureDateKey(file?.dateTimeOriginal ?? file?.lastModified)
            || extractCaptureDateKey(Date.now());
        if (!filesByDateKey[dateKey]) {
            filesByDateKey[dateKey] = [];
        }
        filesByDateKey[dateKey].push(file);
    }

    const totalFiles = uploadedFiles.length;
    const sizePerFile = totalFiles > 0 ? importFileSize / totalFiles : 0;
    const results = [];

    // 2. One transaction per unique date. Sequential (not Promise.all) so two
    // dates in the same batch can't interleave writes on the parent project
    // doc in a way that drops an arrayUnion; per-date transactions still
    // protect against cross-batch / cross-gallery races.
    for (const [dateKey, files] of Object.entries(filesByDateKey)) {
        const photoRefs = files
            .map((f) => f?.url || f?.name)
            .filter(Boolean);
        const { id, created } = await getOrCreateShootForDate(domain, projectId, dateKey, {
            title: projectTitle,
            collectionId,
            photoRefs,
            filesCount: files.length,
            totalSize: Number((sizePerFile * files.length).toFixed(2)),
        });
        results.push({ dateKey, shootId: id, created, filesCount: files.length });
    }

    return results;
};
