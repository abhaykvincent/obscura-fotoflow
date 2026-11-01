/**
 * Temporal segmentation engine.
 *
 * Pure, React-free module: photos + timestamp normalization + algorithm
 * configuration -> temporal segments.
 *
 * The engine never mutates or rewrites photo records. Every segment carries the
 * original photo IDs plus references to the original photo objects (the same
 * objects supplied by the gallery), so callers can inspect a segment without
 * losing the link back to the source data.
 */

import {
  photoIdentity,
  resolveCaptureTimestamp,
} from './timestampUtils';
import { segmentByTimeGap } from './timeGapSegmenter';
import { segmentByPelt } from './peltSegmenter';

export const SEGMENTATION_ALGORITHMS = {
  TIME_GAP: 'time-gap',
  PELT: 'pelt',
};

export const DEFAULT_SEGMENTATION_CONFIG = {
  algorithm: SEGMENTATION_ALGORITHMS.TIME_GAP,
  timeGapMinutes: 30,
  peltPenalty: 0.5,
  peltMinSegmentSize: 3,
};

const normalizeConfig = (config = {}) => {
  const algorithm = config.algorithm === SEGMENTATION_ALGORITHMS.PELT
    ? SEGMENTATION_ALGORITHMS.PELT
    : SEGMENTATION_ALGORITHMS.TIME_GAP;

  return {
    algorithm,
    timeGapMinutes: Number.isFinite(Number(config.timeGapMinutes))
      ? Math.max(0, Number(config.timeGapMinutes))
      : DEFAULT_SEGMENTATION_CONFIG.timeGapMinutes,
    peltPenalty: Number.isFinite(Number(config.peltPenalty))
      ? Math.max(0, Number(config.peltPenalty))
      : DEFAULT_SEGMENTATION_CONFIG.peltPenalty,
    peltMinSegmentSize: Number.isFinite(Number(config.peltMinSegmentSize))
      ? Math.max(1, Math.floor(Number(config.peltMinSegmentSize)))
      : DEFAULT_SEGMENTATION_CONFIG.peltMinSegmentSize,
  };
};

/**
 * Normalize and chronologically sort photos.
 *
 * Tie handling: identical timestamps (duplicate/zero-second captures, multiple
 * cameras) are kept, never deduped. A stable tie-break on the original gallery
 * index preserves the existing gallery order for equal timestamps.
 */
export const preparePhotosForSegmentation = (photos = []) => {
  const validPhotos = [];
  const invalidPhotos = [];

  photos.forEach((photo, originalIndex) => {
    const resolved = resolveCaptureTimestamp(photo);
    if (!resolved) {
      invalidPhotos.push(photo);
      return;
    }
    validPhotos.push({
      photo,
      photoId: photoIdentity(photo),
      timestamp: resolved.timestamp,
      timestampSource: resolved.source,
      originalIndex,
    });
  });

  validPhotos.sort((a, b) => {
    if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp;
    if (a.originalIndex !== b.originalIndex) return a.originalIndex - b.originalIndex;
    return String(a.photoId).localeCompare(String(b.photoId));
  });

  return { validPhotos, invalidPhotos };
};

const runAlgorithm = (sortedEntries, config) => {
  if (config.algorithm === SEGMENTATION_ALGORITHMS.PELT) {
    return segmentByPelt(sortedEntries, {
      penalty: config.peltPenalty,
      minSegmentSize: config.peltMinSegmentSize,
    });
  }

  return segmentByTimeGap(sortedEntries, {
    thresholdMinutes: config.timeGapMinutes,
  });
};

const decorateSegments = (groups) => {
  let previousEnd = null;

  return groups.map((entries, index) => {
    const startTime = entries[0].timestamp;
    const endTime = entries[entries.length - 1].timestamp;
    const gapFromPreviousMs = previousEnd === null ? null : Math.max(0, startTime - previousEnd);

    const segment = {
      id: `temporal-segment-${index + 1}`,
      index: index + 1,
      photoIds: entries.map((entry) => entry.photoId),
      photos: entries.map((entry) => entry.photo),
      photoCount: entries.length,
      startTime,
      endTime,
      durationMs: Math.max(0, endTime - startTime),
      gapFromPreviousMs,
    };

    previousEnd = endTime;
    return segment;
  });
};

const computeLargestGap = (sortedEntries) => {
  let largest = 0;
  let atPhotoIndex = -1;

  for (let i = 1; i < sortedEntries.length; i += 1) {
    const gap = sortedEntries[i].timestamp - sortedEntries[i - 1].timestamp;
    if (gap > largest) {
      largest = gap;
      atPhotoIndex = i;
    }
  }

  return { largestGapMs: largest, atPhotoIndex };
};

const buildStats = ({ allPhotos, sortedEntries, invalidPhotos, segments, largestGap }) => {
  const segmentSizes = segments.map((segment) => segment.photoCount);
  const largestSegment = segments.reduce((best, segment) => (
    !best || segment.photoCount > best.photoCount ? segment : best
  ), null);
  const smallestSegment = segments.reduce((best, segment) => (
    !best || segment.photoCount < best.photoCount ? segment : best
  ), null);

  const averagePhotosPerSegment = segments.length > 0
    ? sortedEntries.length / segments.length
    : 0;

  return {
    totalPhotos: allPhotos.length,
    validPhotos: sortedEntries.length,
    excludedPhotos: invalidPhotos.length,
    segmentCount: segments.length,
    averagePhotosPerSegment,
    largestSegment: largestSegment
      ? { index: largestSegment.index, photoCount: largestSegment.photoCount }
      : null,
    smallestSegment: smallestSegment
      ? { index: smallestSegment.index, photoCount: smallestSegment.photoCount }
      : null,
    largestGapMs: largestGap.largestGapMs,
    largestGapAfterPhotoIndex: largestGap.atPhotoIndex,
    totalSpanMs: sortedEntries.length > 0
      ? sortedEntries[sortedEntries.length - 1].timestamp - sortedEntries[0].timestamp
      : 0,
    segmentSizes,
  };
};

/**
 * Main entry point.
 *
 * @param {Object[]} photos - Existing gallery photo objects.
 * @param {Object} config - Algorithm configuration.
 * @returns {{
 *   config: Object,
 *   algorithm: string,
 *   segments: Object[],
 *   sortedPhotos: Object[],
 *   invalidPhotos: Object[],
 *   stats: Object,
 * }}
 */
export const runTemporalSegmentation = (photos = [], config = {}) => {
  const resolvedConfig = normalizeConfig(config);
  const { validPhotos, invalidPhotos } = preparePhotosForSegmentation(photos);
  const groups = runAlgorithm(validPhotos, resolvedConfig);
  const segments = decorateSegments(groups);
  const largestGap = computeLargestGap(validPhotos);

  return {
    config: resolvedConfig,
    algorithm: resolvedConfig.algorithm,
    segments,
    sortedPhotos: validPhotos.map((entry) => entry.photo),
    validEntries: validPhotos,
    invalidPhotos,
    stats: buildStats({
      allPhotos: photos,
      sortedEntries: validPhotos,
      invalidPhotos,
      segments,
      largestGap,
    }),
  };
};
