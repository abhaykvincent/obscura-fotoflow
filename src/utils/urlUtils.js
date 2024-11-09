

    export function getGalleryURL(page,domain,projectId) {
        
        return `${window.location.protocol}//${window.location.host}/${domain}/${page}/${projectId}`;
      }

export const getGoogleMapsUrl = (location) => {
  if (!location || typeof location !== 'string') {
    throw new Error('A valid location string must be provided.');
  }

  const baseUrl = 'https://www.google.com/maps/search/';
  const encodedLocation = encodeURIComponent(location.trim());

  return `${baseUrl}${encodedLocation}`;
};