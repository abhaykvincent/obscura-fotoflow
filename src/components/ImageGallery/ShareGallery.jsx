import React, { useState, useEffect, useCallback, useRef } from 'react';
import Preview from '../../features/Preview/Preview';

const ShareGallery = ({ images,projectId }) => {
  const [size, setSize] = useState(12);
  const[loadedImages, setLoadedImages] = useState(images.slice(0, size));
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  //Preview
  const [isPreviewOpen,setIsPreviewOpen] = useState(false);
  const [previewIndex,setPreviewIndex] = useState(0);
  const openPreview = (index) => {
    setIsPreviewOpen(true)
    setPreviewIndex(index)
  }
  const closePreview = () => {
    setIsPreviewOpen(false)
  }

  useEffect(() => {
    setLoadedImages(images.slice(0, size));
    setHasMore(true); // Reset infinite scroll tracking
    setIsPreviewOpen(false);
  }, [images, size]);

  const observer = useRef()
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
        setTimeout(() => {
          setLoading(false);
      }, 1000);

      }
    });

    if (node) observer.current.observe(node);
  }, [loading, hasMore, images]);
  return (
    <div className="gallary">
      <div className="photos">
        {
          loadedImages.map((file, index) => (
            index + 1 === loadedImages.length ?
            <img className="photo" key={file.url} src={file.url} alt={`File ${index}`} 
            ref={lastPhotoElementRef}
            onClick={()=>openPreview(index)}>
            </img>
            : 
            <img className="photo" key={file.url} src={file.url} alt={`File ${index}`} 
            onClick={()=>openPreview(index)}></img>
          ))
        }
      </div>
        {
            isPreviewOpen && <Preview image={images[previewIndex] } {...{previewIndex,setPreviewIndex,imagesLength:images.length,closePreview,projectId}}/>
        }
    </div>
  );
};

export default ShareGallery;
