import {
  selectPhotosForEmbedding,
  runPhotoEmbeddingBatch,
} from './photoEmbeddingOrchestrator';

describe('photoEmbeddingOrchestrator', () => {
  const samplePhotos = [
    { id: 'p1', name: 'img1.jpg', dateTimeOriginal: '2026-11-01T10:00:00Z', url: 'https://cdn.fotoflow.co/1.jpg' },
    { id: 'p2', name: 'img2.jpg', dateTimeOriginal: '2026-11-01T10:01:00Z', url: 'https://cdn.fotoflow.co/2.jpg', embedding: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8] },
    { id: 'p3', name: 'img3.jpg', dateTimeOriginal: '2026-11-01T10:02:00Z', url: 'https://cdn.fotoflow.co/3.jpg' },
    { id: 'p4', name: 'img4.jpg', dateTimeOriginal: '2026-11-01T10:03:00Z', url: 'https://cdn.fotoflow.co/4.jpg' },
    { id: 'p5', name: 'img5.jpg', dateTimeOriginal: '2026-11-01T10:04:00Z', url: 'https://cdn.fotoflow.co/5.jpg' },
  ];

  describe('selectPhotosForEmbedding', () => {
    it('slices candidates up to user-specified limit', () => {
      const selected = selectPhotosForEmbedding(samplePhotos, { limit: 2, onlyMissing: false });
      expect(selected).toHaveLength(2);
      expect(selected[0].id).toBe('p1');
      expect(selected[1].id).toBe('p2');
    });

    it('filters out photos that already have an embedding when onlyMissing is true', () => {
      const selected = selectPhotosForEmbedding(samplePhotos, { limit: 10, onlyMissing: true });
      expect(selected.map((p) => p.id)).toEqual(['p1', 'p3', 'p4', 'p5']);
    });

    it('respects allowedPhotoIds whitelist when specified', () => {
      const selected = selectPhotosForEmbedding(samplePhotos, {
        limit: 10,
        onlyMissing: false,
        allowedPhotoIds: ['p3', 'p5'],
      });
      expect(selected.map((p) => p.id)).toEqual(['p3', 'p5']);
    });
  });

  describe('runPhotoEmbeddingBatch with synthetic mode', () => {
    it('processes selected count of photos and returns valid embeddings', async () => {
      const progressEvents = [];
      const result = await runPhotoEmbeddingBatch({
        photos: samplePhotos,
        photoCount: 2,
        onlyMissing: true,
        useSynthetic: true,
        dimension: 32,
        onProgress: (p) => progressEvents.push({ ...p }),
      });

      expect(result.successful).toHaveLength(2);
      expect(result.failed).toHaveLength(0);
      expect(Object.keys(result.updatedMap)).toEqual(['p1', 'p3']);
      expect(result.updatedMap.p1.embedding).toHaveLength(32);
      expect(progressEvents.length).toBeGreaterThan(0);
    });

    it('supports cancellation via AbortSignal', async () => {
      const controller = new AbortController();
      controller.abort(); // already aborted

      const result = await runPhotoEmbeddingBatch({
        photos: samplePhotos,
        photoCount: 4,
        onlyMissing: false,
        useSynthetic: true,
        signal: controller.signal,
      });

      expect(result.successful).toHaveLength(0);
    });
  });
});
