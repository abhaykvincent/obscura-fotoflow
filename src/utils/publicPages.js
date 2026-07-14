
const publicPatterns = ['share', 'selection', 'masonry-grid','onboarding','invitation/','login','smart-gallery', 'download-app', 'booking'];
const lightModePatterns =  ['share', 'selection','smart-gallery', 'booking'];
export const isPublicPage = (pathname) => {
  const target = (pathname || window.location.href).toLowerCase();
  return publicPatterns.some(pattern => target.includes(pattern));
};

// is light mode page
export const isLightModePage = (pathname) => {
  const target = (pathname || window.location.href).toLowerCase();
  return lightModePatterns.some(pattern => target.includes(pattern));
};