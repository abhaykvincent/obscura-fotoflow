import React, { useEffect, useState, useRef, useCallback } from 'react';
import './Preview.scss';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import ImageDisplay from './ImageDisplay';
import PreviewControls from './PreviewControls';
import PreviewBottomControls from './PreviewBottomControls';
import { deleteFile } from '../../app/slices/projectsSlice';

function Preview({ images, image, previewIndex, setPreviewIndex, imagesLength, closePreview, projectId, collectionId, isArchived }) {
  const { studioName } = useParams();
  const dispatch = useDispatch();
  
  // Preload adjacent images
  useEffect(() => {
    if (!images || images.length === 0) return;

    const preloadImage = (url) => {
      if (!url) return;
      const img = new Image();
      img.src = url;
    };

    // Preload next image
    if (previewIndex < images.length - 1) {
      preloadImage(images[previewIndex + 1].url);
    }
    // Preload previous image
    if (previewIndex > 0) {
      preloadImage(images[previewIndex - 1].url);
    }
    // Preload one more next for smoother browsing
    if (previewIndex < images.length - 2) {
      preloadImage(images[previewIndex + 2].url);
    }
  }, [previewIndex, images]);

  // Immersive Mode State
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef(null);
  
  // Direction for animation: 1 = right (next), -1 = left (prev)
  const [direction, setDirection] = useState(0);

  // Auto-hide controls logic
  const resetControlsTimeout = useCallback(() => {
    if (!showControls) return; // Don't show if hidden (click required to unlock)
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 30000000);
  }, [showControls]);

  const toggleControls = useCallback((e) => {
    // Prevent toggling if clicking on interactive elements
    if (e && (e.target.closest('button') || e.target.closest('.interactive'))) return;
    
    setShowControls(prev => !prev);
  }, []);

  // Handle timeout on show/hide
  useEffect(() => {
    if (showControls) {
      // Start/Reset timeout when shown
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 30000000);
    } else {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    }
  }, [showControls]);

  // Initial setup and cleanup
  useEffect(() => {
    const handleMouseMove = () => resetControlsTimeout();
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [resetControlsTimeout]);

  // Navigation handlers
  const paginate = useCallback((newDirection) => {
    setDirection(newDirection);
    const newIndex = previewIndex + newDirection;
    if (newIndex >= 0 && newIndex < imagesLength) {
      setPreviewIndex(newIndex);
    } else {
        // Bounce effect or close? For now, just stop.
        setDirection(0);
    }
  }, [previewIndex, imagesLength, setPreviewIndex]);

  const handleDelete = async () => {
    try {
      await dispatch(deleteFile({ studioName, projectId, collectionId, imageUrl: image.url, imageName: image.name }));
      // Logic to move to next image or close is handled by parent usually, 
      // but here we might need to adjust index if parent doesn't auto-update from store quickly enough
      // safely move to next or prev
      if (imagesLength > 1) {
         const newIndex = previewIndex === imagesLength - 1 ? previewIndex - 1 : previewIndex;
         setPreviewIndex(newIndex);
      } else {
        closePreview();
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        paginate(1);
      } else if (e.key === 'ArrowLeft') {
        paginate(-1);
      } else if (e.key === 'Escape') {
        closePreview();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [paginate, closePreview]);


  return (
    <motion.div 
      className="preview-wrapper"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className='preview'>
        <PreviewControls
          showControls={showControls}
          image={image}
          closePreview={closePreview}
          handleDelete={handleDelete}
          projectId={projectId}
          collectionId={collectionId}
          studioName={studioName}
          resetControlsTimeout={resetControlsTimeout}
          isArchived={isArchived}
        />

        <AnimatePresence>
            {showControls && (
                <>
                    {previewIndex > 0 && (
                        <motion.div 
                            className="nav-button prev interactive" 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            onClick={(e) => { e.stopPropagation(); paginate(-1); resetControlsTimeout(); }}
                        />
                    )}
                    {previewIndex < imagesLength - 1 && (
                        <motion.div 
                            className="nav-button next interactive"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                            onClick={(e) => { e.stopPropagation(); paginate(1); resetControlsTimeout(); }}
                        />
                    )}
                </>
            )}
        </AnimatePresence>

        <div className="image-container" onClick={toggleControls}>
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <ImageDisplay
              key={image.url} // Key change triggers animation
              image={image}
              direction={direction}
              paginate={paginate}
              closePreview={closePreview}
              collectionId={collectionId}
              resetControlsTimeout={resetControlsTimeout}
              isControlsVisible={showControls}
            />
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export default Preview;
