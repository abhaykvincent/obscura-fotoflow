import { useState, useEffect } from 'react';

const useLoadedImages = (initialImageUrls) => {
  const [loadedImages, setLoadedImages] = useState([]);

  // Load initial images
  useEffect(() => {
    loadImages(initialImageUrls);
  }, [initialImageUrls]);

  // Function to load new images and add them to the gallery
  const loadImages = (imageUrls) => {
    const imagePromises = imageUrls.map((src) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve({ src, width: img.width, height: img.height });
      });
    });

    Promise.all(imagePromises).then((newImages) => {
      setLoadedImages((prevImages) => [...prevImages, ...newImages]);
    });
  };

  return { loadedImages, loadImages };
};

export default useLoadedImages;
