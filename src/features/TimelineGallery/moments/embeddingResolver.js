/**
 * Embedding resolution for Moment Detection.
 *
 * Inspected schema note (read-only):
 *   The canonical Project Photo document currently stores id/name/timestamps/
 *   urls/storage/dimensions only. There is no embedding field and no embedding
 *   collection in this repository or its Firestore emulator exports at the time
 *   of writing. Gemini Embedding 2 vectors are therefore *optional*.
 *
 * This module resolves vectors defensively from any of the shapes used by
 * embedding pipelines that have been discussed for FotoFlow. It never creates
 * an embedding, never writes one back, and never replaces a missing vector with
 * a zero vector. Photos without a usable vector are reported as missing so the
 * UI can explain why they could not participate in visual clustering.
 */

export const EMBEDDING_FIELD_PATHS = [
  'embedding',
  'embeddingVector',
  'geminiEmbedding',
  'geminiEmbedding2',
  'embeddings.gemini',
  'embeddings.geminiEmbedding2',
  'embeddings.vector',
  'visualEmbedding',
  'ai.embedding',
  'photoIntelligence.embedding',
];

const MIN_VECTOR_DIMENSION = 8;

const readPath = (source, path) => path
  .split('.')
  .reduce((value, key) => (value === null || value === undefined ? undefined : value[key]), source);

const toNumericArray = (value) => {
  if (!value) return null;

  // Firestore VectorValue exposes toArray().
  if (typeof value.toArray === 'function') {
    try {
      return toNumericArray(value.toArray());
    } catch {
      return null;
    }
  }

  if (ArrayBuffer.isView(value)) {
    return Array.from(value);
  }

  if (Array.isArray(value)) return value;

  // Some providers wrap the vector: { values: [...] } / { vector: [...] }.
  if (Array.isArray(value.values)) return value.values;
  if (Array.isArray(value.vector)) return value.vector;
  if (Array.isArray(value.data)) return value.data;

  return null;
};

/**
 * Validates a raw embedding value.
 * @returns {number[]|null} finite, non-zero vector
 */
export const normalizeEmbeddingVector = (value) => {
  const array = toNumericArray(value);
  if (!array || array.length < MIN_VECTOR_DIMENSION) return null;

  const vector = new Array(array.length);
  let sumSquares = 0;

  for (let i = 0; i < array.length; i += 1) {
    const number = Number(array[i]);
    if (!Number.isFinite(number)) return null;
    vector[i] = number;
    sumSquares += number * number;
  }

  // A zero vector carries no visual information; treating it as a valid
  // embedding would silently merge unrelated photos.
  if (sumSquares <= 0) return null;

  return vector;
};

export const resolvePhotoEmbedding = (photo) => {
  if (!photo) return { vector: null, source: null, dimension: 0 };

  for (const path of EMBEDDING_FIELD_PATHS) {
    const raw = readPath(photo, path);
    if (raw === undefined || raw === null) continue;

    const vector = normalizeEmbeddingVector(raw);
    if (vector) {
      return { vector, source: path, dimension: vector.length };
    }
  }

  return { vector: null, source: null, dimension: 0 };
};

/**
 * Resolve embeddings for a photo list.
 *
 * The canonical gallery read (`fetchImages`) already returns the full Project
 * Photo document, so any embedding stored on that document arrives with the
 * photo. This function therefore performs no extra Firestore reads and can be
 * used for thousands of photos without a second download pass.
 *
 * @returns {{
 *   resolved: Array<{ photo: Object, photoId: string, vector: number[], source: string, dimension: number }>,
 *   missing: Array<{ photo: Object, photoId: string, reason: string }>,
 *   dimensions: number[],
 * }}
 */
export const collectEmbeddings = (photos = [], identify) => {
  const resolved = [];
  const missing = [];
  const dimensions = new Set();

  photos.forEach((photo) => {
    const photoId = identify ? identify(photo) : (photo?.photoId || photo?.id || '');
    const embedding = resolvePhotoEmbedding(photo);

    if (!embedding.vector) {
      missing.push({ photo, photoId, reason: 'missing-embedding' });
      return;
    }

    resolved.push({
      photo,
      photoId,
      vector: embedding.vector,
      source: embedding.source,
      dimension: embedding.dimension,
    });
    dimensions.add(embedding.dimension);
  });

  return {
    resolved,
    missing,
    dimensions: [...dimensions].sort((a, b) => a - b),
  };
};

/**
 * Dimension guard for a segment. Comparing vectors of different dimensions is
 * meaningless, so the largest coherent dimension wins and the rest are reported
 * as unassigned (never zero-filled).
 */
export const selectCoherentEmbeddings = (resolved = []) => {
  if (resolved.length === 0) {
    return { coherent: [], rejected: [], dominantDimension: null };
  }

  const counts = new Map();
  resolved.forEach((entry) => {
    counts.set(entry.dimension, (counts.get(entry.dimension) || 0) + 1);
  });

  const dominantDimension = [...counts.entries()]
    .sort((a, b) => (b[1] - a[1]) || (a[0] - b[0]))[0][0];

  const coherent = [];
  const rejected = [];

  resolved.forEach((entry) => {
    if (entry.dimension === dominantDimension) {
      coherent.push(entry);
    } else {
      rejected.push({
        photo: entry.photo,
        photoId: entry.photoId,
        reason: 'embedding-dimension-mismatch',
      });
    }
  });

  return { coherent, rejected, dominantDimension };
};
