import { useEffect } from 'react';

/**
 * Hook to preload adjacent images for smoother browsing experience.
 * @param {Array} images - The list of images.
 * @param {number} currentIndex - The index of the currently displayed image.
 */
export function useImagePreloader(images, currentIndex) {
  useEffect(() => {
    if (!images || images.length === 0) return;

    const preloadImage = (url) => {
      if (!url) return;
      const img = new Image();
      img.src = url;
    };

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
  }, [currentIndex, images]);
}
