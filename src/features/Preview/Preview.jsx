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

function Preview({ image, previewIndex, setPreviewIndex, imagesLength, closePreview, projectId, collectionId }) {
  const { studioName } = useParams();
  const dispatch = useDispatch();
  
  const handleDelete = async () => {
    try {
      await dispatch(deleteFile({ studioName, projectId, collectionId, imageUrl: image.url, imageName: image.name }));
      const newIndex = previewIndex < imagesLength - 1 ? previewIndex + 1 : previewIndex - 1;
      newIndex >= 0 ? setPreviewIndex(newIndex) : closePreview();
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  return (
    <div className="preview-wrapper">
      <div className='preview' >
        <SwipeHandler 
          previewIndex={previewIndex}
          imagesLength={imagesLength}
          setPreviewIndex={setPreviewIndex}
        >
          <PreviewControls
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
