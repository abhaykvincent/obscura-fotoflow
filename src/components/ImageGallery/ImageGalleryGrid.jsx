import React, { useEffect, useMemo, useRef, useState } from 'react';
import Preview from '../../features/Preview/Preview';
import { shortenFileName } from '../../utils/stringUtils';

const ImageGalleryGrid = React.memo(({ projectId,collectionId, imageUrls }) => {

  // Preview
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const containerRef = useRef(null);
  const openPreview = (index) => {
    setIsPreviewOpen(true);
    setPreviewIndex(index);
  };
  const closePreview = () => {
    setIsPreviewOpen(false)
  }
  // Hide header, sidebar on Image Preview 
  useEffect(() => {
    if (isPreviewOpen) {
      document.getElementsByClassName('header')[0].style.display = 'none';
      document.getElementsByClassName('sidebar')[0].style.display = 'none';
      document.getElementsByClassName('project-info')[0].style.display = 'none';
      // lock scroll
      document.body.style.overflow = 'hidden';
    } else {
      document.getElementsByClassName('header')[0].style.display = 'grid';
      document.getElementsByClassName('sidebar')[0].style.display = 'block';
      document.getElementsByClassName('project-info')[0].style.display = 'grid';
      // unlock scroll
      document.body.style.overflow = 'auto';
    }
  }, [isPreviewOpen]);
  
  useEffect(() => {

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
  useEffect(() => {
    function updateDisplayStyles() {
      document.getElementsByClassName('header')[0].style.display = 'grid';
      document.getElementsByClassName('sidebar')[0].style.display = 'block';
      //document.getElementsByClassName('project-info')[0].style.display = 'grid';
      // unlock scroll
      document.body.style.overflow = 'auto';
    }
    window.addEventListener('popstate', function() {
      updateDisplayStyles();
    });
  }, []);

  return (
    <>
      {isPreviewOpen && <Preview image={imageUrls[previewIndex] } {...{previewIndex,setPreviewIndex,imagesLength:imageUrls.length,closePreview,projectId,collectionId}}/>}
    
      <div className="gallary">
        <div className="photos" ref={containerRef}>
          {imageUrls.map((fileUrl, index) => (
            <div className="photo-wrap"
            key={fileUrl.url}
              onClick={()=>openPreview(index)}>
              <div className="hover-options-wrap">
                <div className="hover-options">
                  {
                    fileUrl.status&&
                    <div className="favorite-wrap">
                      <div className={`favorite ${fileUrl?.status==='selected'? 'selected' : ''}`}>
                        <div className="icon"></div>
                      </div>
                    </div>
                  }
                  <div className="top">
                    <div className="menu-icon"></div>
                    <div className="option-menu">
                      <div className="photo-option">Download</div>
                      <div className="photo-option">Share</div>
                      <div className="photo-option">Set as cover</div>
                      <div className="photo-option">Delete</div>
                    </div>
                  </div>
                  <div className="bottom">
                      <div className="filename">
                        {
                          shortenFileName(fileUrl.name)
                        }
                      </div>

                  </div>
                </div>
              </div>
              <div className='photo' key={index} 
                style={{ backgroundImage: `url("${fileUrl.url}")` }} alt={`File ${index}`}>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
});

export default ImageGalleryGrid;
// Line Complexity  0.8 -> 