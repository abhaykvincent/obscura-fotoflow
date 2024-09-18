import React, { useState } from 'react';
import { addAllFileSizesToMB } from '../../utils/fileUtils';
import { handleUpload } from '../../utils/uploadOperations';
import { useDispatch, useSelector } from 'react-redux';
import { selectDomain, selectStorageLimit } from '../../app/slices/authSlice';
import { showAlert } from '../../app/slices/alertSlice';

function UploadButton({isPhotosImported,setIsPhotosImported,imageUrls,setImageUrls,id,collectionId,setUploadLists,setUploadStatus}) {
    const dispatch = useDispatch();
    let importFileSize = 0;
    const storageLimit = useSelector(selectStorageLimit);
    const domain = useSelector(selectDomain);

    // File type validation
    const validateFileTypes = (files) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        for (let file of files) {
            if (!allowedTypes.includes(file.type)) {
                return false;
            }
        }
        return true;
    };

    const handleFileInputChange = async (event) => {
        const selectedFiles = Array.from(event.target.files);

        // Check file types
        if (!validateFileTypes(selectedFiles)) {
            dispatch(showAlert({ type: 'error', message: 'Currently, only .jpg, .jpeg, and .png. More to come!' }));
            return; // Exit if files are not valid
        }

        setIsPhotosImported(true);
        importFileSize = addAllFileSizesToMB(selectedFiles);
        console.log({ importFileSize, available: storageLimit.available, limit: storageLimit.total });

        if (importFileSize < storageLimit.available) {
            setImageUrls(selectedFiles);
            setUploadStatus('open');
            setIsPhotosImported(false);

            let uploadedImages = await handleUpload(domain, selectedFiles, id, collectionId, importFileSize, setUploadLists, setUploadStatus);
            setImageUrls([...imageUrls, ...uploadedImages]);
        } else {
            dispatch(showAlert({ type: 'error', message: 'Uploaded <b>file size exceeds</b> your limit! Upgrade' }));
        }
    };

    return (
        <>
            <label htmlFor="fileInput" className={`button ${isPhotosImported ? 'secondary' : 'primary'}`}>
                Upload Images
            </label>
            <input id="fileInput" type="file" multiple onChange={handleFileInputChange} />
        </>
    );
}

export default UploadButton;
