

    export function getGalleryURL(page,domain,projectId) {
        
        return `${window.location.protocol}//${window.location.host}/${domain}/${page}/${projectId}`;
      }
// get website url at https://www.website.com/domain
export function getWebsiteURL(domain) {
    return `${window.location.protocol}//${window.location.host}/${domain}`;
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