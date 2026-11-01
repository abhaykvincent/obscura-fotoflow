import {
  normalizeGallery,
  canSelectPhoto,
  getSelectionProgress,
  getCategoryProgress,
  canCompleteGallery,
  getPhotoId,
  photoMatchesSelectionId,
  isPhotoEligible,
  hasLegacySelection,
} from './selectionGalleryUtils';

const gallery80 = (overrides = {}) => normalizeGallery({
  id: 'album-selection',
  name: 'Album Selection',
  status: 'active',
  selectionMode: 'limit',
  selectionLimit: 80,
  selectedCount: 0,
  categories: [
    { id: 'bride', name: 'Bride', maximumSelections: 15, selectedCount: 0, sortOrder: 0 },
    { id: 'groom', name: 'Groom', maximumSelections: 15, selectedCount: 0, sortOrder: 1 },
  ],
  ...overrides,
});

describe('selectionGalleryUtils — limits, categories, progress', () => {
  test('79/80 → select allowed; 80/80 → rejected (overall)', () => {
    const ok = canSelectPhoto({ gallery: gallery80({ selectedCount: 79 }), categoryId: 'bride' });
    expect(ok.allowed).toBe(true);
    const full = canSelectPhoto({
      gallery: gallery80({ selectedCount: 80, categories: [{ id: 'bride', name: 'Bride', maximumSelections: 15, selectedCount: 5 }] }),
      categoryId: 'bride',
    });
    expect(full.allowed).toBe(false);
    expect(full.reason).toBe('overall-limit');
  });

  test('category validation: 14/15 allowed, 15/15 rejected', () => {
    const allowed = canSelectPhoto({
      gallery: gallery80({ selectedCount: 10, categories: [{ id: 'bride', name: 'Bride', maximumSelections: 15, selectedCount: 14 }] }),
      categoryId: 'bride',
    });
    expect(allowed.allowed).toBe(true);
    const rejected = canSelectPhoto({
      gallery: gallery80({ selectedCount: 10, categories: [{ id: 'bride', name: 'Bride', maximumSelections: 15, selectedCount: 15 }] }),
      categoryId: 'bride',
    });
    expect(rejected.allowed).toBe(false);
    expect(rejected.reason).toBe('category-limit');
  });

  test('combined limits: both must be respected', () => {
    // overall available + category available → allowed
    expect(canSelectPhoto({ gallery: gallery80({ selectedCount: 10 }), categoryId: 'bride' }).allowed).toBe(true);
    // overall full + category available → rejected (overall)
    expect(canSelectPhoto({
      gallery: gallery80({ selectedCount: 80, categories: [{ id: 'bride', name: 'Bride', maximumSelections: 15, selectedCount: 5 }] }),
      categoryId: 'bride',
    }).reason).toBe('overall-limit');
    // overall available + category full → rejected (category)
    expect(canSelectPhoto({
      gallery: gallery80({ selectedCount: 10, categories: [{ id: 'bride', name: 'Bride', maximumSelections: 15, selectedCount: 15 }] }),
      categoryId: 'bride',
    }).reason).toBe('category-limit');
  });

  test('unlimited category (limit null) allows selection', () => {
    const g = gallery80({ selectedCount: 10, categories: [{ id: 'misc', name: 'Misc', maximumSelections: null, selectedCount: 500 }] });
    expect(canSelectPhoto({ gallery: g, categoryId: 'misc' }).allowed).toBe(true);
  });

  test('completed/locked/archived galleries reject; draft rejects as inactive', () => {
    expect(canSelectPhoto({ gallery: gallery80({ status: 'completed' }) }).reason).toBe('gallery-completed');
    expect(canSelectPhoto({ gallery: gallery80({ status: 'locked' }) }).reason).toBe('gallery-completed');
    expect(canSelectPhoto({ gallery: gallery80({ status: 'draft' }) }).reason).toBe('gallery-inactive');
  });

  test('duplicate selection rejected', () => {
    expect(canSelectPhoto({ gallery: gallery80(), isAlreadySelected: true }).reason).toBe('duplicate');
  });

  test('progress states: empty / in-progress / complete', () => {
    expect(getSelectionProgress(gallery80({ selectedCount: 0, selectionLimit: 80 }))).toMatchObject({ count: 0, limit: 80, percent: 0 });
    expect(getSelectionProgress(gallery80({ selectedCount: 43, selectionLimit: 80 })).percent).toBe(54);
    expect(getSelectionProgress(gallery80({ selectedCount: 80, selectionLimit: 80 }))).toMatchObject({ percent: 100, isComplete: true });
    expect(getSelectionProgress(gallery80({ selectedCount: 72, selectionLimit: 80 }))).toMatchObject({ percent: 90, remaining: 8 });
  });

  test('category progress exposes count/limit', () => {
    const g = gallery80({ categories: [{ id: 'bride', name: 'Bride', maximumSelections: 15, selectedCount: 14 }] });
    expect(getCategoryProgress(g, 'bride')).toMatchObject({ count: 14, limit: 15 });
  });

  test('completion: required minimums block finish; reopened/active allows', () => {
    const blocked = canCompleteGallery(gallery80({
      categories: [{ id: 'family', name: 'Family', minimumSelections: 5, maximumSelections: 10, required: true, selectedCount: 3 }],
    }));
    expect(blocked.canComplete).toBe(false);
    expect(blocked.blockers[0]).toMatchObject({ type: 'category-minimum', needed: 2 });
    const ok = canCompleteGallery(gallery80({
      categories: [{ id: 'family', name: 'Family', minimumSelections: 5, maximumSelections: 10, required: true, selectedCount: 5 }],
    }));
    expect(ok.canComplete).toBe(true);
    expect(canCompleteGallery(gallery80({ status: 'completed' })).canComplete).toBe(false);
  });

  test('photo identity prefers photoId, falls back to url (migration-safe)', () => {
    expect(getPhotoId({ photoId: 'abc', url: 'http://x' })).toBe('abc');
    expect(getPhotoId({ url: 'http://x' })).toBe('http://x');
    expect(photoMatchesSelectionId({ url: 'http://x', photoId: 'abc' }, 'http://x')).toBe(true);
    expect(photoMatchesSelectionId({ url: 'http://x', photoId: 'abc' }, 'abc')).toBe(true);
    expect(photoMatchesSelectionId({ url: 'http://x' }, 'other')).toBe(false);
  });

  test('eligibility: exists + belongs + not deleted', () => {
    expect(isPhotoEligible({ url: 'http://x' })).toBe(true);
    expect(isPhotoEligible({ url: 'http://x', deleted: true })).toBe(false);
    expect(isPhotoEligible(null)).toBe(false);
    expect(isPhotoEligible({})).toBe(false);
  });

  test('legacy detection: collection.selectionGallery preserved', () => {
    expect(hasLegacySelection({ collections: [{ id: 'a', selectionGallery: true }] })).toBe(true);
    expect(hasLegacySelection({ collections: [{ id: 'a', selectionGallery: false }] })).toBe(false);
  });

  test('legacy limit field maps to maximumSelections', () => {
    const g = normalizeGallery({ status: 'active', categories: [{ id: 'b', name: 'B', limit: 10 }] });
    expect(g.categories[0].maximumSelections).toBe(10);
  });
});
