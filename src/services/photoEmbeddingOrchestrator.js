/**
 * Photo Embedding Orchestrator
 *
 * Coordinates embedding generation and persistence across photos:
 * - Filtering and slicing candidate photos per developer selection
 * - Rate-limited sequential execution with progress updates and cancellation
 * - Persistence via Firestore boundary
 * - Local in-memory result aggregation for immediate UI responsiveness
 */

import {
  fetchImageAsBase64,
  generateGeminiEmbedding,
  generateSyntheticEmbedding,
  DEFAULT_EMBEDDING_MODEL,
  DEFAULT_OUTPUT_DIMENSION,
} from './geminiEmbeddingService';
import { savePhotoEmbeddingToFirestore } from '../firebase/functions/photo-firestore';
import { resolvePhotoEmbedding } from '../features/TimelineGallery/moments/embeddingResolver';
import { photoIdentity } from '../features/TimelineGallery/segmentation/timestampUtils';

/**
 * Filter and select candidate photos based on user constraints.
 *
 * @param {Array<Object>} photos
 * @param {Object} options
 * @param {number} [options.limit=10]
 * @param {boolean} [options.onlyMissing=true]
 * @param {Array<string>} [options.allowedPhotoIds]
 * @returns {Array<Object>}
 */
export const selectPhotosForEmbedding = (
  photos = [],
  { limit = 10, onlyMissing = true, allowedPhotoIds = null } = {}
) => {
  let candidates = photos;

  if (Array.isArray(allowedPhotoIds) && allowedPhotoIds.length > 0) {
    const idSet = new Set(allowedPhotoIds);
    candidates = candidates.filter((p) => idSet.has(photoIdentity(p)));
  }

  if (onlyMissing) {
    candidates = candidates.filter((p) => {
      const { vector } = resolvePhotoEmbedding(p);
      return !vector;
    });
  }

  const count = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 10;
  return candidates.slice(0, count);
};

/**
 * Runs embedding generation on a chosen subset of photos.
 *
 * @param {Object} options
 * @param {Array<Object>} options.photos - Full photo list or pre-selected list
 * @param {number} options.photoCount - User-defined count to embed
 * @param {boolean} [options.onlyMissing=true] - Only embed photos lacking vectors
 * @param {Array<string>} [options.allowedPhotoIds] - Constrain to specific photo IDs (e.g., a segment)
 * @param {string} options.domain - Studio domain
 * @param {string} options.projectId - Project ID
 * @param {string} [options.collectionId] - Collection ID
 * @param {string} [options.apiKey] - Gemini API Key
 * @param {string} [options.model=DEFAULT_EMBEDDING_MODEL] - Model ID
 * @param {number} [options.dimension=DEFAULT_OUTPUT_DIMENSION] - Target vector dimension
 * @param {boolean} [options.useSynthetic=false] - Offline/test mock mode
 * @param {number} [options.pacingMs=400] - Delay between API calls to honor rate limits
 * @param {AbortSignal} [options.signal] - Abort controller signal
 * @param {Function} [options.onProgress] - Callback ({ current, total, photo, status, error })
 * @returns {Promise<{ successful: Array<Object>, failed: Array<Object>, updatedMap: Object, durationMs: number }>}
 */
export const runPhotoEmbeddingBatch = async ({
  photos = [],
  photoCount = 10,
  onlyMissing = true,
  allowedPhotoIds = null,
  domain,
  projectId,
  collectionId = null,
  apiKey = '',
  model = DEFAULT_EMBEDDING_MODEL,
  dimension = DEFAULT_OUTPUT_DIMENSION,
  useSynthetic = false,
  pacingMs = 300,
  signal = null,
  onProgress = null,
}) => {
  const startTime = Date.now();
  const selectedPhotos = selectPhotosForEmbedding(photos, {
    limit: photoCount,
    onlyMissing,
    allowedPhotoIds,
  });

  const total = selectedPhotos.length;
  const successful = [];
  const failed = [];
  const updatedMap = {};

  if (total === 0) {
    return {
      successful,
      failed,
      updatedMap,
      durationMs: 0,
    };
  }

  for (let i = 0; i < total; i += 1) {
    if (signal?.aborted) {
      break;
    }

    const photo = selectedPhotos[i];
    const photoId = photoIdentity(photo);
    const photoName = photo.name || photoId;

    onProgress?.({
      current: i + 1,
      total,
      photo,
      photoId,
      photoName,
      status: 'generating',
      percent: Math.round(((i) / total) * 100),
    });

    try {
      let vector = null;

      if (useSynthetic) {
        // Deterministic synthetic vector derived from photo identity and timestamp
        const seed = `${photoId}_${photoName}_${photo.dateTimeOriginal || photo.lastModified || '0'}`;
        vector = generateSyntheticEmbedding(seed, dimension);
      } else {
        const imageUrl = photo.urls?.thumb || photo.thumbUrl || photo.urls?.web || photo.url;
        if (!imageUrl) {
          throw new Error('Photo has no available thumbnail or image URL.');
        }

        const { base64, mimeType } = await fetchImageAsBase64(imageUrl);
        const result = await generateGeminiEmbedding({
          imageBase64: base64,
          mimeType,
          apiKey,
          model,
          outputDimensionality: dimension,
          signal,
        });

        vector = result.vector;
      }

      // Persist in Firestore
      let savedPayload = null;
      if (domain && projectId) {
        try {
          savedPayload = await savePhotoEmbeddingToFirestore(
            domain,
            projectId,
            photoId,
            vector,
            { model, dimension, useSynthetic },
            collectionId
          );
        } catch (dbErr) {
          console.warn(`Firestore persistence warning for ${photoId}:`, dbErr.message);
        }
      }

      const updateData = {
        embedding: vector,
        embeddings: savedPayload?.embeddings || {
          geminiEmbedding2: {
            vector,
            model,
            dimension: vector.length,
            updatedAt: new Date().toISOString(),
          },
        },
        updatedAt: savedPayload?.updatedAt || Date.now(),
      };

      updatedMap[photoId] = updateData;
      successful.push({
        photoId,
        photoName,
        dimension: vector.length,
      });

      onProgress?.({
        current: i + 1,
        total,
        photo,
        photoId,
        photoName,
        status: 'saved',
        percent: Math.round(((i + 1) / total) * 100),
      });
    } catch (err) {
      if (signal?.aborted) break;

      failed.push({
        photoId,
        photoName,
        error: err.message,
      });

      onProgress?.({
        current: i + 1,
        total,
        photo,
        photoId,
        photoName,
        status: 'error',
        error: err.message,
        percent: Math.round(((i + 1) / total) * 100),
      });
    }

    // Pacing delay to avoid burst rate-limits (unless stopped or synthetic or last photo)
    if (!signal?.aborted && !useSynthetic && pacingMs > 0 && i < total - 1) {
      await new Promise((resolve) => {
        const timer = setTimeout(resolve, pacingMs);
        if (signal) {
          signal.addEventListener('abort', () => clearTimeout(timer), { once: true });
        }
      });
    }
  }

  const durationMs = Date.now() - startTime;
  return {
    successful,
    failed,
    updatedMap,
    durationMs,
  };
};
