import React, { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateStudioLogoAsync } from '../../app/slices/adminSettingsSlice';
import { selectStudio } from '../../app/slices/studioSlice';
import defaultLogo from '../../assets/img/fotoflow-pro-logo.svg';

function StudioSettings({ formData, handleChange }) {
  const dispatch = useDispatch();
  const studio = useSelector(selectStudio);
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleLogoClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file && studio?.domain) {
      setIsUploading(true);
      try {
        const resultAction = await dispatch(updateStudioLogoAsync({ file, studioDomain: studio.domain }));
        if (updateStudioLogoAsync.fulfilled.match(resultAction)) {
            // Update formData in parent if needed, although it should sync from studio data
            handleChange({
                target: {
                    name: 'studioLogo',
                    value: resultAction.payload
                }
            });
        }
      } catch (error) {
        console.error('Logo upload failed:', error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <div className="studio-settings">
      <form className="settings-form">
        <h2>Branding</h2>
        <div className="form-group">
          <label htmlFor="logo-input">Studio Logo</label>
          <div className="logo-input">
            <div 
                className="logo-image" 
                style={{ 
                    backgroundImage: `url(${formData.studioLogo || defaultLogo})`, 
                    backgroundSize: 'contain', 
                    backgroundRepeat: 'no-repeat', 
                    backgroundPosition: 'center' 
                }}
            >
                {isUploading && <div className="upload-overlay">...</div>}
            </div>
            <div className="button primary outline" onClick={handleLogoClick} disabled={isUploading}>
                {isUploading ? 'Uploading...' : 'Change logo'}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileChange}
              accept="image/*"
            />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="studioName">Studio Name</label>
          <input
            type="text"
            id="studioName"
            name="studioName"
            value={formData.studioName}
            onChange={handleChange}
          ></input>
        </div>
...

        <h2>Contact</h2>
        <div className="form-group rows-2">
          <label htmlFor="studioEmail">Email</label>
          <div className="input-with-icon disabled">
            <input
              type="text"
              id="studioEmail"
              name="studioEmail"
              value={formData.studioEmail}
              onChange={handleChange}
            />
            <div className="google-logo" alt="Google"></div>
          </div>
          <label htmlFor="studioName">Phone</label>
          <input
            type="text"
            id="studioPhone"
            name="studioPhone"
            value={formData.studioPhone}
            onChange={handleChange}
          ></input>
        </div>
      </form>
    </div>
  );
}

export default StudioSettings;
