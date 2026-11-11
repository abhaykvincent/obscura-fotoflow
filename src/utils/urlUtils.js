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
import { resolvePhotoThumbUrl } from './photoStorage';

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

export function getGalleryURL(page, domain, projectId, galleryId = null) {
  const base = `${window.location.protocol}//${window.location.host}/${domain}/${page}/${projectId}`;
  if (galleryId) return `${base}/gallery/${galleryId}`;
  return base;
}

export function getSelectionGalleryURL(domain, projectId, galleryId = null) {
  return getGalleryURL('selection', domain, projectId, galleryId);
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

/**
 * Resolves a photo's stored thumbnail URL. Canonical Project Photos use the
 * document's urls.thumb (WebP); legacy uploadedFiles[] use their JPG thumbUrl.
 * The stored format is preserved, so no WebP derivative is invented for older
 * projects. Falls back to the web URL only when no thumbnail is stored.
 */
export function getPhotoThumbnailUrl(photo) {
  const storedThumb = resolvePhotoThumbUrl(photo);
  if (storedThumb) return getCdnUrl(storedThumb);
  return getCdnUrl(photo?.url || photo?.urls?.web || '');
}

const findPhotoByCoverUrl = (photos, coverUrl) =>
  (photos || []).find((photo) => photo && (
    photo.url === coverUrl ||
    photo.thumbUrl === coverUrl ||
    photo.urls?.web === coverUrl ||
    photo.urls?.thumb === coverUrl
  ));

/**
 * Resolves a cover thumbnail from the cover URL plus any known photos.
 * When the matching photo is found, its stored thumb is used (WebP for new
 * Project Photos, JPG for legacy uploadedFiles). Without a matching photo the
 * cover's own format is preserved so older projects are never pointed at a
 * WebP derivative they do not have.
 */
export function getCoverThumbnailUrl(coverUrl, { photos = [], isProjectOwned = false } = {}) {
  if (!coverUrl) return '';
  const match = findPhotoByCoverUrl(photos, coverUrl);
  if (match) return getPhotoThumbnailUrl(match);
  return isProjectOwned ? getThumbnailUrl(coverUrl) : getCdnUrl(coverUrl);
}

export function getCollectionCoverThumbnailUrl(collection) {
  const photos = collection?.uploadedFiles || [];
  const isProjectOwned = photos.length === 0 &&
    Array.isArray(collection?.photoIds) && collection.photoIds.length > 0;
  return getCoverThumbnailUrl(collection?.galleryCover, { photos, isProjectOwned });
}

export function getProjectCoverThumbnailUrl(project) {
  const collections = project?.collections || [];
  const photos = collections.flatMap((collection) => collection?.uploadedFiles || []);
  const isProjectOwned = collections.some(
    (collection) => Array.isArray(collection?.photoIds) && collection.photoIds.length > 0
  );
  return getCoverThumbnailUrl(project?.projectCover, { photos, isProjectOwned });
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
