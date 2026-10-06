/**
 * Selection Gallery — pure domain logic (no Firebase imports).
 *
 * Canonical model:
 *   Collection  = where photos belong
 *   Selection Gallery = what the client is asked to choose
 *   Category    = how that selection is organized
 *   Selection   = the client's actual choice (photo reference, never a copy)
 */

export const GALLERY_STATUSES = ['draft', 'active', 'completed', 'locked', 'archived'];
export const SELECTION_MODES = ['limit', 'unlimited'];

export const DEFAULT_CATEGORY_TEMPLATES = [
  { name: 'Bride', limit: 15 },
  { name: 'Groom', limit: 15 },
  { name: 'Couple', limit: 20 },
  { name: 'Family', limit: 10 },
  { name: 'Ceremony', limit: 10 },
  { name: 'Reception', limit: 10 },
];

const slugify = (s = '', fallback = 'category') => {
  const slug = String(s || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return slug || fallback;
};

export const newCategoryId = (name = '', existing = []) => {
  const base = slugify(name, 'category');
  if (!existing.includes(base)) return base;
  let i = 2;
  while (existing.includes(`${base}-${i}`)) i += 1;
  return `${base}-${i}`;
};

export const normalizeCategory = (raw = {}, sortOrder = 0) => {
  // Back-compat: `limit` is treated as maximumSelections when
  // maximumSelections is absent. minimumSelections defaults to 0.
  const maximumSelections =
    raw.maximumSelections !== undefined ? raw.maximumSelections : (raw.limit !== undefined ? raw.limit : null);
  const minimumSelections =
    raw.minimumSelections !== undefined ? raw.minimumSelections : 0;
  return {
    id: raw.id || slugify(raw.name || 'category'),
    name: raw.name || 'Untitled',
    // legacy field kept for reads; writers should prefer maximumSelections
    limit: maximumSelections,
    maximumSelections,
    minimumSelections,
    required: Boolean(raw.required),
    selectedCount: Number(raw.selectedCount || 0),
    sortOrder: raw.sortOrder !== undefined ? raw.sortOrder : sortOrder,
  };
};

export const normalizeGallery = (raw = {}) => {
  const categories = Array.isArray(raw.categories)
    ? raw.categories.map((c, i) => normalizeCategory(c, i)).sort((a, b) => a.sortOrder - b.sortOrder)
    : [];
  const selectionLimit = raw.selectionLimit !== undefined ? raw.selectionLimit : null;
  return {
    id: raw.id || 'default',
    name: raw.name || 'Album Selection',
    description: raw.description || '',
    status: GALLERY_STATUSES.includes(raw.status) ? raw.status : 'draft',
    selectionMode: raw.selectionMode === 'unlimited' ? 'unlimited' : 'limit',
    selectionLimit,
    selectedCount: Number(raw.selectedCount || 0),
    progressPercent: Number(raw.progressPercent || 0),
    categories,
    client: raw.client || { name: '', email: '', phone: '' },
    pinRequired: raw.pinRequired !== false,
    createdAt: raw.createdAt || null,
    updatedAt: raw.updatedAt || null,
    activatedAt: raw.activatedAt || null,
    completedAt: raw.completedAt || null,
    createdBy: raw.createdBy || '',
    updatedBy: raw.updatedBy || '',
  };
};

export const buildGalleryPayload = ({ name, selectionMode = 'limit', selectionLimit = 80, categories = [], client = {}, createdBy = '' }) => {
  const now = Date.now();
  const normalizedCategories = categories.map((c, i) => normalizeCategory(c, i));
  const mode = selectionMode === 'unlimited' ? 'unlimited' : 'limit';
  return {
    name: (name || 'Album Selection').trim() || 'Album Selection',
    description: '',
    status: 'draft',
    selectionMode: mode,
    selectionLimit: mode === 'unlimited' ? null : (selectionLimit === null || selectionLimit === undefined ? null : Number(selectionLimit)),
    selectedCount: 0,
    progressPercent: 0,
    categories: normalizedCategories,
    client: { name: client.name || '', email: client.email || '', phone: client.phone || '' },
    pinRequired: true,
    createdAt: now,
    updatedAt: now,
    activatedAt: null,
    completedAt: null,
    createdBy,
    updatedBy: createdBy,
  };
};

/**
 * Stable photo identity. Prefer photoId; fall back to url for legacy data.
 * photoId derivation: explicit id fields first, then storage path/name, then url.
 */
export const getPhotoId = (photo = {}) => {
  if (!photo || typeof photo !== 'object') return '';
  return (
    photo.photoId ||
    photo.id ||
    photo.fileId ||
    photo.path ||
    photo.storagePath ||
    photo.fullPath ||
    photo.name ||
    photo.url ||
    ''
  );
};

export const getPhotoKey = (photo = {}) => getPhotoId(photo) || photo.url || '';

/** Legacy helper: does a stored selection id match this photo (url or photoId)? */
export const photoMatchesSelectionId = (photo = {}, selectionId = '') => {
  if (!selectionId) return false;
  if (photo.url === selectionId) return true;
  return getPhotoId(photo) === selectionId;
};

export const getCategoryById = (gallery, categoryId) => {
  const g = normalizeGallery(gallery || {});
  if (!categoryId) return g.categories[0] || null;
  return g.categories.find((c) => c.id === categoryId) || null;
};

export const getCategoryLimit = (category) => {
  if (!category) return null;
  if (category.maximumSelections !== undefined && category.maximumSelections !== null) {
    return category.maximumSelections === null ? null : Number(category.maximumSelections);
  }
  if (category.limit === null || category.limit === undefined) return null;
  return Number(category.limit);
};

export const getOverallLimit = (gallery) => {
  const g = normalizeGallery(gallery || {});
  if (g.selectionMode === 'unlimited') return null;
  if (g.selectionLimit === null || g.selectionLimit === undefined) return null;
  return Number(g.selectionLimit);
};

/**
 * Core validation: can this photo be selected?
 * Returns { allowed: boolean, reason: null | 'gallery-completed' | 'gallery-inactive'
 *   | 'overall-limit' | 'category-limit' | 'duplicate' | 'photo-ineligible' }
 */
export const canSelectPhoto = ({ gallery, categoryId = null, selectedPhotoIds = [], categoryCounts = {}, photo = null, isAlreadySelected = false }) => {
  const g = normalizeGallery(gallery || {});
  if (g.status === 'completed' || g.status === 'locked' || g.status === 'archived') {
    return { allowed: false, reason: 'gallery-completed' };
  }
  if (g.status !== 'active') {
    // draft galleries cannot be selected by clients; photographer preview may bypass
    return { allowed: false, reason: 'gallery-inactive' };
  }
  if (isAlreadySelected) return { allowed: false, reason: 'duplicate' };
  if (photo && photo.deleted === true) return { allowed: false, reason: 'photo-ineligible' };

  const overallLimit = getOverallLimit(g);
  const overallCount = Number(g.selectedCount ?? selectedPhotoIds.length ?? 0);
  if (overallLimit !== null && overallCount >= overallLimit) {
    return { allowed: false, reason: 'overall-limit' };
  }

  if (g.categories.length > 0) {
    const category = getCategoryById(g, categoryId) || g.categories[0];
    const catLimit = getCategoryLimit(category);
    const catCount = Number(category?.selectedCount ?? categoryCounts[category?.id] ?? 0);
    if (catLimit !== null && catCount >= catLimit) {
      return { allowed: false, reason: 'category-limit', categoryId: category?.id };
    }
  }
  return { allowed: true, reason: null };
};

export const getSelectionProgress = (gallery) => {
  const g = normalizeGallery(gallery || {});
  const limit = getOverallLimit(g);
  const count = Number(g.selectedCount || 0);
  if (limit === null || limit <= 0) {
    return { count, limit: null, percent: 0, remaining: null, isComplete: false, isEmpty: count === 0 };
  }
  const percent = Math.min(100, Math.round((count / limit) * 100));
  return {
    count,
    limit,
    percent,
    remaining: Math.max(0, limit - count),
    isComplete: count >= limit,
    isEmpty: count === 0,
  };
};

export const getCategoryProgress = (gallery, categoryId) => {
  const g = normalizeGallery(gallery || {});
  const category = getCategoryById(g, categoryId);
  if (!category) return { count: 0, limit: null, percent: 0, remaining: null, isComplete: false };
  const limit = getCategoryLimit(category);
  const count = Number(category.selectedCount || 0);
  if (limit === null || limit === undefined) {
    return { count, limit: null, percent: 0, remaining: null, isComplete: false };
  }
  const percent = limit > 0 ? Math.min(100, Math.round((count / limit) * 100)) : 0;
  return { count, limit, percent, remaining: Math.max(0, limit - count), isComplete: count >= limit };
};

export const getSelectionSummary = (gallery) => {
  const g = normalizeGallery(gallery || {});
  const overall = getSelectionProgress({ ...g });
  const categories = g.categories.map((c) => ({ ...c, progress: getCategoryProgress(g, c.id) }));
  return { overall, categories, status: g.status, name: g.name, id: g.id };
};

/** Completion gate: returns { canComplete, blockers: [] } */
export const canCompleteGallery = (gallery) => {
  const g = normalizeGallery(gallery || {});
  if (g.status === 'completed') return { canComplete: false, blockers: [{ type: 'already-completed' }] };
  if (g.status !== 'active') return { canComplete: false, blockers: [{ type: 'gallery-inactive' }] };
  const blockers = [];
  g.categories
    .filter((c) => c.required)
    .forEach((c) => {
      const min = Number(c.minimumSelections || 0);
      const count = Number(c.selectedCount || 0);
      if (count < min) {
        blockers.push({ type: 'category-minimum', categoryId: c.id, categoryName: c.name, needed: min - count, minimum: min, count });
      }
    });
  // In limit mode completion is allowed via explicit Finish (recommended UX:
  // show review at limit but don't auto-submit). Unlimited mode always explicit.
  return { canComplete: blockers.length === 0, blockers };
};

/** Eligibility rule: photo exists, belongs to project, not deleted. */
export const isPhotoEligible = (photo) => {
  if (!photo) return false;
  if (photo.deleted === true) return false;
  if (!getPhotoKey(photo)) return false;
  return true;
};

export const selectionLimitMessage = (reason, { overallLimit, categoryName, categoryLimit } = {}) => {
  switch (reason) {
    case 'overall-limit':
      return `You've reached your ${overallLimit}-photo selection limit.`;
    case 'category-limit':
      return categoryName ? `${categoryName}: ${categoryLimit} photo limit reached.` : 'Category limit reached.';
    case 'gallery-completed':
      return 'This selection gallery is completed and no longer accepts changes.';
    case 'gallery-inactive':
      return 'This selection gallery is not active yet.';
    case 'duplicate':
      return 'Photo already selected.';
    case 'photo-ineligible':
      return 'This photo is no longer available for selection.';
    default:
      return 'This photo cannot be selected right now.';
  }
};

/** Legacy → default gallery adapter. */
export const hasLegacySelection = (project) =>
  Array.isArray(project?.collections) && project.collections.some((c) => c.selectionGallery === true);

export const buildDefaultGalleryFromLegacy = (project, { createdBy = '' } = {}) => {
  const now = Date.now();
  return {
    ...buildGalleryPayload({
      name: 'Default Selection',
      selectionMode: 'unlimited',
      selectionLimit: null,
      categories: [],
      createdBy,
    }),
    id: 'default',
    legacyMigrated: true,
    migratedAt: now,
  };
};

export const resolveGalleryIdFromRoute = (params = {}) =>
  params.selectionGalleryId || params.galleryId || null;
