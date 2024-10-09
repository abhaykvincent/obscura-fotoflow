import React, { useState, useCallback } from 'react';
import { addAllFileSizesToMB, validateFileTypes } from '../../utils/fileUtils';
import { handleUpload } from '../../utils/uploadOperations';
import { useDispatch, useSelector } from 'react-redux';
import { selectDomain, selectStorageLimit } from '../../app/slices/authSlice';
import { showAlert } from '../../app/slices/alertSlice';

function UploadButton({ isPhotosImported, setIsPhotosImported, imageUrls, setImageUrls, id, collectionId, setUploadLists, setUploadStatus }) {
  const dispatch = useDispatch();
  const storageLimit = useSelector(selectStorageLimit);
  const domain = useSelector(selectDomain);

  const handleFileInputChange = useCallback(async (event) => {
    const selectedFiles = Array.from(event.target.files);

    // Validate file types
    if (!validateFileTypes(selectedFiles)) {
      dispatch(showAlert({ type: 'error', message: 'Currently, only .jpg, .jpeg, and .png. More to come!' }));
      return; // Exit if files are not valid
    }

    setIsPhotosImported(true);
    
    const importFileSize = addAllFileSizesToMB(selectedFiles);
    console.log({ importFileSize, available: storageLimit.available, limit: storageLimit.total });

    // Check file size against available storage
    if (importFileSize < storageLimit.available) {
      try {
        setUploadStatus('open');
        const uploadedImages = await handleUpload(domain, selectedFiles, id, collectionId, importFileSize, setUploadLists, setUploadStatus);
        setImageUrls(prevUrls => [...prevUrls, ...uploadedImages]);
      } catch (error) {
        dispatch(showAlert({ type: 'error', message: 'Upload failed, please try again!' }));
      } finally {
        setIsPhotosImported(false);
      }
    } else {
      dispatch(showAlert({ type: 'error', message: 'Uploaded <b>file size exceeds</b> your limit! Upgrade' }));
      setIsPhotosImported(false);
    }
  }, [dispatch, storageLimit, domain, id, collectionId, setUploadLists, setUploadStatus, setIsPhotosImported, setImageUrls]);

  return (
    <>
      <label htmlFor="fileInput" className={`button icon upload ${isPhotosImported ? 'secondary' : 'primary'}`}>
        Upload
      </label>
      <input id="fileInput" type="file" multiple onChange={handleFileInputChange} />
    </>
  );
}

export default UploadButton;
