/**
 * Canonical FotoFlow CDN URL Generation Utility
 *
 * Centralizes image delivery URL generation using the Cloudflare CDN architecture.
 *
 * Architecture:
 * FotoFlow Frontend -> cdn.fotoflow.co -> Cloudflare Worker -> R2 Shield -> Firebase/GCS Backfill
 */

export const DEFAULT_CDN_BASE_URL = 'https://cdn.fotoflow.co';
export const QUALITY_PREFIXES = ['web', 'thumb', 'original', 'covers'];

/**
 * Gets the configured CDN base endpoint without trailing slash.
 * Respects REACT_APP_CDN_BASE_URL or REACT_APP_IMAGE_CDN_URL environment variables.
 *
 * @returns {string} CDN base URL (defaults to https://cdn.fotoflow.co)
 */
export function getCdnBaseUrl() {
  const envUrl = process.env.REACT_APP_CDN_BASE_URL || process.env.REACT_APP_IMAGE_CDN_URL;
  const baseUrl = (envUrl && envUrl.trim()) ? envUrl.trim() : DEFAULT_CDN_BASE_URL;
  return baseUrl.replace(/\/+$/, '');
}

/**
 * Encodes a storage object path segment by segment.
 * Ensures slashes '/' are preserved, and characters like spaces, '#', '?' are safely encoded.
 * Prevents double encoding if segments are already percent-encoded.
 *
 * @param {string} path - Storage object path (e.g. 'web/monalisa/project/image.jpg')
 * @returns {string} Safely encoded storage path
 */
export function encodeStoragePath(path) {
  if (!path || typeof path !== 'string') return '';
  const cleanPath = path.replace(/^\/+/, '');
  
  return cleanPath
    .split('/')
    .map((segment) => {
      try {
        const decoded = decodeURIComponent(segment);
        return encodeURI(decoded)
          .replace(/#/g, '%23')
          .replace(/\?/g, '%3F');
      } catch {
        return encodeURI(segment)
          .replace(/#/g, '%23')
          .replace(/\?/g, '%3F');
      }
    })
    .join('/');
}

/**
 * Checks if a URL points to the local Firebase Storage Emulator.
 *
 * @param {string} url - URL string to check
 * @returns {boolean} True if URL points to emulator
 */
export function isEmulatorUrl(url) {
  if (!url || typeof url !== 'string') return false;

  if (url.includes(':9199')) return true;
  const emulatorHost = process.env.REACT_APP_EMULATOR_HOST;
  if (emulatorHost && url.includes(emulatorHost)) return true;
  const emulatorPort = process.env.REACT_APP_EMULATOR_PORT;
  if (emulatorPort && url.includes(`:${emulatorPort}`)) return true;

  if (
    (url.includes('localhost') || url.includes('127.0.0.1') || url.includes('0.0.0.0')) &&
    (url.includes('/v0/b/') || url.includes('/o/'))
  ) {
    return true;
  }

  if (url.startsWith('http://') && url.includes('/v0/b/') && url.includes('/o/')) {
    return true;
  }

  return false;
}

/**
 * Checks if a URL is an external non-storage URL or special scheme (data:, blob:).
 *
 * @param {string} url - URL string to check
 * @returns {boolean} True if URL is non-storage
 */
export function isNonStorageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return true;
  }

  const isStorageOrCdn = (
    url.includes('cdn.fotoflow.co') ||
    url.includes('firebasestorage.googleapis.com') ||
    url.includes('storage.googleapis.com') ||
    url.includes('fotoflow-r2-shield') ||
    url.includes('/cdn-gallery/') ||
    url.includes(':9199') ||
    url.includes('/v0/b/') ||
    url.includes('/o/') ||
    isEmulatorUrl(url)
  );

  return (url.startsWith('http://') || url.startsWith('https://')) && !isStorageOrCdn;
}

/**
 * Swaps or prepends the target quality in the storage object path.
 *
 * @param {string} path - Storage path
 * @param {string} targetQuality - Quality name ('web', 'thumb', 'original', 'covers')
 * @returns {string} Path with updated quality prefix
 */
export function swapQualityPrefix(path, targetQuality) {
  if (!path || typeof path !== 'string') return '';
  const cleanPath = path.replace(/^\/+/, '');

  for (const prefix of QUALITY_PREFIXES) {
    if (cleanPath.startsWith(prefix + '/')) {
      return cleanPath.replace(prefix + '/', `${targetQuality}/`);
    }
  }

  return `${targetQuality}/${cleanPath}`;
}

/**
 * Extracts the raw object path from various storage/CDN URL patterns or raw paths.
 * Handles:
 * 1. Canonical CDN URLs (https://cdn.fotoflow.co/:path)
 * 2. Legacy Worker URLs (fotoflow-r2-shield.fotoflow-cloud.workers.dev/:path)
 * 3. Legacy proxy URLs (/cdn-gallery/:bucket/:path)
 * 4. Firebase Storage URLs (/v0/b/:bucket/o/:encodedPath)
 * 5. Direct GCS URLs (storage.googleapis.com/:bucket/:path)
 * 6. Relative / raw storage paths (web/..., thumb/..., covers/..., studios/...)
 *
 * @param {string} url - URL or storage path
 * @returns {string|null} Extracted storage object path
 */
