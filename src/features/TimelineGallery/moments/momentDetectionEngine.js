/**
 * Moment Detection engine (React-free).
 *
 * Pipeline:
 *   temporal segmentation result + photo embeddings + config → candidate Moments
 *
 * Contract:
 *   - Never mutates photos, embeddings, temporal segments, or Firestore state.
 *   - Operates independently inside every parent temporal segment.
 *   - Unknown number of Moments (no K-Means, no fixed k).
 *   - Missing / mismatched embeddings become explicit unassigned photos.
 *   - Every original photo ID is preserved in either a Moment or unassigned list.
 */

import { photoIdentity, resolveCaptureTimestamp } from '../segmentation/timestampUtils';
import { momentConfigKey, normalizeMomentConfig } from './momentConfig';
import { collectEmbeddings, selectCoherentEmbeddings } from './embeddingResolver';
import { averageVector, cosineSimilarity, normalizeVector } from './visualDistanceCalculator';
import { computeAdaptiveTemporalScale, computeTemporalProfile } from './temporalContinuityCalculator';
import { createMomentBoundaryDetector } from './momentBoundaryDetector';
import { clusterTemporally } from './temporalAgglomerativeClusterer';
import { sampleRepresentativePhotos } from './momentRepresentativeSampler';

const SEGMENT_CACHE_LIMIT = 80;
const segmentCache = new Map();

const UNASSIGNED_MESSAGES = {
  'missing-embedding': 'No usable Gemini Embedding 2 vector on the photo record.',
  'embedding-dimension-mismatch': 'Embedding dimension differs from the segment majority.',
  'invalid-timestamp': 'Capture timestamp is missing or invalid.',
  'below-minimum-size': 'Cluster smaller than the configured minimum Moment size.',
};

const pad2 = (value) => String(value).padStart(2, '0');

const readCameraId = (photo) => (
  photo?.cameraId
  || photo?.camera?.id
  || photo?.camera?.name
  || photo?.metadata?.cameraId
  || photo?.metadata?.cameraModel
  || photo?.exif?.Model
  || null
);

const buildSegmentKey = (segment, config) => [
  segment.id,
  segment.photoIds.join(','),
  segment.photos.map((photo) => photo?.updatedAt || '').join(','),
  segment.startTime,
  segment.endTime,
  momentConfigKey(config),
].join('|');

const buildUnassigned = (entry, reason) => ({
  photo: entry.photo,
  photoId: entry.photoId,
  timestamp: entry.timestamp,
  reason,
  message: UNASSIGNED_MESSAGES[reason] || reason,
});

const computeAvgSimilarityToCentroid = (entries) => {
  if (entries.length < 2) return null;

  const centroid = normalizeVector(averageVector(entries.map((entry) => entry.vector)));
  if (!centroid) return null;

  const total = entries.reduce(
    (sum, entry) => sum + cosineSimilarity(entry.vector, centroid),
    0,
  );
  return total / entries.length;
};

const buildMoment = ({ cluster, localIndex, segment, config }) => {
  const entries = cluster.entries;
  const startTime = entries[0].timestamp;
  const endTime = entries[entries.length - 1].timestamp;
  const cameraIds = [...new Set(entries.map((entry) => readCameraId(entry.photo)).filter(Boolean))];

  return {
    id: `moment-${segment.index}-${localIndex}`,
    label: `Moment ${pad2(localIndex)}`,
    index: localIndex,
    parentSegmentId: segment.id,
    parentSegmentIndex: segment.index,
    photoIds: entries.map((entry) => entry.photoId),
    photos: entries.map((entry) => entry.photo),
    photoCount: entries.length,
    startTime,
    endTime,
    durationMs: Math.max(0, endTime - startTime),
    avgSimilarityToCentroid: computeAvgSimilarityToCentroid(entries),
    cameraIds,
    representativePhotos: sampleRepresentativePhotos(entries, {
      count: config.representativeCount,
    }),
    embeddingCount: entries.length,
  };
};

/**
 * Detect Moments inside one temporal segment. Exported so the async runner and
 * benchmarks can process segments independently.
 */
