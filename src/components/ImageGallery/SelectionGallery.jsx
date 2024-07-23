import React, { useCallback, memo, useState } from 'react';
const SelectionGallery = ({ images, selectedImages, setSelectedImages, setSelectedImagesInCollection }) => {
  console.log(selectedImages)

  const handleImageClick = useCallback((fileUrl) => {
    // Check if fileUrl is already in selectedImages
    const index = selectedImages.indexOf(fileUrl);
    if (index > -1) {
      // If fileUrl is already in selectedImages, remove it
      const newSelectedImages = [...selectedImages];
      newSelectedImages.splice(index, 1);
      setSelectedImages(newSelectedImages);
    } else {
      // If fileUrl is not in selectedImages, add it
      setSelectedImages([...selectedImages, fileUrl]);
    }
    // Update setSelectedImagesInCollection
    setSelectedImagesInCollection(selectedImages);

  }, [selectedImages, setSelectedImages, setSelectedImagesInCollection]);

  const ImageComponent = React.memo(({ fileUrl, index, handleImageClick }) => (
    <div
      className="photo"
      key={index}
      aria-label={`File ${index}`}
      onClick={() => handleImageClick(fileUrl)}
    >
      <img className="img"  src={fileUrl.url} alt={`File ${index}`} 
            ></img>
      <input
        type="checkbox"
        checked={selectedImages.includes(fileUrl)}

        onChange={() => handleImageClick(fileUrl)}
      />
    </div>
  ));

  return (
    <div className="gallary">
      <div className="photos">
        {images.map((fileUrl, index) => (
          <ImageComponent key={index} fileUrl={fileUrl} index={index} handleImageClick={handleImageClick} />
        ))}
      </div>
    </div>
  );
};

export default SelectionGallery;