/**
 * Semantic Photo Search Service
 *
 * Enables natural language search across photos using Gemini Embedding 2 vectors.
 * Because gemini-embedding-2 is multimodal, query text vectors and photo image vectors
 * reside in the same shared vector space. Photos are ranked by cosine similarity.
 */

import {
  generateTextGeminiEmbedding,
  generateSyntheticEmbedding,
  DEFAULT_EMBEDDING_MODEL,
  DEFAULT_OUTPUT_DIMENSION,
} from './geminiEmbeddingService';
import { resolvePhotoEmbedding } from '../features/TimelineGallery/moments/embeddingResolver';
import { photoIdentity } from '../features/TimelineGallery/segmentation/timestampUtils';

/**
 * Computes cosine similarity between two numeric vectors.
 * Returns value in range [-1, 1], where 1 is identical orientation.
 *
 * @param {Array<number>} a
 * @param {Array<number>} b
 * @returns {number}
 */
export const cosineSimilarity = (a, b) => {
  if (!a || !b || a.length !== b.length || a.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i += 1) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator <= 0) return 0;

  return dotProduct / denominator;
};

/**
 * Executes a semantic search across photos given a natural language query.
 *
 * @param {Object} options
 * @param {Array<Object>} options.photos - Photos to search through
 * @param {string} options.query - Natural language query (e.g. "bride smiling", "wedding cake")
 * @param {string} [options.apiKey] - Gemini API Key
 * @param {string} [options.model=DEFAULT_EMBEDDING_MODEL] - Model ID
 * @param {number} [options.dimension=DEFAULT_OUTPUT_DIMENSION] - Output dimension
 * @param {number} [options.minSimilarity=0.35] - Minimum cosine similarity threshold (0 - 1)
 * @param {number} [options.maxResults=50] - Maximum matching photos to return
 * @param {boolean} [options.useSynthetic=false] - Offline/test mock mode
 * @param {AbortSignal} [options.signal] - Abort controller signal
 * @returns {Promise<{
 *   query: string,
 *   matches: Array<{ photo: Object, photoId: string, similarity: number, scorePercent: number }>,
 *   totalSearched: number,
 *   totalWithEmbeddings: number,
 *   totalWithoutEmbeddings: number,
 *   durationMs: number
 * }>}
 */
export const searchPhotosBySemanticQuery = async ({
  photos = [],
  query = '',
  apiKey = '',
  model = DEFAULT_EMBEDDING_MODEL,
  dimension = DEFAULT_OUTPUT_DIMENSION,
  minSimilarity = 0.35,
  maxResults = 50,
  useSynthetic = false,
  signal = null,
}) => {
  const startTime = Date.now();
  const trimmedQuery = (query || '').trim();

  if (!trimmedQuery) {
    return {
      query: '',
      matches: [],
      totalSearched: photos.length,
      totalWithEmbeddings: 0,
      totalWithoutEmbeddings: 0,
      durationMs: 0,
    };
  }

  // 1. Generate text embedding vector for query
  let queryVector = null;
  if (useSynthetic) {
    queryVector = generateSyntheticEmbedding(`query:${trimmedQuery}`, dimension);
  } else {
    const embeddingResponse = await generateTextGeminiEmbedding({
      text: trimmedQuery,
      apiKey,
      model,
      outputDimensionality: dimension,
      signal,
    });
    queryVector = embeddingResponse.vector;
  }

  if (signal?.aborted) {
    throw new Error('Semantic search aborted.');
  }

  // 2. Score photos against the query vector
  const scored = [];
  let totalWithEmbeddings = 0;
  let totalWithoutEmbeddings = 0;

  for (let i = 0; i < photos.length; i += 1) {
    const photo = photos[i];
    const { vector } = resolvePhotoEmbedding(photo);

    if (!vector) {
      totalWithoutEmbeddings += 1;
      continue;
    }

    totalWithEmbeddings += 1;

    // Vector dimension check
    if (vector.length !== queryVector.length) {
      continue;
    }

    const similarity = cosineSimilarity(queryVector, vector);
    if (similarity >= minSimilarity) {
      scored.push({
        photo,
        photoId: photoIdentity(photo),
        similarity,
        scorePercent: Math.round(similarity * 100),
      });
    }
  }

  // 3. Rank matches in descending order of similarity
  scored.sort((a, b) => b.similarity - a.similarity);

  const matches = Number.isFinite(maxResults) && maxResults > 0
    ? scored.slice(0, maxResults)
    : scored;

  const durationMs = Date.now() - startTime;

  return {
    query: trimmedQuery,
    matches,
    totalSearched: photos.length,
    totalWithEmbeddings,
    totalWithoutEmbeddings,
    durationMs,
  };
};
