import React, { useState, useEffect, useCallback, useRef } from 'react';
import Preview from '../../features/Preview/Preview';
import { getThumbnailUrl } from '../../utils/urlUtils';
import { trackEvent } from '../../analytics/utils';
import { fetchCollectionStatus } from '../../firebase/functions/firestore';
import SectionRenderer from './SectionRenderer';

const ShareGallery = ({ images = [], sections = null, projectId, collectionId, domain }) => {
  const [size, setSize] = useState(12);
  const [loadedImages, setLoadedImages] = useState(images.slice(0, size));
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [displayGallery, setDisplayGallery] = useState(false);
  //Preview
  const [isPreviewOpen,setIsPreviewOpen] = useState(false);
  const [previewIndex,setPreviewIndex] = useState(0);
  const containerRef = useRef(null);
  
  const openPreview = (image, indexInSection) => {
    // If we have sections, 'images' prop might not be the full source of truth for all sections combined.
    // But if we are in legacy mode (using 'images' prop), we can find the index.
    // If using sections, we might need a different strategy, but for now let's support the 'images' prop case fully.
    
    let globalIndex = -1;
    
    // Attempt to find the image in the global 'images' list
    // 'image' here is the object returned from ImageGrid, which might have a modified 'url' (thumbnail)
    // We compare with originalUrl or url.
    if (image.originalUrl) {
        globalIndex = images.findIndex(img => img.url === image.originalUrl);
    } else {
        globalIndex = images.findIndex(img => img.url === image.url);
    }

    if (globalIndex !== -1) {
        setPreviewIndex(globalIndex);
    } else {
        // Fallback or for sections based logic if 'images' is not populated with everything
        // For now, defaulting to 0 or handling gracefully
        setPreviewIndex(0);
    }
    
    setIsPreviewOpen(true)
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
        if (status === 'visible' || status === 'active') {
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
    // console.log(previewIndex)

    const scrollToImage = () => {
       // Scroll behavior implementation might need adjustment with SectionRenderer
       // As we don't have direct refs to images easily.
       // Skipping auto-scroll to image on preview close/change for now if ref is missing
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

  // Prepare content
  let content = null;
  if (sections && sections.length > 0) {
      content = sections.map((section, idx) => (
          <SectionRenderer key={section.id || idx} section={section} onImageClick={openPreview} />
      ));
  } else {
      // Legacy/Default mode: use images prop
      // Transform loadedImages to match ImageGrid expectations (url handling)
      const gridImages = loadedImages.map(file => ({
          ...file,
          url: file?.thumbAvailable ? getThumbnailUrl(file.url, collectionId) : file.url,
          originalUrl: file.url, // Keep track of original for preview mapping
          // Ensure dimensions are present or defaults? ImageGrid handles check.
      }));
      
      const syntheticSection = {
          id: 'main-gallery-grid',
          type: 'image-grid',
          images: gridImages,
          gridSettings: { scale: 1 } // Default settings
      };
      
      content = (
        <>
            <SectionRenderer section={syntheticSection} onImageClick={openPreview} />
             {/* Sentinel for infinite scroll */}
             <div ref={lastPhotoElementRef} style={{ height: '20px', width: '100%' }}></div>
        </>
      );
  }


  return (
    <div className="gallary">
      {displayGallery ? (
        <div className="photos" ref={containerRef}>
          {content}
        </div>
      ) : (
        <p>This gallery is not active.</p>
      )}
      {displayGallery &&
        loading && 
          <div className="loader">LOADING ...</div>
      }
      {displayGallery && isPreviewOpen && <Preview images={images} image={images[previewIndex] } {...{previewIndex,setPreviewIndex,imagesLength:images.length,closePreview,projectId,collectionId}}/>}
    </div>
  );
};

export default ShareGallery;
