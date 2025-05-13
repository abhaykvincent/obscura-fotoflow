import React, { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectDomain, selectUserStudio } from '../../app/slices/authSlice';
import { selectStudio, selectStudioStorageUsage } from '../../app/slices/studioSlice';
import { showAlert } from '../../app/slices/alertSlice';
import { openModal } from '../../app/slices/modalSlice';

import { handleUpload } from '../../utils/uploadOperations';
import { addAllFileSizesToMB, validateFileTypes } from '../../utils/fileUtils';
import { createNotification } from '../../app/slices/notificationSlice';
import { fetchProjects } from '../../app/slices/projectsSlice';
import { fetchProject } from '../../firebase/functions/firestore';

function UploadButton({ isPhotosImported, setIsPhotosImported, setImageUrls, id, collectionId, setUploadLists, setUploadStatus }) {
  const dispatch = useDispatch();
  const domain = useSelector(selectDomain);
  const storageLimit = useSelector(selectStudioStorageUsage);
  const studiodata = useSelector(selectStudio);
  const currentStudio = useSelector(selectUserStudio);
  const handleFileInputChange = useCallback(async (event) => {
    const selectedFiles = Array.from(event.target.files);
    const importFileSize = addAllFileSizesToMB(selectedFiles);

    // Validate file types
    if (!validateFileTypes(selectedFiles)) 
    {
      dispatch(showAlert({ type: 'error', message: 'Currently, only .jpg, .jpeg, and .png. More to come!' }));
      return; // Exit if files are not valid
    }
    setIsPhotosImported(true);
    
    // If Space Available
    // Upload files and update storage usage
    if (importFileSize < (storageLimit?.quota -  storageLimit?.used) ) {
      try {
        const startTime = Date.now();  // Record the start time
        setUploadStatus('open');

        // Handle upload Operation
        const resp = await handleUpload(domain, selectedFiles, id, collectionId, importFileSize, setUploadLists, setUploadStatus);

        const endTime = Date.now();  // Record the end time
        const duration = (endTime - startTime) / 1000;  // Calculate duration in seconds
        console.log(`%c Upload Session Duration : ${duration} seconds`, 'color:#32adf0');
            
        const uploadedImages = resp.uploadedFiles
        const galleryPIN = resp.pin

        setImageUrls(prevUrls => [...prevUrls, ...uploadedImages]);
        
        const dispatchNotification = () => {
          dispatch(
            createNotification({
              studioId: currentStudio.domain, // Replace with the appropriate project or studio ID
              notificationData: {
                title: '', // Updated title
                message: `${uploadedImages.length }new photos uploaded`, // Updated message
                type: 'project', // Changed type to 'project'
                actionLink: '/projects', // Updated action link to navigate to projects
                priority: 'normal',
                isRead: false,
                metadata: {
                  createdAt: new Date().toISOString(),
                  eventType: 'project_created', // Updated event type
                  createdBy: 'system', // Added creator's email
                  projectName: 'Project Name', // Add the project name if available
                  authMethod: 'google', // Optional: Include if relevant
                },
              },
            })
          );
          };
          dispatchNotification()

          console.log(domain)
        setTimeout(() => {
          dispatch(openModal('shareGallery'))
        }, 1000);
        

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
      <label htmlFor="fileInput" 
      className={`button icon upload publishing ${isPhotosImported ? 'secondary' : 'primary'}`}>
        Upload
      </label>
      <input id="fileInput" type="file" multiple onChange={handleFileInputChange} />
    </>
  );
}

export default UploadButton;
