import {
  getCdnUrl,
  getCdnBaseUrl,
  isEmulatorUrl,
  isNonStorageUrl,
  swapQualityPrefix,
  extractStoragePath,
  QUALITY_PREFIXES,
  DEFAULT_CDN_BASE_URL,
} from './cdnUrl';

export {
  getCdnUrl,
  getCdnBaseUrl,
  isEmulatorUrl,
  isNonStorageUrl,
  swapQualityPrefix,
  extractStoragePath,
  QUALITY_PREFIXES,
  DEFAULT_CDN_BASE_URL,
};

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
 * Extracts domain/hostname from a given URL.
 */
export function extractDomain(url) {
  if (!url || typeof url !== 'string') return '';
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return parsed.hostname;
  } catch {
    return url;
  }
}

/**
 * Single Image Delivery Gateway
 * Transforms storage URLs to the canonical FotoFlow CDN delivery path or preserves Storage Emulator paths.
 *
 * @param {string} url - Source photo URL or storage path
 * @param {string} [quality='web'] - 'web' | 'thumb' | 'original' | 'covers'
 * @returns {string} - CDN or Local Emulator delivery URL
 */
export function getPhotoDeliveryUrl(url, quality = 'web') {
  return getCdnUrl(url, quality);
}

/**
 * Alias for getPhotoDeliveryUrl to maintain backward compatibility
 */
export function getImageUrlByQuality(url, quality = 'web') {
  return getCdnUrl(url, quality);
}

export function getThumbnailUrl(imageUrl) {
  return getCdnUrl(imageUrl, 'thumb');
}

export function getOriginalUrl(imageUrl) {
  return getCdnUrl(imageUrl, 'original');
}

export function getCoverUrl(imageUrl) {
  return getCdnUrl(imageUrl, 'covers');
}

export function getWebUrl(imageUrl) {
  return getCdnUrl(imageUrl, 'web');
}

/**
 * Backward compatibility helper for old getThumbnailUrl1 callers
 */
export function getThumbnailUrl1(originalUrl) {
  return getThumbnailUrl(originalUrl);
}
