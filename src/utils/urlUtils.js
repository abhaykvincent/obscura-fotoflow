

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

export function getThumbnailUrl(imageUrl) {

  if (!imageUrl) return "";

  // New architecture: replace "web/" prefix with "thumb/"

  // In Firebase storage URLs, this is often encoded as "web%2F"

  return imageUrl.replace("/o/web%2F", "/o/thumb%2F");

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

    

    // Check if it starts with web%2F or web/

    if (objectPath.startsWith('web%2F')) {

      objectPath = objectPath.replace('web%2F', 'thumb%2F');

    } else if (objectPath.startsWith('web/')) {

      objectPath = objectPath.replace('web/', 'thumb/');

    } else {

      // Fallback: if it doesn't have the prefix, maybe it's old format

      // but the request is for the new architecture.

      return originalUrl;

    }

    

    url.pathname = `${prefix}/o/${objectPath}`;

    return url.toString();

  } catch (e) {

    console.error("Error generating thumbnail URL:", e);

    return originalUrl;

  }

}
