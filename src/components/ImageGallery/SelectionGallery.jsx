import React, { useCallback, memo } from 'react';

const SelectionGallery = ({ images, selectedImages,setUnselectedImages, setSelectedImages }) => {
  const handleImageClick = useCallback((fileUrl) => {
    const index = selectedImages.indexOf(fileUrl);
  
    if (index > -1) {
      // Unselect the image if already selected
      const newSelectedImages = [...selectedImages];
      newSelectedImages.splice(index, 1);
      setSelectedImages(newSelectedImages);
  
      // Add to unselected images
      setUnselectedImages((prevUnselected) => [...prevUnselected, fileUrl]);
    } else {
      // Select the image if not yet selected
      setSelectedImages([...selectedImages, fileUrl]);
  
      // Remove from unselected images if it exists
      setUnselectedImages((prevUnselected) =>
        prevUnselected.filter((img) => img.url !== fileUrl.url)
      );
    }
  }, [selectedImages, setSelectedImages, setUnselectedImages]);
  
  const ImageComponent = React.memo(({ fileUrl, index, handleImageClick }) => (
    <div
      className="photo"
      key={index}
      onClick={() => handleImageClick(fileUrl)}
    >
      <img className="img" src={fileUrl.url} alt={`File ${index}`} />
      <input
        type="checkbox"
        checked={selectedImages.includes(fileUrl)}
        onChange={() => handleImageClick(fileUrl)}
      />
    </div>
  ));

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
