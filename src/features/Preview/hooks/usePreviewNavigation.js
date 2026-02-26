import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to handle navigation between images in the preview.
 * @param {number} currentIndex - Current image index.
 * @param {number} totalCount - Total number of images.
 * @param {Function} setIndex - Function to update the current index.
 * @param {Function} onClose - Function to close the preview.
 */
export function usePreviewNavigation(currentIndex, totalCount, setIndex, onClose) {
  const [direction, setDirection] = useState(0);

  const paginate = useCallback((newDirection) => {
    const newIndex = currentIndex + newDirection;
    if (newIndex >= 0 && newIndex < totalCount) {
      setDirection(newDirection);
      setIndex(newIndex);
    } else {
      // Logic for boundary (e.g., stop or bounce)
      setDirection(0);
    }
  }, [currentIndex, totalCount, setIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowRight':
          paginate(1);
          break;
        case 'ArrowLeft':
          paginate(-1);
          break;
        case 'Escape':
          onClose();
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [paginate, onClose]);

  return { direction, paginate };
}
