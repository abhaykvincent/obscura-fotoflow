import React, { useState } from 'react'
import { addAllFileSizesToMB } from '../../utils/fileUtils';
import { handleUpload } from '../../utils/uploadOperations';
import { useDispatch, useSelector } from 'react-redux';
import { selectDomain, selectStorageLimit } from '../../app/slices/authSlice';
import { showAlert } from '../../app/slices/alertSlice';

function UploadButton({isPhotosImported,setIsPhotosImported,imageUrls,setImageUrls,id,collectionId,setUploadLists,setUploadStatus}) {
    const dispatch= useDispatch()
    let importFileSize=0
    const storageLimit = useSelector(selectStorageLimit)
    const domain = useSelector(selectDomain)
    const handleFileInputChange = async (event) => {
        const selectedFiles = Array.from(event.target.files);
        setIsPhotosImported(true);
        importFileSize=addAllFileSizesToMB(selectedFiles);
        console.log({importFileSize, available:storageLimit.available, limit:storageLimit.total})
        
        if(importFileSize<storageLimit.available){
            setImageUrls(selectedFiles);
            setUploadStatus('open');
            setIsPhotosImported(false);
    
            let uploadedImages = await handleUpload(domain,selectedFiles, id, collectionId, importFileSize, setUploadLists, setUploadStatus);
            setImageUrls([...imageUrls,...uploadedImages]);
        }
        else{
            dispatch(showAlert({type:'error', message:`Uploaded <b>file size exceeds </b> your limit! Upgrade`}));
        }
    };
    return (
        <>
            <label htmlFor="fileInput" className={`button ${isPhotosImported ? 'secondary' : 'primary'}`} 
            >Upload Images</label>
            <input id='fileInput' type="file" multiple onChange={handleFileInputChange} />
        </>
    )
}

export default UploadButton
// Line Complexity -> 0.25 -> 0.3 ->