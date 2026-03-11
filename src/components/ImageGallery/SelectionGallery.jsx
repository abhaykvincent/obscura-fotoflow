import React, { useCallback, memo } from 'react';
import { useDispatch } from 'react-redux';
import { showAlert } from '../../app/slices/alertSlice';

/**
 * GalleryImage component for rendering individual images in the selection gallery.
 * Memoized to prevent unnecessary re-renders when other images change.
 */
const GalleryImage = memo(({ 
  fileUrl, 
  index, 
  isSelected, 
  isSelectionCompleted, 
  onToggleSelection, 
  onNotifyCompleted 
}) => {
  
  const handleAction = (e) => {
    // Prevent default if it's a checkbox to handle it manually via handleClick
    if (e.target.type === 'checkbox') e.stopPropagation();
    
    if (isSelectionCompleted) {
      onNotifyCompleted();
    } else {
      onToggleSelection(fileUrl);
    }
  };

  return (
    <div className="photo" onClick={handleAction}>
      <img 
        className="img" 
        src={fileUrl.url} 
        alt={`File ${index}`} 
        loading="lazy"
      />
      
      {!isSelectionCompleted && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleAction}
        />
      )}
    </div>
  );
});

/**
 * SelectionGallery component for displaying a grid of images for selection.
 */
const SelectionGallery = ({ project, images, selectedImages, setSelectedImages }) => {
  const dispatch = useDispatch();
  const isSelectionCompleted = project.status === "selected";

  const notifyCompleted = useCallback(() => {
    dispatch(showAlert({
      type: 'warning',
      message: 'Selection Completed!',
    }));
  }, [dispatch]);

  const handleToggleSelection = useCallback((fileUrl) => {
    const isCurrentlySelected = selectedImages.some(img => img.url === fileUrl.url);
    
    // Toggle the selection in the parent state
    setSelectedImages(fileUrl);
    
    // Notify the user of the change
    dispatch(showAlert({
      type: isCurrentlySelected ? 'warning' : 'success',
      message: isCurrentlySelected ? 'Image Unselected!' : 'Image Selected!',
    }));
  }, [selectedImages, setSelectedImages, dispatch]);

  return (
    <div className="gallery">
      <div className="photos">
        {images.map((fileUrl, index) => {
          const isSelected = selectedImages.some(img => img.url === fileUrl.url);
          
          return (
            <GalleryImage 
              key={fileUrl.url || index}
              fileUrl={fileUrl}
              index={index}
              isSelected={isSelected}
              isSelectionCompleted={isSelectionCompleted}
              onToggleSelection={handleToggleSelection}
              onNotifyCompleted={notifyCompleted}
            />
          );
        })}
      </div>
    </div>
  );
};

export default memo(SelectionGallery);
