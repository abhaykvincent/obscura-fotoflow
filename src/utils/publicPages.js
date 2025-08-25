
const publicPatterns = ['share', 'selection', 'masonry-grid','onboarding','invitation/','login','smart-gallery'];
const lightModePatterns =  ['share', 'selection','smart-gallery'];
export const isPublicPage = () => 
  publicPatterns.some(pattern => 
    window.location.href.toLowerCase().includes(pattern)
  );

// is light mode page
export const isLightModePage = () =>
  lightModePatterns.some(pattern => 
    window.location.href.toLowerCase().includes(pattern)
  );