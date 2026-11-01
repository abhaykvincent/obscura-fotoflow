import {
  runTemporalSegmentation,
  preparePhotosForSegmentation,
  SEGMENTATION_ALGORITHMS,
  DEFAULT_SEGMENTATION_CONFIG,
} from './temporalSegmentation';
import { peltChangePoints } from './peltSegmenter';

const MINUTE = 60 * 1000;

const makePhoto = (id, iso) => ({
  photoId: id,
  id,
  name: `${id}.jpg`,
  url: `https://example.test/${id}.jpg`,
  dateTimeOriginal: iso,
});

const isoAt = (base, minutes) => new Date(base + minutes * MINUTE).toISOString();

describe('temporal segmentation', () => {
  const base = Date.UTC(2026, 0, 1, 9, 0, 0);

  it('sorts chronologically and preserves original photo IDs', () => {
    const photos = [
      makePhoto('c', isoAt(base, 60)),
      makePhoto('a', isoAt(base, 0)),
      makePhoto('b', isoAt(base, 5)),
    ];

    const result = runTemporalSegmentation(photos, {
      ...DEFAULT_SEGMENTATION_CONFIG,
      timeGapMinutes: 30,
    });

    expect(result.segments).toHaveLength(2);
    expect(result.segments[0].photoIds).toEqual(['a', 'b']);
    expect(result.segments[1].photoIds).toEqual(['c']);
    expect(result.sortedPhotos.map((p) => p.photoId)).toEqual(['a', 'b', 'c']);
    expect(result.stats.validPhotos).toBe(3);
    expect(result.stats.excludedPhotos).toBe(0);
  });

  it('splits on a configurable time gap threshold', () => {
    const photos = [
      makePhoto('a', isoAt(base, 0)),
      makePhoto('b', isoAt(base, 10)),
      makePhoto('c', isoAt(base, 70)),
      makePhoto('d', isoAt(base, 75)),
    ];

    const tight = runTemporalSegmentation(photos, {
      algorithm: SEGMENTATION_ALGORITHMS.TIME_GAP,
      timeGapMinutes: 4,
    });
    const loose = runTemporalSegmentation(photos, {
      algorithm: SEGMENTATION_ALGORITHMS.TIME_GAP,
      timeGapMinutes: 120,
    });

    expect(tight.segments.map((s) => s.photoIds)).toEqual([['a'], ['b'], ['c'], ['d']]);
    expect(loose.segments).toHaveLength(1);
  });

  it('excludes missing and invalid timestamps without discarding the photos', () => {
    const photos = [
      makePhoto('valid', isoAt(base, 0)),
      { photoId: 'missing', url: 'x' },
      { photoId: 'invalid', dateTimeOriginal: 'not-a-date' },
      { photoId: 'empty', dateTimeOriginal: '' },
    ];

    const result = runTemporalSegmentation(photos);

    expect(result.stats.totalPhotos).toBe(4);
    expect(result.stats.validPhotos).toBe(1);
    expect(result.stats.excludedPhotos).toBe(3);
    expect(result.invalidPhotos.map((p) => p.photoId)).toEqual(['missing', 'invalid', 'empty']);
    expect(result.segments[0].photoIds).toEqual(['valid']);
  });

  it('keeps duplicate timestamps and uses a stable tie-break', () => {
    const photos = [
      makePhoto('first', isoAt(base, 5)),
      makePhoto('second', isoAt(base, 5)),
      makePhoto('third', isoAt(base, 5)),
    ];

    const { validPhotos } = preparePhotosForSegmentation(photos);
    expect(validPhotos.map((entry) => entry.photoId)).toEqual(['first', 'second', 'third']);

    const result = runTemporalSegmentation(photos);
    expect(result.segments).toHaveLength(1);
    expect(result.segments[0].photoIds).toEqual(['first', 'second', 'third']);
    expect(result.segments[0].durationMs).toBe(0);
  });

  it('reports largest / smallest segment and largest gap', () => {
    const photos = [
      makePhoto('a', isoAt(base, 0)),
      makePhoto('b', isoAt(base, 1)),
      makePhoto('c', isoAt(base, 2)),
      makePhoto('d', isoAt(base, 120)),
    ];

    const result = runTemporalSegmentation(photos, {
      timeGapMinutes: 30,
    });

    expect(result.stats.segmentCount).toBe(2);
    expect(result.stats.largestSegment).toEqual({ index: 1, photoCount: 3 });
    expect(result.stats.smallestSegment).toEqual({ index: 2, photoCount: 1 });
    expect(result.stats.largestGapMs).toBe(118 * MINUTE);
  });

  it('detects a rhythm change with PELT', () => {
    // 30 photos one minute apart, then 30 photos an hour apart.
    const photos = [];
    for (let i = 0; i < 30; i += 1) photos.push(makePhoto(`a${i}`, isoAt(base, i)));
    const secondBase = base + 29 * MINUTE;
    for (let i = 0; i < 30; i += 1) photos.push(makePhoto(`b${i}`, isoAt(secondBase, i * 60)));

    const result = runTemporalSegmentation(photos, {
      algorithm: SEGMENTATION_ALGORITHMS.PELT,
      peltPenalty: 0.5,
    });

    expect(result.segments.length).toBeGreaterThanOrEqual(2);

    const changeNearJoint = result.segments.some(
      (segment) => segment.index > 1 && segment.startTime >= secondBase,
    );
    expect(changeNearJoint).toBe(true);
  });

  it('PELT returns no change points for a perfectly regular series', () => {
    const series = new Array(50).fill(Math.log1p(5));
    expect(peltChangePoints(series, { penalty: 0.5 })).toEqual([]);
  });
});
