import React, { useState, useCallback } from 'react';
import { addAllFileSizesToMB, validateFileTypes } from '../../utils/fileUtils';
import { handleUpload } from '../../utils/uploadOperations';
import { useDispatch, useSelector } from 'react-redux';
import { selectDomain, selectStorageLimit } from '../../app/slices/authSlice';
import { showAlert } from '../../app/slices/alertSlice';
import { fetchProject } from '../../firebase/functions/firestore';
import { fetchProjects } from '../../app/slices/projectsSlice';
import { selectStudioStorageUsage } from '../../app/slices/studioSlice';

function UploadButton({ isPhotosImported, setIsPhotosImported, imageUrls, setImageUrls, id, collectionId, setUploadLists, setUploadStatus }) {
  const dispatch = useDispatch();

  const storageLimit = useSelector(selectStudioStorageUsage);
  const domain = useSelector(selectDomain);

  const handleFileInputChange = useCallback(async (event) => {
    const selectedFiles = Array.from(event.target.files);
    // Validate file types
    if (!validateFileTypes(selectedFiles)) 
    {
      dispatch(showAlert({ type: 'error', message: 'Currently, only .jpg, .jpeg, and .png. More to come!' }));
      return; // Exit if files are not valid
    }
    setIsPhotosImported(true);
    
    const importFileSize = addAllFileSizesToMB(selectedFiles);
    // Check file size against available storage
    console.log(storageLimit.quota ,storageLimit.used, storageLimit.quota -  storageLimit.used)
    console.log(importFileSize < (storageLimit.quota -  storageLimit.used ))
    if (importFileSize < (storageLimit.quota -  storageLimit.used ) ) {
      try {
        const startTime = Date.now();  // Record the start time

        setUploadStatus('open');
        const resp = await handleUpload(domain, selectedFiles, id, collectionId, importFileSize, setUploadLists, setUploadStatus);

        const endTime = Date.now();  // Record the end time
            const duration = (endTime - startTime) / 1000;  // Calculate duration in seconds
            console.log(`%c Upload Session Duration : ${duration} seconds`, 'color:#32adf0');
            
        const uploadedImages = resp.uploadedFiles
        const galleryPIN = resp.pin
        setImageUrls(prevUrls => [...prevUrls, ...uploadedImages]);

      } catch (error) {
        dispatch(showAlert({ type: 'error', message: 'Upload failed, please try again!' }));
      } finally {
        dispatch(showAlert({ type: 'success', message: 'Upload Complete' }));
        setIsPhotosImported(false);
      }
    } 
    else {
      dispatch(showAlert({ type: 'error', message: 'Uploaded <b>file size exceeds</b> your limit! Upgrade' }));
      setIsPhotosImported(false);
    }
  }, [dispatch, storageLimit, domain, id, collectionId, setUploadLists, setUploadStatus, setIsPhotosImported, setImageUrls]);

  return (
    <>
      <label htmlFor="fileInput" className={`button icon upload publishing ${isPhotosImported ? 'secondary' : 'primary'}`}>
        Upload
      </label>
      <input id="fileInput" type="file" multiple onChange={handleFileInputChange} />
    </>
  );
}

export default UploadButton;
