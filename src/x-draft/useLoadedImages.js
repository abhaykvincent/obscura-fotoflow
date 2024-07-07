import { useState, useEffect } from 'react';

const useLoadedImages = (imageUrls) => {
  const [loadedImages, setLoadedImages] = useState([]);

  useEffect(() => {
    const imagePromises = imageUrls.map((src) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve({ src, width: img.width, height: img.height });
      });
    });

    Promise.all(imagePromises).then(setLoadedImages);
  }, [imageUrls]);

  return loadedImages;
};

export default useLoadedImages;