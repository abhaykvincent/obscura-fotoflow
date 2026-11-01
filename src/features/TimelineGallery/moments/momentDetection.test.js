import { runTemporalSegmentation } from '../segmentation/temporalSegmentation';
import { DEFAULT_MOMENT_CONFIG, normalizeMomentConfig } from './momentConfig';
import {
  clearMomentCache,
  runMomentDetection,
  runMomentDetectionAsync,
} from './momentDetectionEngine';
import { cosineDistance, cosineSimilarity, normalizeVector } from './visualDistanceCalculator';
import { sampleRepresentativePhotos } from './momentRepresentativeSampler';

const MINUTE = 60 * 1000;
const BASE = Date.UTC(2026, 4, 1, 9, 0, 0);

const isoAt = (minutes) => new Date(BASE + minutes * MINUTE).toISOString();

const vectorA = [1, 0, 0, 0, 0, 0, 0, 0];
const vectorA2 = [0.98, 0.12, 0, 0, 0, 0, 0, 0];
const vectorB = [0, 1, 0, 0, 0, 0, 0, 0];
const vectorB2 = [0.1, 0.99, 0, 0, 0, 0, 0, 0];

const makePhoto = (id, minutes, embedding, extra = {}) => ({
  photoId: id,
  id,
  name: `${id}.jpg`,
  url: `https://example.test/${id}.jpg`,
  dateTimeOriginal: isoAt(minutes),
  ...(embedding ? { embedding } : {}),
  ...extra,
});

const segmentResult = (photos, segmentationConfig = {}) => runTemporalSegmentation(photos, {
  timeGapMinutes: 120,
  ...segmentationConfig,
});

const detect = (photos, momentConfig = {}, segmentationConfig = {}) => runMomentDetection(
  segmentResult(photos, segmentationConfig),
  { ...DEFAULT_MOMENT_CONFIG, ...momentConfig },
  { force: true },
);

describe('visual distance calculator', () => {
  it('uses cosine distance consistently and normalizes vectors', () => {
    const normalized = normalizeVector([2, 0, 0, 0, 0, 0, 0, 0]);
    expect(normalized[0]).toBe(1);
    expect(cosineSimilarity(vectorA, vectorA)).toBeCloseTo(1, 6);
    expect(cosineDistance(vectorA, vectorA)).toBeCloseTo(0, 6);
    expect(cosineDistance(vectorA, vectorB)).toBeCloseTo(1, 6);
  });
});

