import React, { useEffect, useRef, useState } from 'react';
import Preview from '../../features/Preview/Preview';
import { shortenFileName } from '../../utils/stringUtils';
import { downloadImage } from '../ImageDownload/ImageDownload';

// Extracted component for a single photo item in the grid.
// This encapsulates the photo's display logic and its own state, like the options menu.
const PhotoItem = React.memo(({ fileUrl, index, onImageClick }) => {
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  const handleMenuIconClick = (e) => {
    e.stopPropagation(); // Prevent the onImageClick handler of the parent from firing.
    setShowOptionsMenu(prev => !prev);
  };

  const handleDownload = (e) => {
    e.stopPropagation();
    downloadImage(fileUrl.url, fileUrl.name);
    setShowOptionsMenu(false); // Close menu after action
  };

  return (
    <div className="photo-wrap" onClick={() => onImageClick(index)}>
      <div className="hover-options-wrap">
        <div className="hover-options">
          {fileUrl.status && (
            <div className="favorite-wrap">
              <div className={`favorite ${fileUrl?.status === 'selected' ? 'selected' : ''}`}>
                <div className="icon"></div>
              </div>
            </div>
          )}
          <div className="top">
            <div className="menu-icon" onClick={handleMenuIconClick}></div>
            <div className={`option-menu ${showOptionsMenu ? 'visible' : ''}`} onClick={(e) => e.stopPropagation()}>
              <div className="photo-option" onClick={handleDownload}>Download</div>
              <div className="photo-option">Share</div>
              <div className="photo-option">Set as cover</div>
              <div className="photo-option">Delete</div>
            </div>
          </div>
          <div className="bottom">
            <div className="filename">{shortenFileName(fileUrl.name)}</div>
          </div>
        </div>
      </div>
      <div
        className='photo'
        style={{ backgroundImage: `url("${fileUrl.url}")` }}
        alt={`File ${index}`}
      ></div>
    </div>
  );
});

const ImageGalleryGrid = React.memo(({ projectId, collectionId, imageUrls }) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const containerRef = useRef(null);

  const openPreview = (index) => {
    setPreviewIndex(index);
    setIsPreviewOpen(true);
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
  };

  // Effect to toggle UI elements' visibility when preview opens/closes.
  // Note: Direct DOM manipulation is an anti-pattern in React. A better approach
  // is to use a global state (e.g., Redux or Context) to let components like
  // Header and Sidebar manage their own visibility based on a shared state.
  useEffect(() => {
    const header = document.querySelector('.header');
    const sidebar = document.querySelector('.sidebar');
    const projectInfo = document.querySelector('.project-info');

    if (isPreviewOpen) {
      if (header) header.style.display = 'none';
      if (sidebar) sidebar.style.display = 'none';
      if (projectInfo) projectInfo.style.display = 'none';
      document.body.style.overflow = 'hidden';
    } else {
      if (header) header.style.display = 'grid';
      if (sidebar) sidebar.style.display = 'block';
      if (projectInfo) projectInfo.style.display = 'grid';
      document.body.style.overflow = 'auto';
    }
  }, [isPreviewOpen]);

  // Effect to scroll the active image into view in the background grid
  // as the user navigates through the preview.
  useEffect(() => {
    const scrollToImage = () => {
      const targetImage = containerRef.current?.querySelector(`[alt="File ${previewIndex}"]`);
      if (targetImage) {
        targetImage.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest',
        });
      }
    };
    scrollToImage();
  }, [previewIndex]);

  // Effect to restore UI when using browser back/forward buttons.
  useEffect(() => {
    const updateDisplayStyles = () => {
      const header = document.querySelector('.header');
      const sidebar = document.querySelector('.sidebar');
      if (header) header.style.display = 'grid';
      if (sidebar) sidebar.style.display = 'block';
      document.body.style.overflow = 'auto';
    };

    window.addEventListener('popstate', updateDisplayStyles);

    // Cleanup the event listener on component unmount to prevent memory leaks.
    return () => {
      window.removeEventListener('popstate', updateDisplayStyles);
    };
  }, []);

  return (
    <>
      {isPreviewOpen && (
        <Preview
          image={imageUrls[previewIndex]}
          previewIndex={previewIndex}
          setPreviewIndex={setPreviewIndex}
          imagesLength={imageUrls.length}
          closePreview={closePreview}
          projectId={projectId}
          collectionId={collectionId}
        />
      )}

      <div className="gallary">
        <div className="photos" ref={containerRef}>
          {imageUrls.map((fileUrl, index) => (
            <PhotoItem
              key={fileUrl.url}
              fileUrl={fileUrl}
              index={index}
              onImageClick={openPreview}
            />
          ))}
        </div>
      </div>
    </>
  );
});

export default ImageGalleryGrid;

// Line Complexity  0.8 -> 