export const detectSegmentMoments = (segment, rawConfig = {}, { force = false } = {}) => {
  const config = normalizeMomentConfig(rawConfig);
  const cacheKey = buildSegmentKey(segment, config);

  if (!force && segmentCache.has(cacheKey)) {
    return segmentCache.get(cacheKey);
  }

  const entries = segment.photos.map((photo, originalIndex) => {
    const resolved = resolveCaptureTimestamp(photo);
    return {
      photo,
      photoId: photoIdentity(photo),
      timestamp: resolved ? resolved.timestamp : Number.NaN,
      originalIndex,
    };
  });

  const unassigned = [];
  const timedEntries = [];

  entries.forEach((entry) => {
    if (!Number.isFinite(entry.timestamp)) {
      unassigned.push(buildUnassigned(entry, 'invalid-timestamp'));
    } else {
      timedEntries.push(entry);
    }
  });

  const collection = collectEmbeddings(
    timedEntries.map((entry) => entry.photo),
    photoIdentity,
  );
  const coherent = selectCoherentEmbeddings(collection.resolved);
  const vectorByPhotoId = new Map(
    coherent.coherent.map((entry) => [entry.photoId, entry.vector]),
  );
  const entryByPhotoId = new Map(timedEntries.map((entry) => [entry.photoId, entry]));

  collection.missing.forEach((missingEntry) => {
    const entry = entryByPhotoId.get(missingEntry.photoId)
      || { photo: missingEntry.photo, photoId: missingEntry.photoId, timestamp: Number.NaN };
    unassigned.push(buildUnassigned(entry, 'missing-embedding'));
  });

  coherent.rejected.forEach((rejectedEntry) => {
    const entry = entryByPhotoId.get(rejectedEntry.photoId)
      || { photo: rejectedEntry.photo, photoId: rejectedEntry.photoId, timestamp: Number.NaN };
    unassigned.push(buildUnassigned(entry, rejectedEntry.reason));
  });

  const vectorEntries = timedEntries
    .filter((entry) => vectorByPhotoId.has(entry.photoId))
    .map((entry) => ({ ...entry, vector: vectorByPhotoId.get(entry.photoId) }));

  const temporalProfile = computeTemporalProfile(timedEntries);
  const temporalScaleMs = computeAdaptiveTemporalScale(
    timedEntries,
    config.temporalSensitivity,
  );
  const detector = createMomentBoundaryDetector({ config, temporalScaleMs });
  const { clusters, diagnostics } = clusterTemporally(vectorEntries, {
    detector,
    temporalScaleMs,
  });

  const moments = [];
  clusters.forEach((cluster) => {
    if (cluster.entries.length < config.minMomentSize) {
      cluster.entries.forEach((entry) => {
        unassigned.push(buildUnassigned(entry, 'below-minimum-size'));
      });
      return;
    }

    const localIndex = moments.length + 1;
    moments.push(buildMoment({ cluster, localIndex, segment, config }));
  });

  const result = {
    segmentId: segment.id,
    segmentIndex: segment.index,
    parentPhotoCount: segment.photoCount,
    moments,
    unassignedPhotos: unassigned,
    photosWithEmbeddings: vectorEntries.length,
    photosWithoutEmbeddings: unassigned.filter((entry) => (
      entry.reason === 'missing-embedding'
      || entry.reason === 'embedding-dimension-mismatch'
    )).length,
    temporalProfile,
    temporalScaleMs,
    visualLimit: detector.visualLimit,
    diagnostics,
    config,
  };

  if (segmentCache.size >= SEGMENT_CACHE_LIMIT) {
    const oldest = segmentCache.keys().next().value;
    segmentCache.delete(oldest);
  }
  segmentCache.set(cacheKey, result);

  return result;
};

export const clearMomentCache = () => {
  segmentCache.clear();
};

const pickExtremeMoment = (moments, direction) => moments.reduce((best, moment) => {
  if (!best) return moment;
  if (direction === 'largest' && moment.photoCount > best.photoCount) return moment;
  if (direction === 'smallest' && moment.photoCount < best.photoCount) return moment;
  return best;
}, null);

