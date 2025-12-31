import React, { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectDomain, selectUserStudio } from '../../app/slices/authSlice';
import { selectStudio, selectStudioStorageUsage } from '../../app/slices/studioSlice';
import { showAlert } from '../../app/slices/alertSlice';
import { openModal } from '../../app/slices/modalSlice';

import { handleUpload } from '../../utils/uploadOperations';
import { addAllFileSizesToMB, validateFileTypes, extractExifData } from '../../utils/fileUtils';
import { createNotification } from '../../app/slices/notificationSlice';
import { fetchProjects, updateCollectionStatus } from '../../app/slices/projectsSlice';
import { addUploadedFilesToFirestore, addUploadCompletionEventToFirestore } from '../../firebase/functions/firestore';

// import { fetchProject } from '../../firebase/functions/firestore'; // fetchProject seems unused in this component

function UploadButton({ 
    isPhotosImported, 
    setIsPhotosImported, 
    setImageUrls, 
    id, 
    collectionId, 
    collectionName,
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
  const localDispatch = useDispatch(); 
  const domain = useSelector(selectDomain);
  const storageLimit = useSelector(selectStudioStorageUsage);
  const studiodata = useSelector(selectStudio);
  const currentStudio = useSelector(selectUserStudio);

  const handleDummyUpload = async () => {
    setIsPhotosImported(true);
    const dummyFiles = [];
    for (let i = 0; i < 534; i++) {
        dummyFiles.push({
            name: `dummy-image-${i}.jpg`,
            url: `https://picsum.photos/seed/${i + Math.random()}/1200/800`,
            lastModified: Date.now(),
            dateTimeOriginal: new Date().toISOString(),
            dimensions: { width: 1200, height: 800 },
            thumbAvailable: true,
        });
    }

    try {
        await addUploadedFilesToFirestore(domain, id, collectionId, 0, dummyFiles);
        await addUploadCompletionEventToFirestore(domain, id, collectionId, dummyFiles, 0, collectionName);
        
        setImageUrls(prevUrls => [...prevUrls, ...dummyFiles]);
        localDispatch(showAlert({ type: 'success', message: '534 Dummy files added successfully!' }));
        localDispatch(fetchProjects({ currentDomain: domain }));
    } catch (error) {
        console.error('Dummy upload failed:', error);
        localDispatch(showAlert({ type: 'error', message: 'Dummy upload failed, check console for details.' }));
    } finally {
        setIsPhotosImported(false);
    }
  };

  const handleFileInputChange = useCallback(async (event) => {
    const selectedFiles = Array.from(event.target.files);
    const importFileSize = addAllFileSizesToMB(selectedFiles);
      console.log(selectedFiles[0])
      //extractExifData(selectedFiles[0]);

      extractExifData(selectedFiles[0]).then(data => {
        if (!data.DateTimeOriginal) {
          console.log("No EXIF data found.");
          return;
        }
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
        const resp = await handleUpload(domain, selectedFiles, id, collectionId, importFileSize, dispatch, collectionName, studiodata.bucketUrl);

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
          dispatch(updateCollectionStatus
            ({
              domain,
              projectId: id,
              collectionId,
              status: 'visible'
            }));
          console.log(domain)
        setTimeout(() => {
          dispatch(openModal('uploadCompleted'))
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
      {process.env.NODE_ENV === 'development' && (
        <button 
          onClick={handleDummyUpload}
          className="button secondary"
          style={{ marginLeft: '10px', height: 'fit-content' }}
        >
          Dummy Upload (534)
        </button>
      )}
    </>
  );
}

export default UploadButton;
