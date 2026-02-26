import { useEffect } from 'react';

/**
 * Hook to preload adjacent images for smoother browsing experience.
 * Delays preloading to prioritize the current image's network request.
 * 
 * @param {Array} images - The list of images.
 * @param {number} currentIndex - The index of the currently displayed image.
 * @param {number} delay - Delay in ms before starting preloads (default: 500ms).
 */
export function useImagePreloader(images, currentIndex, delay = 500) {
  useEffect(() => {
    if (!images || images.length === 0) return;

    const preloadImage = (url) => {
      if (!url) return;
      const img = new Image();
      img.src = url;
    };

    // Delay preloading to give the current image priority
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
  }, [currentIndex, images, delay]);
}
