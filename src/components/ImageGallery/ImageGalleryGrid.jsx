import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import Preview from '../../features/Preview/Preview';
import { shortenFileName } from '../../utils/stringUtils';
import { downloadImage } from '../ImageDownload/ImageDownload';
import { showAlert } from '../../app/slices/alertSlice';
import { deleteFile, toggleFileFavorite } from '../../app/slices/projectsSlice';
import { setCoverPhotoInFirestore, setGalleryCoverPhotoInFirestore } from '../../firebase/functions/firestore';
import { getThumbnailUrl } from '../../utils/urlUtils';

// Extracted component for a single photo item in the grid.
// This encapsulates the photo's display logic and its own state, like the options menu.
const PhotoItem = React.memo(({ fileUrl, index, onImageClick, isArchived, projectId, collectionId }) => {
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const dispatch = useDispatch();
  const { studioName } = useParams();

  const handleMenuIconClick = (e) => {
    e.stopPropagation(); // Prevent the onImageClick handler of the parent from firing.
    setShowOptionsMenu(prev => !prev);
  };

  const handleDownload = (e) => {
    e.stopPropagation();
    if (isArchived) {
      dispatch(showAlert({ type: 'error', message: 'Project is archived. Restore it to download original files.' }));
      return;
    }
    downloadImage(fileUrl.url, fileUrl.name);
    setShowOptionsMenu(false); // Close menu after action
  };

  const handleFavoriteToggle = (e) => {
    e.stopPropagation();
    dispatch(toggleFileFavorite({ studioName, projectId, collectionId, imageUrl: fileUrl.url }));
  };

  const handleShare = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(fileUrl.url);
    dispatch(showAlert({ type: 'success', message: 'Image URL copied to clipboard!' }));
    setShowOptionsMenu(false);
  };

  const handleSetProjectCover = async (e) => {
    e.stopPropagation();
    try {
      await setCoverPhotoInFirestore(studioName, projectId, fileUrl.url);
      dispatch(showAlert({ type: 'success', message: 'Set as project cover!' }));
    } catch (error) {
      dispatch(showAlert({ type: 'error', message: 'Failed to set project cover.' }));
    }
    setShowOptionsMenu(false);
  };

  const handleSetGalleryCover = async (e) => {
    e.stopPropagation();
    try {
      await setGalleryCoverPhotoInFirestore(studioName, projectId, collectionId, fileUrl.url);
      dispatch(showAlert({ type: 'success', message: 'Set as gallery cover!' }));
    } catch (error) {
      dispatch(showAlert({ type: 'error', message: 'Failed to set gallery cover.' }));
    }
    setShowOptionsMenu(false);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this photo?')) {
      dispatch(deleteFile({ studioName, projectId, collectionId, imageUrl: fileUrl.url, imageName: fileUrl.name }));
    }
    setShowOptionsMenu(false);
  };

  return (
    <div className="photo-wrap" onClick={() => onImageClick(index)}>
      <div className="hover-options-wrap">
        <div className="hover-options">
          <div className="favorite-wrap" onClick={handleFavoriteToggle}>
            <div className={`favorite ${fileUrl?.status === 'selected' ? 'selected' : ''}`}>
              <div className="icon"></div>
            </div>
          </div>
          <div className="top">
            <div className="menu-icon" onClick={handleMenuIconClick}></div>
            <div className={`option-menu ${showOptionsMenu ? 'visible' : ''}`} onClick={(e) => e.stopPropagation()}>
              <div className="photo-option" onClick={handleDownload}>Download</div>
              <div className="photo-option" onClick={handleShare}>Share</div>
              <div className="photo-option" onClick={handleSetProjectCover}>Set as project cover</div>
              <div className="photo-option" onClick={handleSetGalleryCover}>Set as gallery cover</div>
              <div className="photo-option delete-option" onClick={handleDelete}>Delete</div>
            </div>
          </div>
          <div className="bottom">
            <div className="filename">{shortenFileName(fileUrl.name)}</div>
          </div>
        </div>
      </div>
      <div
        className='photo'
        style={{ backgroundImage: `url("${getThumbnailUrl(fileUrl.url)}")` }}
        alt={`File ${index}`}
      ></div>
    </div>
  );
});

const ImageGalleryGrid = React.memo(({ projectId, collectionId, imageUrls, project }) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const containerRef = useRef(null);

  const isArchived = project?.storage?.status === 'archive';

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
      if (sidebar) sidebar.style.display = 'flex';
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
          images={imageUrls}
          image={imageUrls[previewIndex]}
          previewIndex={previewIndex}
          setPreviewIndex={setPreviewIndex}
          imagesLength={imageUrls.length}
          closePreview={closePreview}
          projectId={projectId}
          collectionId={collectionId}
          isArchived={isArchived}
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
              isArchived={isArchived}
              projectId={projectId}
              collectionId={collectionId}
            />
          ))}
        </div>
      </div>
    </>
  );
});

export default ImageGalleryGrid;

// Line Complexity  0.8 -> 