import React, { useState, useEffect, useCallback, useRef } from 'react';
import Preview from '../../features/Preview/Preview';
import { getThumbnailUrl } from '../../utils/urlUtils';
import { trackEvent } from '../../analytics/utils';
import { fetchCollectionStatus } from '../../firebase/functions/firestore';

const ShareGallery = ({ images,projectId,collectionId, domain }) => {
  const [size, setSize] = useState(12);
  const [loadedImages, setLoadedImages] = useState(images.slice(0, size));
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [displayGallery, setDisplayGallery] = useState(false);
  //Preview
  const [isPreviewOpen,setIsPreviewOpen] = useState(false);
  const [previewIndex,setPreviewIndex] = useState(0);
  const containerRef = useRef(null);
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

  useEffect(() => {
    const checkCollectionStatus = async () => {
      try {
        const status = await fetchCollectionStatus(domain, projectId, collectionId);
        if (status === 'visible') {
          setDisplayGallery(true);
        } else {
          setDisplayGallery(false);
        }
      } catch (error) {
        console.error('Error fetching collection status:', error);
        setDisplayGallery(false); // Hide gallery on error
      }
    };

    checkCollectionStatus();
  }, [domain, projectId, collectionId]);

  useEffect(() => {
    trackEvent('gallery_viewed', {
            project_id: projectId
          });
  }, []);
  useEffect(() => {
    console.log('loading',loading)
  }, [loading]);
  useEffect(() => {
    console.log(previewIndex)

    const scrollToImage = () => {
      // Find the target image
      const targetImage = containerRef.current?.querySelector(`[alt="File ${previewIndex}"]`);
      
      if (targetImage) {
        // Scroll the image into view with smooth behavior
        targetImage.scrollIntoView({
          behavior: 'smooth',
          block: 'center',     // Centers vertically
          inline: 'nearest'    // Minimizes horizontal movement
        });
      }
    };

    scrollToImage();
  }, [previewIndex]); 

  const observer = useRef()
  const lastPhotoElementRef = useCallback((node) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        setLoading(true);
        setTimeout(() => {
          setLoadedImages((prevLoadedImages) => {
          const newLoadedImages = [
            ...prevLoadedImages,
            ...images.slice(prevLoadedImages.length, prevLoadedImages.length + size),
          ];
          setHasMore(newLoadedImages.length < images.length);
          console.log(
            images.slice(prevLoadedImages.length, prevLoadedImages.length + size).length

          )
          // Track when new images are loaded into the gallery
          trackEvent('gallery_images_loaded', {
            loaded_images_count: size,
            total_images: images.length,
          });
          setLoading(false);
          return newLoadedImages;
        });

        

      }, 2000);

      }
    });

    if (node) observer.current.observe(node);
  }, [loading, hasMore, images]);
  return (
    <div className="gallary">
      {displayGallery ? (
        <div className="photos" ref={containerRef}>
        {
          loadedImages.map((file, index) => (
            index + 1 === loadedImages.length ?
            <img className="photo" 
              key={file.url} 
              src={file?.thumbAvailable ? getThumbnailUrl(file.url,collectionId):  file.url}
              srcSet={`${file?.thumbAvailable  ? getThumbnailUrl(file.url,collectionId) : file.url} 720w, ${file.url} 1080w`} 
              alt={`File ${index}`} 
              ref={lastPhotoElementRef}
              onClick={()=>openPreview(index)}
            ></img>
            : 
            <img className="photo" key={file.url} 
            src={file?.thumbAvailable ?getThumbnailUrl(file.url,collectionId):  file.url}

            srcSet={`${file?.thumbAvailable  ? getThumbnailUrl(file.url,collectionId): file.url} 720w, ${file.url} 1080w`} 

            alt={`File ${index}`} 
            onClick={()=>openPreview(index)}></img>
          ))
        }
        
      </div>
      ) : (
        <p>This gallery is not active.</p>
      )}
      {displayGallery &&
        loading && 
          <div className="loader">LOADING ...</div>
      }
      {displayGallery && isPreviewOpen && <Preview image={images[previewIndex] } {...{previewIndex,setPreviewIndex,imagesLength:images.length,closePreview,projectId,collectionId}}/>}
    </div>
  );
};

export default ShareGallery;
