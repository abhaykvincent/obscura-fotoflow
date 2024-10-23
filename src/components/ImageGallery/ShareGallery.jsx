import React, { useState, useEffect, useCallback, useRef } from 'react';
import Preview from '../../features/Preview/Preview';

const ShareGallery = ({ images, projectId }) => {
  const [size, setSize] = useState(12);
  const [loadedImages, setLoadedImages] = useState(images.slice(0, size));
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Preview state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const openPreview = (index) => {
    setIsPreviewOpen(true);
    setPreviewIndex(index);
  };
  const closePreview = () => setIsPreviewOpen(false);

  useEffect(() => {
    setLoadedImages(images.slice(0, size));
    setIsPreviewOpen(false);
  }, [images, size]);

  const observer = useRef();
  const lastPhotoElementRef = useCallback((node) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        setLoading(true);
        setLoadedImages((prevLoadedImages) => {
          const newLoadedImages = [
            ...prevLoadedImages,
            ...images.slice(prevLoadedImages.length, prevLoadedImages.length + size),
          ];
          setHasMore(newLoadedImages.length < images.length);
          return newLoadedImages;
        });
        setLoading(false);
      }
    });

    if (node) observer.current.observe(node);
  }, [loading, hasMore, images]);

  return (
    <div className="gallary">
      <div className="photos">
        {loadedImages.map((file, index) => (
          <img
            className="photo"
            key={index}
            src={file.url}
            alt={`File ${index}`}
            ref={index + 1 === loadedImages.length ? lastPhotoElementRef : null}
            onClick={() => openPreview(index)}
            loading="lazy" // This attribute helps with lazy loading
          />
        ))}
      </div>
      {isPreviewOpen && (
        <Preview
          image={images[previewIndex]}
          {...{ previewIndex, setPreviewIndex, imagesLength: images.length, closePreview, projectId }}
        />
      )}
    </div>
  );
};

export default ShareGallery;
