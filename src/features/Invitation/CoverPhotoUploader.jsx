import React from 'react';

const CoverPhotoUploader = ({ projectCover, onChange }) => {
  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="cover-photo-uploader">
        <div className="cover-upload-button"
          style={projectCover ? { backgroundImage: `url(${projectCover.replace(/\(/g, '%28').replace(/\)/g, '%29')})` } : {}}
        >
          <label htmlFor="cover-file-upload" className="upload-button"></label>
          <input
            id="cover-file-upload"
            type="file"
            accept="image/*"
            onChange={handleUpload}
            style={{ display: 'none' }} // Hide the input
          />
        </div>
        <div className="cover-photo-label">
          Change Cover
        </div>
    </div>
  );
};

export default CoverPhotoUploader;