const summarizeMoment = (moment) => (moment ? {
  label: moment.label,
  segmentIndex: moment.parentSegmentIndex,
  photoCount: moment.photoCount,
} : null);

const aggregate = (segmentResults, config) => {
  const moments = segmentResults.flatMap((result) => result.moments);
  const unassignedPhotos = segmentResults.reduce(
    (sum, result) => sum + result.unassignedPhotos.length,
    0,
  );
  const totalPhotosInSegments = segmentResults.reduce(
    (sum, result) => sum + result.parentPhotoCount,
    0,
  );
  const photosWithEmbeddings = segmentResults.reduce(
    (sum, result) => sum + result.photosWithEmbeddings,
    0,
  );
  const photosWithoutEmbeddings = segmentResults.reduce(
    (sum, result) => sum + result.photosWithoutEmbeddings,
    0,
  );
  const photosInMoments = moments.reduce((sum, moment) => sum + moment.photoCount, 0);

  const stats = {
    totalPhotosInSegments,
    photosWithEmbeddings,
    photosWithoutEmbeddings,
    photosInMoments,
    totalMoments: moments.length,
    averagePhotosPerMoment: moments.length > 0 ? photosInMoments / moments.length : 0,
    largestMoment: summarizeMoment(pickExtremeMoment(moments, 'largest')),
    smallestMoment: summarizeMoment(pickExtremeMoment(moments, 'smallest')),
    singletonMoments: moments.filter((moment) => moment.photoCount === 1).length,
    unassignedPhotos,
    segmentsWithoutMoments: segmentResults.filter((result) => result.moments.length === 0).length,
  };

  return {
    config,
    segmentResults,
    momentsBySegmentId: new Map(
      segmentResults.map((result) => [result.segmentId, result]),
    ),
    moments,
    stats,
  };
};

/**
 * Synchronous entry point.
 *
 * @param {Object|null} segmentationResult - output of runTemporalSegmentation
 * @param {Object} config - moment configuration
 * @param {{ force?: boolean }} options
 */
export const runMomentDetection = (segmentationResult, config = {}, { force = false } = {}) => {
  const resolvedConfig = normalizeMomentConfig(config);

  if (!segmentationResult || !Array.isArray(segmentationResult.segments)) {
    return aggregate([], resolvedConfig);
  }

  if (!resolvedConfig.enabled) {
    return {
      ...aggregate([], resolvedConfig),
      enabled: false,
    };
  }

  const segmentResults = segmentationResult.segments.map((segment) => (
    detectSegmentMoments(segment, resolvedConfig, { force })
  ));

  return {
    ...aggregate(segmentResults, resolvedConfig),
    enabled: true,
  };
};

const yieldToEventLoop = () => new Promise((resolve) => {
  setTimeout(resolve, 0);
});

/**
 * Async wrapper for large shoots. Yields between groups of segments so the
 * developer UI can paint progress; the clustering algorithm itself remains
 * synchronous and pure.
 */
export const runMomentDetectionAsync = async (
  segmentationResult,
  config = {},
  { force = false, signal, onProgress, yieldEvery = 6 } = {},
) => {
  const resolvedConfig = normalizeMomentConfig(config);

  if (!segmentationResult || !Array.isArray(segmentationResult.segments)) {
    return aggregate([], resolvedConfig);
  }

  if (!resolvedConfig.enabled) {
    return { ...aggregate([], resolvedConfig), enabled: false };
  }

  const segments = segmentationResult.segments;
  const segmentResults = [];

  for (let index = 0; index < segments.length; index += 1) {
    if (signal?.aborted) {
      const error = new Error('Moment detection cancelled');
      error.name = 'AbortError';
      throw error;
    }

    segmentResults.push(detectSegmentMoments(segments[index], resolvedConfig, { force }));

    if (onProgress) {
      onProgress({ completed: index + 1, total: segments.length });
    }

    if ((index + 1) % yieldEvery === 0 && index + 1 < segments.length) {
      await yieldToEventLoop();
    }
  }

  return {
    ...aggregate(segmentResults, resolvedConfig),
    enabled: true,
  };
};

export { UNASSIGNED_MESSAGES };
