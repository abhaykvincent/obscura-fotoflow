

    export function getGalleryURL(page,domain,projectId) {
        
        return `${window.location.protocol}//${window.location.host}/${domain}/${page}/${projectId}`;
      }
      export function getOnboardingReferralURL(ref){
        return `${window.location.protocol}//${window.location.host}/onboarding?ref=${ref}`;
      }
// get website url at https://www.website.com/domain
export function getWebsiteURL(domain) {
    return `${window.location.protocol}//${window.location.host}/${domain}/smart-gallerys/portfolio`;
  }
  export function isDomainOnlyURL(url) {
    const host = `${window.location.protocol}//${window.location.host}`;
    
    // Regular expression to match the pattern `${host}/<domain>/`
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

export function getImageUrlByQuality(url, quality = 'web') {
  if (!url) return "";
  
  const targetQuality = quality.toLowerCase();

  // 1. If it's already a CDN URL, just swap the quality prefix
  if (url.includes('/cdn-gallery/')) {
    const parts = url.split('/');
    // Format: .../cdn-gallery/:bucket/:quality/:domain/:project/:collection/:file
    // The quality is at a specific index depending on if it's absolute or relative
    const cdnIndex = parts.indexOf('cdn-gallery');
    if (cdnIndex !== -1 && parts.length > cdnIndex + 2) {
      parts[cdnIndex + 2] = targetQuality;
      return parts.join('/');
    }
  }

  // 2. Handle Firebase Storage URLs (Production & Emulator) and convert to CDN
  const storageMatch = url.match(/\/v0\/b\/([^/]+)\/o\/([^?]+)/);
  if (storageMatch) {
    const bucket = storageMatch[1];
    let path = decodeURIComponent(storageMatch[2]);
    
    // Swap quality prefix in the path (e.g., web/studio/... -> thumb/studio/...)
    const prefixes = ['web', 'thumb', 'original', 'covers'];
    for (const prefix of prefixes) {
      if (path.startsWith(prefix + '/')) {
        path = path.replace(prefix + '/', targetQuality + '/');
        break;
      }
    }
    
    return `/cdn-gallery/${bucket}/${path}`;
  }

  // 3. Fallback for non-storage URLs or existing architecture
  // Matches patterns like /o/web%2F, /o/thumb%2F, /o/original%2F
  const encodedMatch = url.match(/\/o\/(web|thumb|original)%2F/i);
  if (encodedMatch) {
    return url.replace(/\/o\/(web|thumb|original)%2F/i, `/o/${targetQuality}%2F`);
  }

  // 4. Handle New Architecture (Unencoded prefixes - sometimes seen in emulators/proxies)
  const unencodedMatch = url.match(/\/o\/(web|thumb|original)\//i);
  if (unencodedMatch) {
    return url.replace(/\/o\/(web|thumb|original)\//i, `/o/${targetQuality}/`);
  }

  return url;
}

export function getThumbnailUrl(imageUrl) {
  return getImageUrlByQuality(imageUrl, 'thumb');
}

export function getOriginalUrl(imageUrl) {
  return getImageUrlByQuality(imageUrl, 'original');
}



export function getThumbnailUrl1(originalUrl) {

  if (!originalUrl) return "";

  try {

    const url = new URL(originalUrl);

    const pathname = url.pathname;

    const parts = pathname.split('/o/');

    

    if (parts.length !== 2) return originalUrl;

    

    const prefix = parts[0]; 

    let objectPath = parts[1];

    

    // Check for NEW architecture

    if (objectPath.startsWith('web%2F')) {

      objectPath = objectPath.replace('web%2F', 'thumb%2F');

    } else if (objectPath.startsWith('web/')) {

      objectPath = objectPath.replace('web/', 'thumb/');

    } 

    // Check for OLD architecture

    else {

      const objectParts = objectPath.split('%2F');

      if (objectParts.length >= 3 && !objectParts[2].includes('-thumb')) {

        objectParts[2] += '-thumb';

        objectPath = objectParts.join('%2F');

      }

    }

    

    url.pathname = `${prefix}/o/${objectPath}`;

    return url.toString();

  } catch (e) {

    console.error("Error generating thumbnail URL:", e);

    return originalUrl;

  }

}


