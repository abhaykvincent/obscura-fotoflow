import React, { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { handleUpload } from '../../../utils/uploadOperations';
import './ImageGrid.scss';
import { selectDomain } from '../../../app/slices/authSlice';

const ImageGrid = ({id, collectionId,collectionName, section, onSectionUpdate }) => {
  const dispatch = useDispatch();
  const [images, setImages] = useState(section.images || []);
  const uploadState = useSelector(state => state.upload);
 const domain = useSelector(selectDomain);
  const onDrop = useCallback((acceptedFiles) => {
    // Assuming 'domain', 'id', 'collectionId', 'importFileSize', 'collectionName' are available from props or context
    // For now, using placeholders. You'll need to replace these with actual values.
   
    const importFileSize = 0; // Placeholder
    console.log(domain, acceptedFiles, id, collectionId, importFileSize, collectionName)
        handleUpload(domain, acceptedFiles, id, collectionId, importFileSize, dispatch, collectionName, section.id);
  }, [section.id, dispatch]);

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    onDrop(files);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const files = Array.from(event.dataTransfer.files);
    onDrop(files);
  };

  // Update local state when section.images changes (e.g., after successful upload)
  React.useEffect(() => {
    if (section.images) {
      setImages(section.images);
    }
  }, [section.images]);

  return (
    <div className="image-grid-section">
      {images.length === 0 ? (
        <div
          className="upload-area"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => document.getElementById(`fileInput-${section.id}`).click()}
        >
          <input
            type="file"
            id={`fileInput-${section.id}`}
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <div className="upload-content">
            <svg className="upload-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
            </svg>
            <p className="upload-main-text">Drag & drop files here</p>
            <p className="upload-sub-text">or click to upload</p>
          </div>
        </div>
      ) : (
        <div className="image-grid-display">
          {/* Render your images here */}
          {images.map((image, index) => (
            <img key={index} src={image.url} alt={`Gallery Image ${index}`} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageGrid;
