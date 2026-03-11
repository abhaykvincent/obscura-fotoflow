import React, { useCallback, memo } from 'react';
import { useDispatch } from 'react-redux';
import { showAlert } from '../../app/slices/alertSlice';

const SelectionGallery = ({ project, images, selectedImages, setSelectedImages }) => {
  
  const dispatch = useDispatch()
  const handleImageClick = useCallback((fileUrl) => {
    // Simply call the toggle function provided by the parent
    setSelectedImages(fileUrl);
    
    const isCurrentlySelected = selectedImages.some(img => img.url === fileUrl.url);
    
    dispatch(showAlert({
      type: isCurrentlySelected ? 'warning' : 'success',
      message: isCurrentlySelected ? 'Image Unselected!' : 'Image Selected!',
    }));
  }, [selectedImages, setSelectedImages, dispatch]);
  
  const ImageComponent = React.memo(({ fileUrl, index, handleImageClick }) => {
    const isSelected = selectedImages.some(img => img.url === fileUrl.url);
    
    return (
      <div
        className="photo"
        key={index}
        onClick={() => project.status !== "selected" ? handleImageClick(fileUrl) : dispatch(showAlert({
          type: 'warning',
          message: 'Selection Completed!',
        }))}
      >
        <img 
          className="img" 
          src={fileUrl.url} 
          alt={`File ${index}`} 
          loading="lazy"
        />
        
        {project.status !== "selected" && <input
          type="checkbox"
          checked={isSelected}
          onChange={() => project.status !== "selected" ? handleImageClick(fileUrl) : dispatch(showAlert({
            type: 'warning',
            message: 'Selection Completed!',
          }))}
        />}
      </div>
    );
  });

  return (
    <div className="gallery">
      <div className="photos">
        {images.map((fileUrl, index) => (
          <ImageComponent key={index} fileUrl={fileUrl} index={index} handleImageClick={handleImageClick} />
        ))}
      </div>
    </div>
  );
};

export default memo(SelectionGallery);