describe('moment detection', () => {
  beforeEach(() => {
    clearMomentCache();
  });

  it('splits a segment into visually coherent moments while preserving photo IDs', () => {
    const result = detect([
      makePhoto('a1', 0, vectorA),
      makePhoto('a2', 1, vectorA2),
      makePhoto('b1', 2, vectorB),
      makePhoto('b2', 3, vectorB2),
    ]);

    expect(result.enabled).toBe(true);
    expect(result.stats.totalMoments).toBe(2);
    expect(result.moments.map((moment) => moment.photoIds)).toEqual([['a1', 'a2'], ['b1', 'b2']]);
    expect(result.moments[0].parentSegmentId).toBe('temporal-segment-1');
    expect(result.stats.unassignedPhotos).toBe(0);
  });

  it('never merges temporally distant photos just because embeddings are similar', () => {
    const result = detect([
      makePhoto('early', 0, vectorA),
      makePhoto('late', 20, vectorA2),
    ], { maxGapMinutes: 5 });

    expect(result.stats.totalMoments).toBe(2);
    expect(result.moments.map((moment) => moment.photoIds)).toEqual([['early'], ['late']]);
  });

  it('does not split by camera ID when the activity is the same', () => {
    const result = detect([
      makePhoto('cam1', 0, vectorA, { cameraId: 'camera-1' }),
      makePhoto('cam2', 1, vectorA2, { cameraId: 'camera-2' }),
      makePhoto('cam3', 2, vectorA, { cameraId: 'camera-1' }),
    ]);

    expect(result.stats.totalMoments).toBe(1);
    expect(result.moments[0].photoIds).toEqual(['cam1', 'cam2', 'cam3']);
    expect(result.moments[0].cameraIds.sort()).toEqual(['camera-1', 'camera-2']);
  });

  it('marks missing embeddings as unassigned without zero-filling them', () => {
    const result = detect([
      makePhoto('a', 0, vectorA),
      makePhoto('b', 1, vectorA2),
      makePhoto('missing', 2, null),
    ]);

    expect(result.stats.totalMoments).toBe(1);
    expect(result.moments[0].photoIds).toEqual(['a', 'b']);
    expect(result.stats.photosWithEmbeddings).toBe(2);
    expect(result.stats.photosWithoutEmbeddings).toBe(1);
    expect(result.stats.unassignedPhotos).toBe(1);
    expect(result.moments[0].photoIds).not.toContain('missing');
    expect(result.segmentResults[0].unassignedPhotos[0]).toMatchObject({
      photoId: 'missing',
      reason: 'missing-embedding',
    });
  });

  it('handles duplicate timestamps and keeps every photo', () => {
    const result = detect([
      makePhoto('d1', 10, vectorA),
      makePhoto('d2', 10, vectorA2),
      makePhoto('d3', 10, vectorA),
    ]);

    expect(result.stats.totalMoments).toBe(1);
    expect(result.moments[0].photoIds).toEqual(['d1', 'd2', 'd3']);
    expect(result.stats.unassignedPhotos).toBe(0);
  });

  it('supports a segment containing only one photo as a singleton Moment', () => {
    const result = detect([makePhoto('solo', 0, vectorA)]);

    expect(result.stats.totalMoments).toBe(1);
    expect(result.stats.singletonMoments).toBe(1);
    expect(result.moments[0].photoIds).toEqual(['solo']);
  });

  it('routes clusters below the minimum size to unassigned photos', () => {
    const result = detect([
      makePhoto('a1', 0, vectorA),
      makePhoto('a2', 1, vectorA2),
      makePhoto('b1', 2, vectorB),
    ], { minMomentSize: 2 });

    expect(result.stats.totalMoments).toBe(1);
    expect(result.moments[0].photoIds).toEqual(['a1', 'a2']);
    expect(result.stats.unassignedPhotos).toBe(1);
    expect(result.segmentResults[0].unassignedPhotos[0]).toMatchObject({
      photoId: 'b1',
      reason: 'below-minimum-size',
    });
  });

  it('builds statistics from the current configuration and never mutates photos', () => {
    const photos = [
      makePhoto('a', 0, vectorA),
      makePhoto('b', 1, vectorA2),
      makePhoto('c', 2, vectorB),
    ];
    const snapshot = JSON.parse(JSON.stringify(photos));
    const result = detect(photos);

    expect(photos).toEqual(snapshot);
    expect(result.stats.totalPhotosInSegments).toBe(3);
    expect(result.stats.photosInMoments).toBe(3);
    expect(result.stats.averagePhotosPerMoment).toBeCloseTo(1.5, 6);
    expect(result.stats.largestMoment.photoCount).toBe(2);
    expect(result.stats.smallestMoment.photoCount).toBe(1);
    expect(result.stats.singletonMoments).toBe(1);
    expect(result.stats.segmentsWithoutMoments).toBe(0);
  });

  it('reports temporal segments that produced no Moments', () => {
    const photos = [
      makePhoto('a', 0, null),
      makePhoto('b', 1, null),
    ];
    const result = detect(photos);

    expect(result.stats.totalMoments).toBe(0);
    expect(result.stats.segmentsWithoutMoments).toBe(1);
    expect(result.stats.unassignedPhotos).toBe(2);
  });

  it('reuses cached per-segment results unless forced', () => {
    const segmentation = segmentResult([
      makePhoto('a', 0, vectorA),
      makePhoto('b', 1, vectorA2),
    ]);
    const first = runMomentDetection(segmentation, DEFAULT_MOMENT_CONFIG);
    const cached = runMomentDetection(segmentation, DEFAULT_MOMENT_CONFIG);
    const forced = runMomentDetection(segmentation, DEFAULT_MOMENT_CONFIG, { force: true });

    expect(cached.segmentResults[0]).toBe(first.segmentResults[0]);
    expect(forced.segmentResults[0]).not.toBe(first.segmentResults[0]);
    expect(forced.moments[0].photoIds).toEqual(first.moments[0].photoIds);
  });

  it('clamps invalid configuration values', () => {
    const config = normalizeMomentConfig({
      visualSensitivity: 42,
      temporalSensitivity: -3,
      minMomentSize: 0,
      maxGapMinutes: NaN,
      representativeCount: 0,
    });

    expect(config.visualSensitivity).toBe(1);
    expect(config.temporalSensitivity).toBe(0);
    expect(config.minMomentSize).toBe(1);
    expect(config.maxGapMinutes).toBe(DEFAULT_MOMENT_CONFIG.maxGapMinutes);
    expect(config.representativeCount).toBe(1);
  });

  it('returns a disabled result without processing when detection is off', () => {
    const segmentation = segmentResult([
      makePhoto('a', 0, vectorA),
      makePhoto('b', 1, vectorA2),
    ]);
    const result = runMomentDetection(segmentation, {
      ...DEFAULT_MOMENT_CONFIG,
      enabled: false,
    });

    expect(result.enabled).toBe(false);
    expect(result.stats.totalMoments).toBe(0);
    expect(result.segmentResults).toHaveLength(0);
  });

  it('async runner produces the same grouping as the synchronous engine', async () => {
    const segmentation = segmentResult([
      makePhoto('a1', 0, vectorA),
      makePhoto('a2', 1, vectorA2),
      makePhoto('b1', 2, vectorB),
      makePhoto('b2', 3, vectorB2),
    ]);
    const sync = runMomentDetection(segmentation, DEFAULT_MOMENT_CONFIG, { force: true });
    clearMomentCache();
    const asyncResult = await runMomentDetectionAsync(
      segmentation,
      DEFAULT_MOMENT_CONFIG,
      { force: true, yieldEvery: 1 },
    );

    expect(asyncResult.moments.map((moment) => moment.photoIds))
      .toEqual(sync.moments.map((moment) => moment.photoIds));
  });
});

describe('representative sampler', () => {
  it('is deterministic and prefers visually diverse photos', () => {
    const entries = [
      { photoId: 'a1', timestamp: 1, vector: vectorA, photo: { photoId: 'a1' } },
      { photoId: 'a2', timestamp: 2, vector: vectorA2, photo: { photoId: 'a2' } },
      { photoId: 'a3', timestamp: 3, vector: vectorA, photo: { photoId: 'a3' } },
      { photoId: 'b1', timestamp: 4, vector: vectorB, photo: { photoId: 'b1' } },
    ];

    const first = sampleRepresentativePhotos(entries, { count: 3 });
    const second = sampleRepresentativePhotos(entries, { count: 3 });

    expect(first.map((photo) => photo.photoId)).toEqual(second.map((photo) => photo.photoId));
    expect(first).toHaveLength(3);
    expect(first.map((photo) => photo.photoId)).toContain('b1');
    expect(first.map((photo) => photo.photoId)).not.toEqual(['a1', 'a2', 'a3']);
  });
});
