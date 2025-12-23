import React, { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateStudioLogoAsync } from '../../app/slices/adminSettingsSlice';
import { selectStudio } from '../../app/slices/studioSlice';
import { setStudioLogo } from '../../app/slices/authSlice';
import { showAlert } from '../../app/slices/alertSlice';
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
      if (file.type !== 'image/png') {
        dispatch(showAlert({ type: 'error', message: 'Please upload only PNG images for the studio logo.' }));
        e.target.value = null; // Clear input
        return;
      }
      setIsUploading(true);
      try {
        const resultAction = await dispatch(updateStudioLogoAsync({ file, studioDomain: studio.domain }));
        if (updateStudioLogoAsync.fulfilled.match(resultAction)) {
            dispatch(setStudioLogo(resultAction.payload));
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
            <div className="logo-image" style={{ backgroundColor: 'transparent', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img 
                    src={formData.studioLogo || defaultLogo} 
                    alt="Studio Logo" 
                    style={{ 
                        maxWidth: '100%', 
                        maxHeight: '100%', 
                        objectFit: 'contain' 
                    }} 
                />
                {isUploading && <div className="upload-overlay">...</div>}
            </div>
            <div  className="button-wrapper" style={{ display: 'grid', alignItems: 'center', gap: '10px' }}>
                <div className="button primary outline" onClick={handleLogoClick} disabled={isUploading}>
                    {isUploading ? 'Uploading...' : 'Change logo'}
                </div>
                <span style={{ opacity: 0.6, fontSize: '0.8em' }}>(Only .png is supported)</span>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileChange}
              accept=".png"
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
        <div className="form-group">
          <label htmlFor="studioWebsite">Website</label>
          <input
            type="text"
            id="studioWebsite"
            name="studioWebsite"
            placeholder="https://yourstudio.com"
            value={formData.studioWebsite || ''}
            onChange={handleChange}
          ></input>
        </div>

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
          <label htmlFor="studioPhone">Phone</label>
          <input
            type="text"
            id="studioPhone"
            name="studioPhone"
            value={formData.studioPhone}
            onChange={handleChange}
          ></input>
        </div>

        <div className="form-group">
          <label htmlFor="studioAddress">Address</label>
          <textarea
            id="studioAddress"
            name="studioAddress"
            rows="3"
            value={formData.studioAddress || ''}
            onChange={handleChange}
          ></textarea>
        </div>

        <h2>Social Media</h2>
        <div className="form-group rows-2">
          <label htmlFor="studioInstagram">Instagram</label>
          <div className="input-with-prefix">
            <span className="prefix">instagram.com/</span>
            <input
              type="text"
              id="studioInstagram"
              name="studioInstagram"
              value={formData.studioInstagram || ''}
              onChange={handleChange}
            />
          </div>
          <label htmlFor="studioFacebook">Facebook</label>
          <div className="input-with-prefix">
            <span className="prefix">facebook.com/</span>
            <input
              type="text"
              id="studioFacebook"
              name="studioFacebook"
              value={formData.studioFacebook || ''}
              onChange={handleChange}
            />
          </div>
        </div>
      </form>
    </div>
  );
}

export default StudioSettings;
