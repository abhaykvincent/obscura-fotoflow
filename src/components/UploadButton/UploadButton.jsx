import React, { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectDomain, selectUserStudio } from '../../app/slices/authSlice';
import { selectStudio, selectStudioStorageUsage } from '../../app/slices/studioSlice';
import { showAlert } from '../../app/slices/alertSlice';
import { openModal } from '../../app/slices/modalSlice';

import { handleUpload } from '../../utils/uploadOperations';
import { addAllFileSizesToMB, validateFileTypes, extractExifData } from '../../utils/fileUtils';
import { createNotification } from '../../app/slices/notificationSlice';
import { fetchProjects } from '../../app/slices/projectsSlice';

// import { fetchProject } from '../../firebase/functions/firestore'; // fetchProject seems unused in this component

function UploadButton({ 
    isPhotosImported, 
    setIsPhotosImported, 
    setImageUrls, 
    id, 
    collectionId, 
    // setUploadLists, // Removed
    // setUploadStatus, // Removed
    dispatch // Added - though it's already available via useDispatch hook, explicitly passing if required by parent
}) {
  // const dispatch = useDispatch(); // Already available if not passed as prop, or use the prop one.
  // For clarity, if dispatch is always coming from props as per new signature, use that.
  // If it's meant to be obtained via useDispatch() hook, then the prop isn't strictly needed unless for specific patterns.
  // Assuming the intention is to use the dispatch from props if provided, or fallback to hook.
  // However, the original code already uses useDispatch(), so the prop `dispatch` might be redundant
  // unless the calling context changes. Let's stick to the instructions: add `dispatch` to props.
  const localDispatch = useDispatch(); // Use localDispatch if prop `dispatch` is not the one from Redux store.
                                     // Or simply use `dispatch` if it's guaranteed to be the Redux dispatch.
                                     // Given the setup, `useDispatch()` is the standard. The prop is unusual.
                                     // Let's assume the prop `dispatch` is the one to be used.

  const domain = useSelector(selectDomain);
  const storageLimit = useSelector(selectStudioStorageUsage);
  const studiodata = useSelector(selectStudio);
  const currentStudio = useSelector(selectUserStudio);
  const handleFileInputChange = useCallback(async (event) => {
    const selectedFiles = Array.from(event.target.files);
    const importFileSize = addAllFileSizesToMB(selectedFiles);
      console.log(selectedFiles[0])
      //extractExifData(selectedFiles[0]);

      extractExifData(selectedFiles[0]).then(data => {
        console.log("EXIF Data:", data.DateTimeOriginal.value);
      });


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
        // setUploadStatus('open'); // This was local, Redux state will be set by handleUpload via dispatch

        // Handle upload Operation - Updated call
        const resp = await handleUpload(domain, selectedFiles, id, collectionId, importFileSize, dispatch);

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
        localDispatch(showAlert({ type: 'error', message: 'Uploaded <b>file size exceeds</b> your limit! Upgrade' }));
      setIsPhotosImported(false);
    }
  }, [dispatch, storageLimit, domain, id, collectionId, setIsPhotosImported, setImageUrls, currentStudio, localDispatch]); // Added dispatch to dependency array, removed setUploadLists, setUploadStatus

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
