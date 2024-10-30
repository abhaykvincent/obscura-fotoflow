import React, { useState } from 'react';

const predefinedBackgrounds = [
  'background-option-1.png',
  'background-option-2.png',
  'background-option-3.png',
  'background-option-4.png',
];

const BackgroundPicker = ({ background, onChange }) => {
  const [selectedBackground, setSelectedBackground] = useState(background);

  const handleSelectImage = (image) => {
    setSelectedBackground(image);
    onChange({ type: 'image', value: image });
  };

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const uploadedImage = reader.result;
        setSelectedBackground(uploadedImage);
        onChange({ type: 'image', value: uploadedImage });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleColorChange = (e) => {
    const color = e.target.value;
    setSelectedBackground(color);
    onChange({ type: 'color', value: color });
  };

  return (
    <div className="background-picker">
      <label htmlFor="">Choose Theme</label>
      <div className="predefined-backgrounds">

      <div className="background-photo-uploader">
          <div className='background-upload-button'>
            <label htmlFor="file-upload" className="upload-button"></label>
            <input
            id="file-upload"
            type="file"
            accept="image/*"
            onChange={handleUpload}
            style={{ display: 'none' }} // Hide the input
            />
          </div>
        </div>
        {predefinedBackgrounds.map((bg, index) => (
          <div
            key={index}
            alt={`Background ${index + 1}`}
            className={`background-option background-option-${index+1} ${selectedBackground === bg ? 'selected' : ''}`}
            onClick={() => handleSelectImage(bg)}
          ></div>
        ))}

        
      </div>
      
    </div>
  );
};

export default BackgroundPicker;
