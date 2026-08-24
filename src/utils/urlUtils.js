const QUALITY_PREFIXES = ['web', 'thumb', 'original', 'covers'];
const DEFAULT_CDN_BASE = 'https://fotoflow-r2-shield.fotoflow-cloud.workers.dev';

export function getGalleryURL(page, domain, projectId) {
  return `${window.location.protocol}//${window.location.host}/${domain}/${page}/${projectId}`;
}

export function getOnboardingReferralURL(ref) {
  return `${window.location.protocol}//${window.location.host}/onboarding?ref=${ref}`;
}

export function getWebsiteURL(domain) {
  return `${window.location.protocol}//${window.location.host}/${domain}/smart-gallerys/portfolio`;
}

export function isDomainOnlyURL(url) {
  const host = `${window.location.protocol}//${window.location.host}`;
  const regex = new RegExp(`^${host}/[^/]+/$`);
  return regex.test(url);
}

export const getGoogleMapsUrl = (location) => {
  if (!location || typeof location !== 'string') {
    throw new Error('A valid location string must be provided.');
  }
  const baseUrl = 'https://www.google.com/maps/search/';
  const encodedLocation = encodeURIComponent(location.trim());
  return `${baseUrl}${encodedLocation}`;
};

export const copyToClipboard = (url) => {
  navigator.clipboard.writeText(url).then(() => {
  }).catch((err) => {
    console.error('Failed to copy: ', err);
  });
};

/**
 * Gets the configured CDN base endpoint without trailing slash.
 */
function getCdnBaseUrl() {
  const envUrl = process.env.REACT_APP_IMAGE_CDN_URL;
  const baseUrl = (envUrl && envUrl.trim()) ? envUrl.trim() : DEFAULT_CDN_BASE;
  return baseUrl.replace(/\/+$/, '');
}

/**
 * Checks if a URL is an external non-storage URL or special scheme.
 */
function isNonStorageUrl(url) {
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return true;
  }
  const isStorageOrCdn = (
    url.includes('firebasestorage.googleapis.com') ||
    url.includes('storage.googleapis.com') ||
    url.includes('fotoflow-r2-shield') ||
    url.includes('/cdn-gallery/') ||
    url.includes(':9199') ||
    url.includes('/v0/b/') ||
    url.includes('/o/')
  );
  return (url.startsWith('http://') || url.startsWith('https://')) && !isStorageOrCdn;
}

/**
 * Swaps or prepends the target quality in the storage object path.
 */
function swapQualityPrefix(path, targetQuality) {
  let cleanPath = path.replace(/^\/+/, '');
  for (const prefix of QUALITY_PREFIXES) {
    if (cleanPath.startsWith(prefix + '/')) {
      return cleanPath.replace(prefix + '/', `${targetQuality}/`);
    }
  }
  return `${targetQuality}/${cleanPath}`;
}

/**
 * Extracts the object path from various storage/CDN URL patterns.
 */
function extractStoragePath(url) {
  // 1. Existing CDN or R2 Worker URL
  const cdnBase = getCdnBaseUrl();
  if (url.startsWith(cdnBase) || url.includes('fotoflow-r2-shield')) {
    try {
      const parsed = new URL(url);
      return parsed.pathname.replace(/^\/+/, '');
    } catch {
      const parts = url.split('.workers.dev/');
      if (parts.length > 1) return parts[1];
    }
  }

  // 2. Old /cdn-gallery/ proxy URL (/cdn-gallery/:bucket/:path...)
  if (url.includes('/cdn-gallery/')) {
    const parts = url.split('/cdn-gallery/')[1]?.split('/') || [];
    if (parts.length > 1) {
      // parts[0] is bucket, parts[1...] is path
      return parts.slice(1).join('/');
    }
  }

  // 3. Firebase Storage URLs (/v0/b/:bucket/o/:encodedPath)
  const storageMatch = url.match(/\/v0\/b\/[^/]+\/o\/([^?]+)/);
  if (storageMatch) {
    return decodeURIComponent(storageMatch[1]);
  }

  // 4. Direct GCS URLs (storage.googleapis.com/:bucket/:path)
  const gcsMatch = url.match(/storage\.googleapis\.com\/[^/]+\/([^?]+)/);
  if (gcsMatch) {
    return decodeURIComponent(gcsMatch[1]);
  }

  // 5. Relative path starting with a known quality prefix
  const cleanUrl = url.replace(/^\/+/, '');
  for (const prefix of QUALITY_PREFIXES) {
    if (cleanUrl.startsWith(prefix + '/')) {
      return cleanUrl;
    }
  }

  return null;
}

/**
 * Single Image Delivery Gateway
 * Transforms storage URLs to the Cloudflare R2 Worker CDN delivery path.
 *
 * @param {string} url - Source photo URL or storage path
 * @param {string} quality - 'web' | 'thumb' | 'original' | 'covers'
 * @returns {string} - Cloudflare R2 / CDN delivery URL
 */
export function getPhotoDeliveryUrl(url, quality = 'web') {
  if (!url || typeof url !== 'string') return '';

  if (isNonStorageUrl(url)) {
    return url;
  }

  const targetQuality = quality.toLowerCase();
  const cdnBase = getCdnBaseUrl();
  const objectPath = extractStoragePath(url);

  if (objectPath) {
    const adjustedPath = swapQualityPrefix(objectPath, targetQuality);
    return `${cdnBase}/${adjustedPath}`;
  }

  // Fallback for legacy encoded /o/ formats
  const encodedMatch = url.match(/\/o\/(web|thumb|original|covers)%2F/i);
  if (encodedMatch) {
    return url.replace(/\/o\/(web|thumb|original|covers)%2F/i, `/o/${targetQuality}%2F`);
  }

  const unencodedMatch = url.match(/\/o\/(web|thumb|original|covers)\//i);
  if (unencodedMatch) {
    return url.replace(/\/o\/(web|thumb|original|covers)\//i, `/o/${targetQuality}/`);
  }

  return url;
}

/**
 * Alias for getPhotoDeliveryUrl to maintain backward compatibility
 */
export function getImageUrlByQuality(url, quality = 'web') {
  return getPhotoDeliveryUrl(url, quality);
}

export function getThumbnailUrl(imageUrl) {
  return getPhotoDeliveryUrl(imageUrl, 'thumb');
}

export function getOriginalUrl(imageUrl) {
  return getPhotoDeliveryUrl(imageUrl, 'original');
}

export function getCoverUrl(imageUrl) {
  return getPhotoDeliveryUrl(imageUrl, 'covers');
}

export function getWebUrl(imageUrl) {
  return getPhotoDeliveryUrl(imageUrl, 'web');
}

/**
 * Backward compatibility helper for old getThumbnailUrl1 callers
 */
export function getThumbnailUrl1(originalUrl) {
  return getThumbnailUrl(originalUrl);
}