export function extractStoragePath(url) {
  if (!url || typeof url !== 'string') return null;

  // 1. Canonical CDN or configured CDN base URL
  const cdnBase = getCdnBaseUrl();
  if (url.startsWith(cdnBase) || url.includes('cdn.fotoflow.co')) {
    try {
      const parsed = new URL(url);
      return parsed.pathname.replace(/^\/+/, '');
    } catch {
      const parts = url.split('cdn.fotoflow.co/');
      if (parts.length > 1) return parts[1];
    }
  }

  // 2. Legacy R2 Worker URL
  if (url.includes('fotoflow-r2-shield')) {
    try {
      const parsed = new URL(url);
      return parsed.pathname.replace(/^\/+/, '');
    } catch {
      const parts = url.split('.workers.dev/');
      if (parts.length > 1) return parts[1];
    }
  }

  // 3. Old /cdn-gallery/ proxy URL (/cdn-gallery/:bucket/:path...)
  if (url.includes('/cdn-gallery/')) {
    const parts = url.split('/cdn-gallery/')[1]?.split('/') || [];
    if (parts.length > 1) {
      return parts.slice(1).join('/');
    }
  }

  // 4. Firebase Storage URLs (/v0/b/:bucket/o/:encodedPath)
  const storageMatch = url.match(/\/v0\/b\/[^/]+\/o\/([^?#]+)/);
  if (storageMatch) {
    return decodeURIComponent(storageMatch[1]);
  }

  // 5. Direct GCS URLs (storage.googleapis.com/:bucket/:path)
  const gcsMatch = url.match(/storage\.googleapis\.com\/[^/]+\/([^?#]+)/);
  if (gcsMatch) {
    return decodeURIComponent(gcsMatch[1]);
  }

  // 6. Storage path or relative path
  const cleanUrl = url.replace(/^\/+/, '');
  for (const prefix of QUALITY_PREFIXES) {
    if (cleanUrl.startsWith(prefix + '/')) {
      return cleanUrl;
    }
  }

  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    return cleanUrl;
  }

  return null;
}

/**
 * Transforms an emulator storage URL to deliver the requested quality.
 *
 * @param {string} url - Emulator URL
 * @param {string} targetQuality - 'web' | 'thumb' | 'original' | 'covers'
 * @returns {string} Transformed emulator URL
 */
function transformEmulatorUrl(url, targetQuality) {
  const emulatorMatch = url.match(/^(https?:\/\/[^/]+\/v0\/b\/[^/]+\/o)\/([^?#]+)(\?.*)?$/);
  if (emulatorMatch) {
    const base = emulatorMatch[1];
    const encodedPath = emulatorMatch[2];
    const query = emulatorMatch[3] || '?alt=media';
    const decodedPath = decodeURIComponent(encodedPath);

    if (targetQuality === 'covers') {
      return `${base}/${encodeURIComponent(decodedPath)}${query}`;
    }

    const adjustedPath = swapQualityPrefix(decodedPath, targetQuality);
    return `${base}/${encodeURIComponent(adjustedPath)}${query}`;
  }

  return url;
}

/**
 * Canonical CDN URL Generator.
 *
 * Converts a storage path or legacy storage URL into a canonical FotoFlow CDN delivery URL.
 * Handles backward compatibility with old Firebase URLs, handles quality variants, and is idempotent.
 *
 * @param {string} storagePathOrUrl - Storage object path or full storage/CDN URL
 * @param {string} [quality] - Optional target quality ('web', 'thumb', 'original', 'covers')
 * @returns {string} Canonical CDN delivery URL (or emulator/non-storage URL as appropriate)
 */
export function getCdnUrl(storagePathOrUrl, quality) {
  if (!storagePathOrUrl || typeof storagePathOrUrl !== 'string') {
    return '';
  }

  if (isNonStorageUrl(storagePathOrUrl)) {
    return storagePathOrUrl;
  }

  const targetQuality = quality ? quality.toLowerCase() : null;

  // Preserve and transform Firebase Storage Emulator URLs
  if (isEmulatorUrl(storagePathOrUrl)) {
    return targetQuality
      ? transformEmulatorUrl(storagePathOrUrl, targetQuality)
      : storagePathOrUrl;
  }

  const cdnBase = getCdnBaseUrl();
  const objectPath = extractStoragePath(storagePathOrUrl);

  if (objectPath) {
    let finalPath = objectPath;

    if (targetQuality) {
      if (targetQuality === 'covers') {
        // Preserves cover or web path as-is for covers
        finalPath = objectPath;
      } else {
        finalPath = swapQualityPrefix(objectPath, targetQuality);
      }
    }

    const encodedPath = encodeStoragePath(finalPath);
    return `${cdnBase}/${encodedPath}`;
  }

  // Fallback for legacy encoded /o/ formats where objectPath couldn't be extracted
  if (!targetQuality || targetQuality === 'covers') {
    return storagePathOrUrl;
  }

  const encodedMatch = storagePathOrUrl.match(/\/o\/(web|thumb|original|covers)%2F/i);
  if (encodedMatch) {
    return storagePathOrUrl.replace(/\/o\/(web|thumb|original|covers)%2F/i, `/o/${targetQuality}%2F`);
  }

  const unencodedMatch = storagePathOrUrl.match(/\/o\/(web|thumb|original|covers)\//i);
  if (unencodedMatch) {
    return storagePathOrUrl.replace(/\/o\/(web|thumb|original|covers)\//i, `/o/${targetQuality}/`);
  }

  return storagePathOrUrl;
}
