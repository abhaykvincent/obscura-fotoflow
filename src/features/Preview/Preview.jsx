// Preview.jsx
import React, { useEffect, useState, useCallback } from 'react';
import './Preview.scss';
import { shortenFileName } from '../../utils/stringUtils';
import { setCoverPhotoInFirestore, setGalleryCoverPhotoInFirestore } from '../../firebase/functions/firestore';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router';
import ImageDisplay from './ImageDisplay';
import SwipeHandler from './SwipeHandler';
import { deleteFile } from '../../app/slices/projectsSlice';
import PreviewControls from './PreviewControls';

function Preview({ image, previewIndex, setPreviewIndex, imagesLength, closePreview,projectId, collectionId }) {
  const { studioName } = useParams();
  const dispatch = useDispatch();
  // States for managing controls visibility and interaction timeout
  const [showControls, setShowControls] = useState(true);
  let hideControlsTimeout;

  // Function to show controls and reset hide timer
  const handleUserInteraction = () => {
    setShowControls(true);  // Show controls on interaction
    clearTimeout(hideControlsTimeout);  // Reset timer if it exists
    hideControlsTimeout = setTimeout(() => setShowControls(false), 3000); // Hide after 3s
  };
  
  const handleDelete = async () => {
    try {
      await dispatch(deleteFile({ studioName, projectId, collectionId, imageUrl: image.url, imageName: image.name }));
      const newIndex = previewIndex < imagesLength - 1 ? previewIndex + 1 : previewIndex - 1;
      newIndex >= 0 ? setPreviewIndex(newIndex) : closePreview();
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };


  // Attach event listeners to reset timer on touch or click
  useEffect(() => {
    window.addEventListener('mousemove', handleUserInteraction);
    window.addEventListener('touchstart', handleUserInteraction);
    handleUserInteraction(); // Start with showing controls
    return () => {
      clearTimeout(hideControlsTimeout);
      window.removeEventListener('mousemove', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
    };
  }, []);

  return (
    <div className="preview-wrapper">
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
          <ImageDisplay image={image} />
        </SwipeHandler>
      </div>
    </div>
  );
}

export default Preview;
