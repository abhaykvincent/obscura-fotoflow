import { db } from '../app';
import {
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  runTransaction,
  increment,
  query,
  orderBy,
} from 'firebase/firestore';
import { generateRandomString } from '../../utils/stringUtils';
import {
  normalizeGallery,
  normalizeCategory,
  buildGalleryPayload,
  getPhotoId,
  getPhotoKey,
  buildDefaultGalleryFromLegacy,
} from '../../utils/selectionGalleryUtils';

const galleryColRef = (domain, projectId) => collection(db, 'studios', domain, 'projects', projectId, 'selectionGalleries');
const galleryDocRef = (domain, projectId, galleryId) => doc(db, 'studios', domain, 'projects', projectId, 'selectionGalleries', galleryId);
const selectionsColRef = (domain, projectId, galleryId) => collection(db, 'studios', domain, 'projects', projectId, 'selectionGalleries', galleryId, 'selections');
const selectionDocRef = (domain, projectId, galleryId, photoKey) =>
  // Firestore doc IDs cannot contain '/'; photo urls do. Use sanitized key.
  doc(db, 'studios', domain, 'projects', projectId, 'selectionGalleries', galleryId, 'selections', sanitizeDocId(photoKey));

export const sanitizeDocId = (key = '') => {
  // Stable, reversible-ish: base64url of the key would be long; instead use
  // a hash-safe encoding. Keep it simple: encodeURIComponent then truncate-safe.
  // Slashes break paths, so replace them.
  let s = String(key || '');
  // Use a short hash prefix to avoid collisions after sanitization
  let hash = 0;
  for (let i = 0; i < s.length; i += 1) {
    hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  }
  const safe = encodeURIComponent(s).replace(/%/g, '_').replace(/\//g, '_').slice(0, 400);
  return `${safe}__${hash.toString(36)}`;
};

/* ---------------- CRUD ---------------- */

export const createSelectionGallery = async (domain, projectId, { name, selectionMode, selectionLimit, categories, client, createdBy } = {}) => {
  if (!domain || !projectId) throw new Error('Domain and Project ID are required.');
  const idBase = (name || 'selection').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'selection';
  const id = `${idBase}-${generateRandomString(5)}`.toLowerCase();
  const payload = { ...buildGalleryPayload({ name, selectionMode, selectionLimit, categories, client, createdBy: createdBy || '' }), id };
  await setDoc(galleryDocRef(domain, projectId, id), payload);
  await logGalleryActivity(domain, projectId, {
    type: 'selection_gallery_created',
    title: 'Selection Gallery Created',
    description: `${payload.name} was created${payload.selectionLimit ? ` with a ${payload.selectionLimit}-photo limit` : ''}.`,
    galleryId: id,
  }).catch(() => {});
  return { id, ...payload };
};

export const fetchSelectionGalleries = async (domain, projectId) => {
  if (!domain || !projectId) return [];
  try {
    const snap = await getDocs(query(galleryColRef(domain, projectId), orderBy('createdAt', 'asc')));
    return snap.docs.map((d) => normalizeGallery({ id: d.id, ...d.data() }));
  } catch (e) {
    // orderBy may fail if createdAt missing on old docs; fall back to unordered
    try {
      const snap = await getDocs(galleryColRef(domain, projectId));
      return snap.docs.map((d) => normalizeGallery({ id: d.id, ...d.data() }));
    } catch (err) {
      console.error('fetchSelectionGalleries failed:', err.message);
      return [];
    }
  }
};

export const fetchSelectionGallery = async (domain, projectId, galleryId) => {
  if (!domain || !projectId || !galleryId) throw new Error('Domain, Project ID and Gallery ID are required.');
  const snap = await getDoc(galleryDocRef(domain, projectId, galleryId));
  if (!snap.exists()) return null;
  return normalizeGallery({ id: snap.id, ...snap.data() });
};

export const updateSelectionGallery = async (domain, projectId, galleryId, updates = {}, updatedBy = '') => {
  if (!domain || !projectId || !galleryId) throw new Error('Domain, Project ID and Gallery ID are required.');
  // Block client-side privilege escalation: limits/status/categories are
  // studio-only fields. Callers must ensure auth; rules enforce it server-side too.
  const allowed = {};
  ['name', 'description', 'selectionMode', 'selectionLimit', 'categories', 'status', 'client', 'pinRequired', 'updatedBy'].forEach((k) => {
    if (updates[k] !== undefined) allowed[k] = updates[k];
  });
  if (Array.isArray(allowed.categories)) {
    allowed.categories = allowed.categories.map((c, i) => normalizeCategory(c, i));
  }
  await updateDoc(galleryDocRef(domain, projectId, galleryId), { ...allowed, updatedAt: Date.now(), ...(updatedBy ? { updatedBy } : {}) });
};

export const deleteSelectionGallery = async (domain, projectId, galleryId) => {
  await deleteDoc(galleryDocRef(domain, projectId, galleryId));
};

export const activateSelectionGallery = async (domain, projectId, galleryId, updatedBy = '') => {
  await updateDoc(galleryDocRef(domain, projectId, galleryId), {
    status: 'active', activatedAt: Date.now(), updatedAt: Date.now(), ...(updatedBy ? { updatedBy } : {}),
  });
  await logGalleryActivity(domain, projectId, { type: 'selection_gallery_activated', title: 'Selection Activated', description: 'Client selection is now open.', galleryId }).catch(() => {});
};

export const completeSelectionGallery = async (domain, projectId, galleryId, { completedBy = 'client' } = {}) => {
  await updateDoc(galleryDocRef(domain, projectId, galleryId), {
    status: 'completed', completedAt: Date.now(), updatedAt: Date.now(), updatedBy: completedBy,
  });
  await logGalleryActivity(domain, projectId, { type: 'selection_completed', title: 'Selection Completed', description: 'Client completed the selection gallery.', galleryId }).catch(() => {});
};

export const reopenSelectionGallery = async (domain, projectId, galleryId, updatedBy = '') => {
  await updateDoc(galleryDocRef(domain, projectId, galleryId), {
    status: 'active', completedAt: null, updatedAt: Date.now(), ...(updatedBy ? { updatedBy } : {}),
  });
  await logGalleryActivity(domain, projectId, { type: 'selection_reopened', title: 'Selection Reopened', description: 'Selection gallery was reopened for changes.', galleryId }).catch(() => {});
};

export const lockSelectionGallery = async (domain, projectId, galleryId) => {
  await updateDoc(galleryDocRef(domain, projectId, galleryId), { status: 'locked', updatedAt: Date.now() });
};

/* ---------------- Selections (photo references, never copies) ---------------- */

/**
 * Transactional select with server-side limit enforcement.
 * Never allows overall or category limit overflow, even under concurrency.
 * Returns { ok, reason? }.
 */
export const addPhotoToSelection = async (domain, projectId, galleryId, photo, { categoryId = null, selectedBy = 'client' } = {}) => {
  if (!domain || !projectId || !galleryId || !photo) throw new Error('Missing selection parameters.');
  const photoKey = getPhotoKey(photo);
  if (!photoKey) throw new Error('Photo has no stable identity.');
  const photoId = getPhotoId(photo);
  const galleryRef = galleryDocRef(domain, projectId, galleryId);
  const selRef = selectionDocRef(domain, projectId, galleryId, photoKey);

  return runTransaction(db, async (tx) => {
    const gSnap = await tx.get(galleryRef);
    if (!gSnap.exists()) throw new Error('Selection gallery does not exist.');
    const gallery = normalizeGallery({ id: gSnap.id, ...gSnap.data() });
    if (gallery.status !== 'active') return { ok: false, reason: gallery.status === 'completed' || gallery.status === 'locked' || gallery.status === 'archived' ? 'gallery-completed' : 'gallery-inactive' };

    const existingSel = await tx.get(selRef);
    if (existingSel.exists()) return { ok: false, reason: 'duplicate' };

    const overallLimit = gallery.selectionMode === 'unlimited' ? null : gallery.selectionLimit;
    if (overallLimit !== null && Number(gallery.selectedCount || 0) >= Number(overallLimit)) {
      return { ok: false, reason: 'overall-limit' };
    }

    let targetCategory = null;
    if (gallery.categories.length > 0) {
      targetCategory = gallery.categories.find((c) => c.id === categoryId) || gallery.categories[0];
      const max = targetCategory.maximumSelections !== null && targetCategory.maximumSelections !== undefined
        ? Number(targetCategory.maximumSelections) : null;
      if (max !== null && Number(targetCategory.selectedCount || 0) >= max) {
        return { ok: false, reason: 'category-limit', categoryId: targetCategory.id };
      }
    }

    const now = Date.now();
    tx.set(selRef, {
      photoId,
      photoKey,
      url: photo.url || null, // fallback for legacy resolution; not a copy
      collectionId: photo.collectionId || photo.collection || null,
      categoryId: targetCategory ? targetCategory.id : (categoryId || null),
      selectedAt: now,
      selectedBy,
      status: 'selected',
    });

    const catUpdates = {};
    if (targetCategory) {
      const updatedCats = gallery.categories.map((c) =>
        c.id === targetCategory.id ? { ...c, selectedCount: Number(c.selectedCount || 0) + 1 } : c,
      );
      catUpdates.categories = updatedCats;
    }
    const newCount = Number(gallery.selectedCount || 0) + 1;
    const limit = gallery.selectionMode === 'unlimited' ? null : gallery.selectionLimit;
    tx.update(galleryRef, {
      ...catUpdates,
      selectedCount: increment(1),
      progressPercent: limit ? Math.min(100, Math.round((newCount / Number(limit)) * 100)) : 0,
      updatedAt: now,
    });
    return { ok: true };
  });
};

export const removePhotoFromSelection = async (domain, projectId, galleryId, photo) => {
  if (!domain || !projectId || !galleryId || !photo) throw new Error('Missing selection parameters.');
  const photoKey = typeof photo === 'string' ? photo : getPhotoKey(photo);
  const galleryRef = galleryDocRef(domain, projectId, galleryId);
  const selRef = selectionDocRef(domain, projectId, galleryId, photoKey);

  return runTransaction(db, async (tx) => {
    const gSnap = await tx.get(galleryRef);
    if (!gSnap.exists()) throw new Error('Selection gallery does not exist.');
    const gallery = normalizeGallery({ id: gSnap.id, ...gSnap.data() });
    const selSnap = await tx.get(selRef);
    if (!selSnap.exists()) return { ok: false, reason: 'not-selected' };
    const selData = selSnap.data();
    tx.delete(selRef);
    const updatedCats = gallery.categories.map((c) =>
      c.id === selData.categoryId ? { ...c, selectedCount: Math.max(0, Number(c.selectedCount || 0) - 1) } : c,
    );
    const newCount = Math.max(0, Number(gallery.selectedCount || 0) - 1);
    const limit = gallery.selectionMode === 'unlimited' ? null : gallery.selectionLimit;
    tx.update(galleryRef, {
      categories: updatedCats,
      selectedCount: increment(-1),
      progressPercent: limit ? Math.min(100, Math.round((newCount / Number(limit)) * 100)) : 0,
      updatedAt: Date.now(),
    });
    void newCount;
    return { ok: true };
  });
};

export const fetchGallerySelections = async (domain, projectId, galleryId) => {
  const snap = await getDocs(selectionsColRef(domain, projectId, galleryId));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const fetchSelectionProgress = async (domain, projectId, galleryId) => {
  const gallery = await fetchSelectionGallery(domain, projectId, galleryId);
  if (!gallery) return null;
  return {
    gallery,
    count: gallery.selectedCount,
    limit: gallery.selectionMode === 'unlimited' ? null : gallery.selectionLimit,
    percent: gallery.progressPercent,
    categories: gallery.categories.map((c) => ({ id: c.id, name: c.name, count: c.selectedCount, limit: c.maximumSelections })),
  };
};

/** Recompute denormalized counters from the selections subcollection (repair tool). */
export const recomputeGalleryCounters = async (domain, projectId, galleryId) => {
  const selections = await fetchGallerySelections(domain, projectId, galleryId);
  const gallery = await fetchSelectionGallery(domain, projectId, galleryId);
  if (!gallery) throw new Error('Gallery not found.');
  const counts = {};
  selections.forEach((s) => {
    if (s.categoryId) counts[s.categoryId] = (counts[s.categoryId] || 0) + 1;
  });
  const updatedCats = gallery.categories.map((c) => ({ ...c, selectedCount: counts[c.id] || 0 }));
  const total = selections.length;
  const limit = gallery.selectionMode === 'unlimited' ? null : gallery.selectionLimit;
  await updateDoc(galleryDocRef(domain, projectId, galleryId), {
    categories: updatedCats,
    selectedCount: total,
    progressPercent: limit ? Math.min(100, Math.round((total / Number(limit)) * 100)) : 0,
    updatedAt: Date.now(),
  });
  return { total, counts };
};

/* ---------------- Backward compat + migration ---------------- */

/** Lazy compat: ensure a default gallery exists for legacy projects. Idempotent. */
export const ensureDefaultGallery = async (domain, projectId, { createdBy = '' } = {}) => {
  const ref = galleryDocRef(domain, projectId, 'default');
  const snap = await getDoc(ref);
  if (snap.exists()) return normalizeGallery({ id: snap.id, ...snap.data() });
  // Check project for legacy flag to decide mode
  let legacy = false;
  try {
    const pSnap = await getDoc(doc(db, 'studios', domain, 'projects', projectId));
    const pData = pSnap.data() || {};
    legacy = Array.isArray(pData.collections) && pData.collections.some((c) => c.selectionGallery === true);
  } catch { /* ignore */ }
  const payload = {
    ...buildDefaultGalleryFromLegacy({ collections: legacy ? [{ selectionGallery: true }] : [] }, { createdBy }),
    id: 'default',
  };
  // Legacy projects open selection immediately; new defaults start as draft
  // but legacy-compat treats default as active so old links keep working.
  if (legacy) {
    payload.status = 'active';
    payload.activatedAt = Date.now();
  }
  await setDoc(ref, payload);
  return normalizeGallery(payload);
};

/** One-time migration: legacy url selections → default gallery references. Idempotent. */
export const migrateLegacySelectionsToGallery = async (domain, projectId, projectData = null) => {
  const log = [];
  const gallery = await ensureDefaultGallery(domain, projectId);
  let legacyIds = [];
  if (projectData?.selectedImageIds?.length) {
    legacyIds = [...projectData.selectedImageIds];
  } else if (!projectData) {
    try {
      const pSnap = await getDoc(doc(db, 'studios', domain, 'projects', projectId));
      legacyIds = pSnap.data()?.selectedImageIds || [];
    } catch { legacyIds = []; }
  }
  // Also collect per-file status === 'selected' urls as fallback
  if ((!legacyIds || legacyIds.length === 0) && projectData?.collections) {
    projectData.collections.forEach((c) => {
      (c.uploadedFiles || []).forEach((f) => {
        if (f.status === 'selected' && f.url) legacyIds.push(f.url);
      });
    });
  }
  const unique = [...new Set(legacyIds.filter(Boolean))];
  let migrated = 0;
  let skipped = 0;
  for (const key of unique) {
    try {
      const selRef = selectionDocRef(domain, projectId, gallery.id, key);
      const existing = await getDoc(selRef);
      if (existing.exists()) {
        skipped += 1;
        continue;
      }
      await setDoc(selRef, {
        photoId: key,
        photoKey: key,
        url: key,
        collectionId: null,
        categoryId: null,
        selectedAt: Date.now(),
        selectedBy: 'client',
        status: 'selected',
        migratedFromLegacy: true,
      });
      migrated += 1;
    } catch (e) {
      log.push(`FAILED ${key}: ${e.message}`);
    }
  }
  if (migrated > 0) {
    await recomputeGalleryCounters(domain, projectId, gallery.id).catch(() => {});
  }
  log.push(`project=${projectId} gallery=${gallery.id} migrated=${migrated} skipped=${skipped} total=${unique.length}`);
  return { galleryId: gallery.id, migrated, skipped, total: unique.length, log };
};

const logGalleryActivity = async (domain, projectId, entry) => {
  const { updateDoc: _u, arrayUnion } = await import('firebase/firestore');
  const { generateRandomString: _g } = await import('../../utils/stringUtils');
  const activity = { id: `act-${_g(5)}`, timestamp: Date.now(), ...entry };
  await _u(doc(db, 'studios', domain, 'projects', projectId), { activityLog: arrayUnion(activity) });
  return activity;
};

export const getSelectionSummary = async (domain, projectId, galleryId) => {
  const gallery = await fetchSelectionGallery(domain, projectId, galleryId);
  if (!gallery) return null;
  const selections = await fetchGallerySelections(domain, projectId, galleryId);
  return { gallery, selections, total: selections.length };
};
