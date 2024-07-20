import React, { useState } from 'react'
import { addAllFileSizesToMB } from '../../utils/fileUtils';
import { handleUpload } from '../../utils/uploadOperations';

function UploadButton({isPhotosImported,setIsPhotosImported,imageUrls,setImageUrls,id,collectionId,setUploadLists,setUploadStatus}) {
    let importFileSize=0
    const handleFileInputChange = async (event) => {
        const selectedFiles = Array.from(event.target.files);
        setIsPhotosImported(true);
        importFileSize=addAllFileSizesToMB(selectedFiles);
        setImageUrls(selectedFiles);
        setUploadStatus('open');
        setIsPhotosImported(false);

        let uploadedImages = await handleUpload(selectedFiles, id, collectionId, importFileSize, setUploadLists, setUploadStatus);
        setImageUrls([...imageUrls,...uploadedImages]);
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