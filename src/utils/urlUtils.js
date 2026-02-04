

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

  // 1. Try new architecture prefix swap

  if (imageUrl.includes("/o/web%2F")) {

    return imageUrl.replace("/o/web%2F", "/o/thumb%2F");

  }

  // 2. Fallback to old architecture (find collectionId and append -thumb)

  // This is a bit heuristic, but matches the old logic

  // We look for the pattern before the last filename

  const parts = imageUrl.split('%2F');

  if (parts.length >= 4 && !parts[2].includes('-thumb')) {

     const newParts = [...parts];

     newParts[2] = newParts[2] + "-thumb";

     return newParts.join('%2F');

  }

  return imageUrl;

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


