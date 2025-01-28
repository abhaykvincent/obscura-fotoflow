

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
