

    export function getGalleryURL(page,domain,projectId) {
        
        return `${window.location.protocol}//${window.location.host}/${domain}/${page}/${projectId}`;
      }
      export function getOnboardingReferralURL(ref){
        return `${window.location.protocol}//${window.location.host}/onboarding?ref=${ref}`;
      }
// get website url at https://www.website.com/domain
export function getWebsiteURL(domain) {
    return `${window.location.protocol}//${window.location.host}/${domain}/share/portfolio`;
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

export function getThumbnailUrl(imageUrl,collectionId) {
 // replace collectionId in url with "thumb-"+collectionId
 const newUrl = imageUrl.split(collectionId);  
 // trim first 30 chars
 // newUrl[0] = newUrl[0].substring(0, 30);
 return      newUrl[0]+collectionId+"-thumb"+newUrl[1];
}

export function getThumbnailUrl1(originalUrl) {
    // Parse the URL into a URL object
    const url = new URL(originalUrl);
    
    // Extract the pathname (e.g., '/v0/b/fotoflow-studio.firebasestorage.app/o/poiuy%2Fjhk-yLKl4%2Fbaptism-nmnTu%2FScreen%20Shot%202025-03-25%20at%201.41.51%20AM.png')
    const pathname = url.pathname;
    
    // Split the pathname at '/o/' to separate the prefix and object path
    const parts = pathname.split('/o/');
    if (parts.length !== 2) {
      throw new Error('Invalid URL format: missing /o/');
    }
    
    const prefix = parts[0]; // e.g., '/v0/b/fotoflow-studio.firebasestorage.app'
    const objectPath = parts[1]; // e.g., 'poiuy%2Fjhk-yLKl4%2Fbaptism-nmnTu%2FScreen%20Shot%202025-03-25%20at%201.41.51%20AM.png'
    
    // Split the object path by '%2F' (encoded '/')
    const objectParts = objectPath.split('%2F');
    if (objectParts.length < 3) {
      throw new Error('Invalid object path: must have at least domain, id, and collectionId');
    }
    
    // Append '-thumb' to the third part (collectionId)
    objectParts[2] += '-thumb';
    
    // Rejoin the object path components
    const newObjectPath = objectParts.join('%2F');
    
    // Construct the new pathname
    const newPathname = `${prefix}/o/${newObjectPath}`;
    
    // Update the URL's pathname
    url.pathname = newPathname;
    
    // Return the modified URL as a string
    return url.toString();
  }