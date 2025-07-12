import React, { useEffect, useState, useRef, useCallback } from 'react';
import './Preview.scss';
import { shortenFileName } from '../../utils/stringUtils';
import { setCoverPhotoInFirestore, setGalleryCoverPhotoInFirestore } from '../../firebase/functions/firestore';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router';
import ImageDisplay from './ImageDisplay';
import SwipeHandler from './SwipeHandler';
import { deleteFile } from '../../app/slices/projectsSlice';
import PreviewControls from './PreviewControls';

function Preview({ image, previewIndex, setPreviewIndex: setParentPreviewIndex, imagesLength, closePreview, projectId, collectionId }) {
  const { studioName } = useParams();
  const dispatch = useDispatch();
  const [showControls, setShowControls] = useState(true);
  const [showSwipeGuide, setShowSwipeGuide] = useState(true);
  const [currentImage, setCurrentImage] = useState(image);
  const [nextImage, setNextImage] = useState(null);
  const [direction, setDirection] = useState(null); // 'left' or 'right' for animation

  const animationTimeoutRef = useRef(null);
  let hideControlsTimeout;

  const handleUserInteraction = () => {
    setShowControls(true);
    clearTimeout(hideControlsTimeout);
    hideControlsTimeout = setTimeout(() => setShowControls(false), 3000);
  };

  const setPreviewIndex = useCallback((newIndex, animDirection) => {
    if (newIndex === previewIndex) return;

    setDirection(animDirection);
    setNextImage(image); // The current `image` prop is the one we're moving *from*

    // Clear any existing animation timeout
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }

    // Start the animation, then update the current image after it completes
    animationTimeoutRef.current = setTimeout(() => {
      setParentPreviewIndex(newIndex); // This will cause the `image` prop to update
      setDirection(null);
      setNextImage(null);
    }, 300); // Match this duration to your CSS animation duration
  }, [previewIndex, image, setParentPreviewIndex]);

  useEffect(() => {
    // When the `image` prop changes (meaning setParentPreviewIndex was called),
    // update the currentImage state.
    setCurrentImage(image);
  }, [image]);

  const handleDelete = async () => {
    try {
      await dispatch(deleteFile({ studioName, projectId, collectionId, imageUrl: image.url, imageName: image.name }));
      const newIndex = previewIndex < imagesLength - 1 ? previewIndex + 1 : previewIndex - 1;
      newIndex >= 0 ? setPreviewIndex(newIndex) : closePreview();
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleUserInteraction);
    window.addEventListener('touchstart', handleUserInteraction);
    handleUserInteraction();
    return () => {
      clearTimeout(hideControlsTimeout);
      window.removeEventListener('mousemove', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
    };
  }, []);

  // Hide swipe guide after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowSwipeGuide(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="preview-wrapper">
      {showSwipeGuide && (
        <div className="guide swipe-guide">
          <div className="swipe-animation-wrapper">
            <div className="swipe-animation"></div>
          </div>
        </div>
      )}
      <div className='preview' >
        <SwipeHandler 
          previewIndex={previewIndex}
          imagesLength={imagesLength}
          setPreviewIndex={setPreviewIndex}
          setShowControls={setShowControls}
          showControls={showControls}
          handleUserInteraction={handleUserInteraction}
        >
          <PreviewControls
            showControls={showControls}
            image={image}
            closePreview={closePreview}
            handleDelete={handleDelete}
            projectId={projectId}
            collectionId={collectionId}
            studioName={studioName}
          />
          <ImageDisplay
            currentImage={currentImage}
            nextImage={nextImage}
            direction={direction}
          />
        </SwipeHandler>
      </div>
    </div>
  );
}

export default Preview;
