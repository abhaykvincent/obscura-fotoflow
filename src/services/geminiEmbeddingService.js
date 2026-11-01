/**
 * Gemini Embedding 2 Service
 *
 * Interacts with Google's gemini-embedding-2 multimodal embedding model
 * to generate semantic vector representations for images.
 *
 * Responsibilities:
 * - Calling Gemini Embedding 2 REST API (embedContent)
 * - Fetching and formatting image payloads (base64)
 * - Deterministic synthetic embedding generation for offline/test mode
 * - Secure local API key retrieval
 */

export const DEFAULT_EMBEDDING_MODEL = 'gemini-embedding-2';
export const DEFAULT_OUTPUT_DIMENSION = 768;
const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
export const API_KEY_STORAGE_KEY = 'fotoflow_gemini_api_key';

/**
 * Retrieves the stored Gemini API key from localStorage or environment variable.
 * @returns {string}
 */
export const getStoredApiKey = () => {
  try {
    const local = window.localStorage.getItem(API_KEY_STORAGE_KEY);
    if (local && local.trim()) return local.trim();
  } catch {
    // Ignore localStorage access restrictions
  }
  return (process.env.REACT_APP_GEMINI_API_KEY || '').trim();
};

/**
 * Stores the Gemini API key in localStorage.
 * @param {string} apiKey
 */
export const setStoredApiKey = (apiKey) => {
  try {
    if (!apiKey || !apiKey.trim()) {
      window.localStorage.removeItem(API_KEY_STORAGE_KEY);
    } else {
      window.localStorage.setItem(API_KEY_STORAGE_KEY, apiKey.trim());
    }
  } catch {
    // Ignore localStorage access restrictions
  }
};

/**
 * Downscales and extracts base64 data from an image source.
 * Handles both direct fetch and canvas-based crossOrigin fallback.
 *
 * @param {string} imageUrl
 * @param {number} [maxDimension=512]
 * @returns {Promise<{ base64: string, mimeType: string }>}
 */
export const fetchImageAsBase64 = async (imageUrl, maxDimension = 512) => {
  if (!imageUrl) {
    throw new Error('Image URL is required to fetch image data.');
  }

  // Already a base64 data URI
  if (imageUrl.startsWith('data:image/')) {
    const parts = imageUrl.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    return {
      base64: parts[1] || '',
      mimeType: mimeMatch ? mimeMatch[1] : 'image/jpeg',
    };
  }

  // First try direct fetch
  try {
    const response = await fetch(imageUrl, { mode: 'cors' });
    if (response.ok) {
      const blob = await response.blob();
      const mimeType = blob.type || 'image/jpeg';
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const resultStr = String(reader.result || '');
          const commaIdx = resultStr.indexOf(',');
          resolve(commaIdx !== -1 ? resultStr.slice(commaIdx + 1) : resultStr);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      return { base64, mimeType };
    }
  } catch {
    // Fall back to Canvas approach if direct fetch is blocked by CORS
  }

  // Fallback: load into an Image element and draw to canvas
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D context is not available.'));
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        const commaIdx = dataUrl.indexOf(',');
        resolve({
          base64: commaIdx !== -1 ? dataUrl.slice(commaIdx + 1) : dataUrl,
          mimeType: 'image/jpeg',
        });
      } catch (err) {
        reject(new Error(`Failed to process image canvas: ${err.message}`));
      }
    };

    img.onerror = () => {
      reject(new Error(`Could not load image from ${imageUrl}`));
    };

    img.src = imageUrl;
  });
};

/**
 * Generates a deterministic unit-normalized synthetic embedding vector.
 * Useful for offline development, testing, and CI environments without network or API costs.
 *
 * @param {string} seedString
 * @param {number} [dimension=DEFAULT_OUTPUT_DIMENSION]
 * @returns {number[]}
 */
export const generateSyntheticEmbedding = (seedString, dimension = DEFAULT_OUTPUT_DIMENSION) => {
  const seed = String(seedString || 'seed');
  // FNV-1a 32-bit hash
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }

  // PRNG (Mulberry32)
  let a = hash >>> 0;
  const prng = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const vector = new Array(dimension);
  let sumSquares = 0;
  for (let i = 0; i < dimension; i += 1) {
    // Generate values centered around 0 in [-1, 1]
    const val = (prng() * 2) - 1;
    vector[i] = val;
    sumSquares += val * val;
  }

  // Normalize to unit length
  const norm = Math.sqrt(sumSquares) || 1;
  for (let i = 0; i < dimension; i += 1) {
    vector[i] = Number((vector[i] / norm).toFixed(6));
  }

  return vector;
};

