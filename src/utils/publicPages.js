
const publicPatterns = ['share', 'selection', 'masonry-grid','onboarding','invitation/'];

export const isPublicPage = () => 
  publicPatterns.some(pattern => 
    window.location.href.toLowerCase().includes(pattern)
  );