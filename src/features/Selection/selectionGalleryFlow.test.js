import {
  buildGalleryPayload,
  normalizeGallery,
  canSelectPhoto,
  getSelectionProgress,
  canCompleteGallery,
} from '../../utils/selectionGalleryUtils';

/**
 * Integration-style flow test (pure domain layer):
 * Create → Configure limit → Add categories → Activate →
 * Select → Progress → Limit reached → Review → Complete → Reopen.
 * Firestore transaction/concurrency behaviour is covered by
 * selection-gallery-firestore.js (runTransaction) + rules; here we
 * verify the state machine the UI drives.
 */
describe('Selection gallery end-to-end domain flow', () => {
  test('Create → activate → select to limit → review → complete → reopen', () => {
    // Create with limit + categories
    let gallery = normalizeGallery({
      ...buildGalleryPayload({
        name: 'Album Selection',
        selectionMode: 'limit',
        selectionLimit: 3,
        categories: [
          { id: 'bride', name: 'Bride', maximumSelections: 2, selectedCount: 0, sortOrder: 0 },
          { id: 'groom', name: 'Groom', maximumSelections: 2, selectedCount: 0, sortOrder: 1 },
        ],
      }),
      id: 'album-selection',
    });
    expect(gallery.status).toBe('draft');

    // Activate
    gallery = normalizeGallery({ ...gallery, status: 'active', activatedAt: Date.now() });

    // Select photo 1 (bride)
    let check = canSelectPhoto({ gallery, categoryId: 'bride' });
    expect(check.allowed).toBe(true);
    gallery = normalizeGallery({
      ...gallery,
      selectedCount: 1,
      categories: gallery.categories.map((c) => (c.id === 'bride' ? { ...c, selectedCount: 1 } : c)),
    });
    expect(getSelectionProgress(gallery)).toMatchObject({ count: 1, limit: 3 });

    // Select photo 2 (bride) → category now full (2/2)
    gallery = normalizeGallery({
      ...gallery,
      selectedCount: 2,
      categories: gallery.categories.map((c) => (c.id === 'bride' ? { ...c, selectedCount: 2 } : c)),
    });
    const catFull = canSelectPhoto({ gallery, categoryId: 'bride' });
    expect(catFull.allowed).toBe(false);
    expect(catFull.reason).toBe('category-limit');

    // Select photo 3 (groom) → overall limit reached
    check = canSelectPhoto({ gallery, categoryId: 'groom' });
    expect(check.allowed).toBe(true);
    gallery = normalizeGallery({
      ...gallery,
      selectedCount: 3,
      categories: gallery.categories.map((c) => (c.id === 'groom' ? { ...c, selectedCount: 1 } : c)),
    });
    expect(getSelectionProgress(gallery).isComplete).toBe(true);

    // Photo 4 rejected (overall)
    expect(canSelectPhoto({ gallery, categoryId: 'groom' }).reason).toBe('overall-limit');

    // Review → complete (no required minimums → allowed)
    expect(canCompleteGallery(gallery).canComplete).toBe(true);
    gallery = normalizeGallery({ ...gallery, status: 'completed', completedAt: Date.now() });

    // After completion, selection rejected; existing selections intact
    expect(canSelectPhoto({ gallery, categoryId: 'groom' }).reason).toBe('gallery-completed');
    expect(gallery.selectedCount).toBe(3);

    // Photographer reopens → active, selections intact, can modify again
    gallery = normalizeGallery({ ...gallery, status: 'active', completedAt: null });
    // Remove one (3→2) then another photo can be selected
    gallery = normalizeGallery({ ...gallery, selectedCount: 2 });
    expect(canSelectPhoto({ gallery, categoryId: 'groom' }).allowed).toBe(true);
  });

  test('Isolation: two galleries never share counts', () => {
    const album = normalizeGallery({ id: 'album', status: 'active', selectionMode: 'limit', selectionLimit: 80, selectedCount: 80 });
    const wall = normalizeGallery({ id: 'wall', status: 'active', selectionMode: 'limit', selectionLimit: 20, selectedCount: 12 });
    expect(canSelectPhoto({ gallery: album }).reason).toBe('overall-limit');
    expect(canSelectPhoto({ gallery: wall }).allowed).toBe(true);
  });
});
