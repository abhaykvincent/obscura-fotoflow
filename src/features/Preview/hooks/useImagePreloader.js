import { useEffect } from 'react';

/**
 * Hook to preload adjacent images for smoother browsing experience.
 * Delays preloading to prioritize the current image's network request.
 * 
 * @param {Array} images - The list of images.
 * @param {number} currentIndex - The index of the currently displayed image.
 * @param {boolean} isCurrentLoaded - Whether the current image has finished loading.
 * @param {number} delay - Delay in ms before starting preloads (default: 500ms).
 */
export function useImagePreloader(images, currentIndex, isCurrentLoaded, delay =600) {
  useEffect(() => {
    // Only start preloading after the current high-res image is loaded
    if (!images || images.length === 0 || !isCurrentLoaded) return;

    const preloadImage = (url) => {
      if (!url) return;
      const img = new Image();
      img.src = url;
    };

    // Delay preloading further to give UI a chance to settle
    const timer = setTimeout(() => {
      // Preload next image
      if (currentIndex < images.length - 1) {
        preloadImage(images[currentIndex + 1].url);
      }
      // Preload previous image
      if (currentIndex > 0) {
        preloadImage(images[currentIndex - 1].url);
      }
      // Preload one more next for smoother browsing
      if (currentIndex < images.length - 2) {
        preloadImage(images[currentIndex + 2].url);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [currentIndex, images, delay, isCurrentLoaded]);
}
