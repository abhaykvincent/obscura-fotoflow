import React, { useState, useEffect, useCallback } from 'react';
import './Preview.scss';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import ImageDisplay from './ImageDisplay';
import PreviewControls from './PreviewControls';
import PreviewBottomControls from './PreviewBottomControls';
import { deleteFile } from '../../app/slices/projectsSlice';

// Custom Hooks
import { useImagePreloader } from './hooks/useImagePreloader';
import { useImmersiveMode } from './hooks/useImmersiveMode';
import { usePreviewNavigation } from './hooks/usePreviewNavigation';

const AUTO_HIDE_TIMEOUT = 3000; // 3 seconds for immersive mode

function Preview({ 
  images, 
  image, 
  previewIndex, 
  setPreviewIndex, 
  imagesLength, 
  closePreview, 
  projectId, 
  collectionId, 
  isArchived 
}) {
  const { studioName } = useParams();
  const dispatch = useDispatch();
  const [isCurrentLoaded, setIsCurrentLoaded] = useState(false);

  // 1. Preload adjacent images for performance, but only after current is ready
  useImagePreloader(images, previewIndex, isCurrentLoaded);

  // Reset loading state when image changes
  useEffect(() => {
    setIsCurrentLoaded(false);
  }, [image.url]);

  // 2. Manage immersive mode (auto-hide controls)
  const { 
    showControls, 
    toggleControls, 
    resetControlsTimeout 
  } = useImmersiveMode(true, AUTO_HIDE_TIMEOUT);

  // 3. Handle navigation and keyboard shortcuts
  const { direction, paginate } = usePreviewNavigation(
    previewIndex, 
    imagesLength, 
    setPreviewIndex, 
    closePreview
  );

  /**
   * Handles image deletion and updates the preview index.
   */
  const handleDelete = async () => {
    try {
      const deletePayload = { 
        studioName, 
        projectId, 
        collectionId, 
        imageUrl: image.url, 
        imageName: image.name 
      };
      
      await dispatch(deleteFile(deletePayload));
      
      if (imagesLength > 1) {
        // Move to the previous image if deleting the last one, else stay at same index (which is now next image)
        const isLastImage = previewIndex === imagesLength - 1;
        const newIndex = isLastImage ? previewIndex - 1 : previewIndex;
        setPreviewIndex(newIndex);
      } else {
        closePreview();
      }
    } catch (error) {
      console.error('[Preview] Error deleting file:', error);
    }
  };

  return (
    <motion.div 
      className="preview-wrapper"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="preview">
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
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    paginate(-1); 
                    resetControlsTimeout(); 
                  }}
                />
              )}
              {previewIndex < imagesLength - 1 && (
                <motion.div 
                  className="nav-button next interactive"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    paginate(1); 
                    resetControlsTimeout(); 
                  }}
                />
              )}
            </>
          )}
        </AnimatePresence>

        <div className="image-container" onClick={toggleControls}>
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <ImageDisplay
              key={image.url}
              image={image}
              direction={direction}
              paginate={paginate}
              closePreview={closePreview}
              collectionId={collectionId}
              resetControlsTimeout={resetControlsTimeout}
              isControlsVisible={showControls}
              onCurrentLoad={() => setIsCurrentLoaded(true)}
            />
          </AnimatePresence>
        </div>

        <PreviewBottomControls
          showControls={showControls}
          image={image}
          projectId={projectId}
          collectionId={collectionId}
          studioName={studioName}
          resetControlsTimeout={resetControlsTimeout}
        />
      </div>
    </motion.div>
  );
}

export default Preview;


