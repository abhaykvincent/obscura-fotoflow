/**
 * Visual distance utilities (React-free).
 *
 * Cosine similarity is the primary signal. Vectors are normalized once and a
 * bounded pair cache avoids recomputing distances for the same cluster pair
 * during agglomerative merges. Cosine distance is used consistently
 * (distance = 1 - similarity), never mixed with Euclidean distance.
 */

const EPSILON = 1e-12;

export const normalizeVector = (vector) => {
  if (!Array.isArray(vector) || vector.length === 0) return null;

  let sumSquares = 0;
  for (let i = 0; i < vector.length; i += 1) {
    const value = Number(vector[i]);
    if (!Number.isFinite(value)) return null;
    sumSquares += value * value;
  }

  const norm = Math.sqrt(sumSquares);
  if (!Number.isFinite(norm) || norm <= EPSILON) return null;

  const normalized = new Array(vector.length);
  for (let i = 0; i < vector.length; i += 1) {
    normalized[i] = vector[i] / norm;
  }
  return normalized;
};

export const cosineSimilarity = (a, b) => {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i += 1) {
    const av = a[i];
    const bv = b[i];
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  }

  if (normA <= EPSILON || normB <= EPSILON) return 0;
  return Math.min(1, Math.max(-1, dot / (Math.sqrt(normA) * Math.sqrt(normB))));
};

export const cosineDistance = (a, b) => 1 - cosineSimilarity(a, b);

export const averageVector = (vectors = []) => {
  if (vectors.length === 0) return null;
  const dimension = vectors[0].length;
  if (!vectors.every((vector) => vector.length === dimension)) return null;

  const sum = new Array(dimension).fill(0);
  vectors.forEach((vector) => {
    for (let i = 0; i < dimension; i += 1) sum[i] += vector[i];
  });

  for (let i = 0; i < dimension; i += 1) sum[i] /= vectors.length;
  return sum;
};

/**
 * @param {Map<string, number[]>} vectorsByPhotoId - unit-normalized vectors
 * @param {{ maxCacheEntries?: number }} options
 */
export const createVisualDistanceCalculator = (vectorsByPhotoId, { maxCacheEntries = 50000 } = {}) => {
  const cache = new Map();

  const pairKey = (a, b) => (String(a) <= String(b) ? `${a}\u0000${b}` : `${b}\u0000${a}`);

  const distance = (photoIdA, photoIdB) => {
    if (photoIdA === photoIdB) return 0;

    const key = pairKey(photoIdA, photoIdB);
    if (cache.has(key)) return cache.get(key);

    const a = vectorsByPhotoId.get(photoIdA);
    const b = vectorsByPhotoId.get(photoIdB);
    if (!a || !b || a.length !== b.length) return null;

    const value = cosineDistance(a, b);

    // Simple bounded cache: drop the oldest insertion when full. The access
    // pattern is mostly local to the current merge neighbourhood.
    if (cache.size >= maxCacheEntries) {
      const oldest = cache.keys().next().value;
      cache.delete(oldest);
    }

    cache.set(key, value);
    return value;
  };

  const similarity = (photoIdA, photoIdB) => {
    const value = distance(photoIdA, photoIdB);
    return value === null ? null : 1 - value;
  };

  return {
    distance,
    similarity,
    has: (photoId) => vectorsByPhotoId.has(photoId),
    size: () => cache.size,
  };
};