/**
 * Calls Gemini Embedding 2 endpoint to generate an embedding for an image.
 *
 * @param {Object} options
 * @param {string} options.imageBase64
 * @param {string} [options.mimeType='image/jpeg']
 * @param {string} options.apiKey
 * @param {string} [options.model=DEFAULT_EMBEDDING_MODEL]
 * @param {number} [options.outputDimensionality=DEFAULT_OUTPUT_DIMENSION]
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<{ vector: number[], model: string, dimension: number }>}
 */
export const generateGeminiEmbedding = async ({
  imageBase64,
  mimeType = 'image/jpeg',
  apiKey,
  model = DEFAULT_EMBEDDING_MODEL,
  outputDimensionality = DEFAULT_OUTPUT_DIMENSION,
  signal,
}) => {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('A valid Gemini API Key is required. Configure it in developer controls.');
  }

  if (!imageBase64 || typeof imageBase64 !== 'string') {
    throw new Error('Image base64 data is required to generate an embedding.');
  }

  const endpoint = `${GEMINI_API_BASE_URL}/${model}:embedContent?key=${encodeURIComponent(apiKey.trim())}`;

  const payload = {
    content: {
      parts: [
        {
          inlineData: {
            mimeType,
            data: imageBase64,
          },
        },
      ],
    },
  };

  if (Number.isFinite(outputDimensionality) && outputDimensionality > 0) {
    payload.outputDimensionality = outputDimensionality;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errorJson = await response.json();
      errorDetail = errorJson?.error?.message || response.statusText;
    } catch {
      errorDetail = response.statusText;
    }

    if (response.status === 400) {
      throw new Error(`Gemini API 400 Bad Request: ${errorDetail}`);
    }
    if (response.status === 403) {
      throw new Error(`Gemini API 403 Forbidden: ${errorDetail}`);
    }
    if (response.status === 429) {
      throw new Error(`Gemini API 429 Rate Limit Exceeded: ${errorDetail}`);
    }
    throw new Error(`Gemini API Error (${response.status}): ${errorDetail}`);
  }

  const data = await response.json();
  const vector = data?.embedding?.values;

  if (!Array.isArray(vector) || vector.length === 0) {
    throw new Error('Gemini API did not return embedding values in response.');
  }

  return {
    vector,
    model,
    dimension: vector.length,
  };
};

/**
 * Calls Gemini Embedding 2 endpoint to generate an embedding for a natural language text query.
 * Because gemini-embedding-2 is multimodal, text and image vectors share the exact same space.
 *
 * @param {Object} options
 * @param {string} options.text
 * @param {string} options.apiKey
 * @param {string} [options.model=DEFAULT_EMBEDDING_MODEL]
 * @param {number} [options.outputDimensionality=DEFAULT_OUTPUT_DIMENSION]
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<{ vector: number[], model: string, dimension: number }>}
 */
export const generateTextGeminiEmbedding = async ({
  text,
  apiKey,
  model = DEFAULT_EMBEDDING_MODEL,
  outputDimensionality = DEFAULT_OUTPUT_DIMENSION,
  signal,
}) => {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('A valid Gemini API Key is required for semantic search.');
  }

  if (!text || typeof text !== 'string' || !text.trim()) {
    throw new Error('Query text is required to generate a text embedding.');
  }

  const endpoint = `${GEMINI_API_BASE_URL}/${model}:embedContent?key=${encodeURIComponent(apiKey.trim())}`;

  const payload = {
    content: {
      parts: [
        {
          text: text.trim(),
        },
      ],
    },
  };

  if (Number.isFinite(outputDimensionality) && outputDimensionality > 0) {
    payload.outputDimensionality = outputDimensionality;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errorJson = await response.json();
      errorDetail = errorJson?.error?.message || response.statusText;
    } catch {
      errorDetail = response.statusText;
    }

    if (response.status === 400) {
      throw new Error(`Gemini API 400 Bad Request: ${errorDetail}`);
    }
    if (response.status === 403) {
      throw new Error(`Gemini API 403 Forbidden: ${errorDetail}`);
    }
    if (response.status === 429) {
      throw new Error(`Gemini API 429 Rate Limit Exceeded: ${errorDetail}`);
    }
    throw new Error(`Gemini API Error (${response.status}): ${errorDetail}`);
  }

  const data = await response.json();
  const vector = data?.embedding?.values;

  if (!Array.isArray(vector) || vector.length === 0) {
    throw new Error('Gemini API did not return embedding values in response.');
  }

  return {
    vector,
    model,
    dimension: vector.length,
  };
};
