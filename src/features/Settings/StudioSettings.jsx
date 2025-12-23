import React, { useRef, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateStudioLogoAsync, updateStudioAsync } from '../../app/slices/adminSettingsSlice';
import { selectStudio } from '../../app/slices/studioSlice';
import { setStudioLogo } from '../../app/slices/authSlice';
import { showAlert } from '../../app/slices/alertSlice';
import defaultLogo from '../../assets/img/fotoflow-pro-logo.svg';

function StudioSettings({ formData, handleChange }) {
  const dispatch = useDispatch();
  const studio = useSelector(selectStudio);
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [savingField, setSavingField] = useState(null);

  // State to track local changes before saving
  const [localData, setLocalData] = useState({});

  useEffect(() => {
    setLocalData(formData);
  }, [formData]);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLocalData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveField = async (fieldName, dbField) => {
    setSavingField(fieldName);
    try {
      let updates = {};
      if (dbField.includes('.')) {
        updates[dbField] = localData[fieldName];
      } else if (dbField === 'social') {
        updates = {
          social: {
            instagram: localData.studioInstagram,
            facebook: localData.studioFacebook,
          }
        };
      } else {
        updates[dbField] = localData[fieldName];
      }

      await dispatch(updateStudioAsync({ studioId: studio.domain, updates })).unwrap();
      // Sync parent state
      handleChange({ target: { name: fieldName, value: localData[fieldName] } });
      dispatch(showAlert({ type: 'success', message: 'Updated successfully' }));
    } catch (error) {
      dispatch(showAlert({ type: 'error', message: 'Failed to update' }));
    } finally {
      setSavingField(null);
    }
  };

  const handleCancelField = (fieldName) => {
    setLocalData(prev => ({ ...prev, [fieldName]: formData[fieldName] }));
  };

  const isDirty = (fieldName) => localData[fieldName] !== formData[fieldName];

  const renderEditActions = (fieldName, dbField) => {
    if (!isDirty(fieldName)) return null;
    return (
      <div className="input-edit-actions">
        <button
          type="button"
          className={`button primary icon icon-only check ${savingField === fieldName ? 'disabled' : ''}`}
          onClick={() => handleSaveField(fieldName, dbField)}
          disabled={savingField === fieldName}
        ></button>
        <button
          type="button"
          className="button secondary icon icon-only close"
          onClick={() => handleCancelField(fieldName)}
        ></button>
      </div>
    );
  };

  return (
    <div className="studio-settings">
      <form className="settings-form" onSubmit={(e) => e.preventDefault()}>
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
          <div className="editable-data">
            <input
              type="text"
              id="studioName"
              name="studioName"
              value={localData.studioName || ''}
              onChange={handleInputChange}
            />
            {renderEditActions('studioName', 'name')}
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="studioWebsite">Website</label>
          <div className="editable-data">
            <input
              type="text"
              id="studioWebsite"
              name="studioWebsite"
              placeholder="https://yourstudio.com"
              value={localData.studioWebsite || ''}
              onChange={handleInputChange}
            />
            {renderEditActions('studioWebsite', 'website')}
          </div>
        </div>

        <h2>Contact</h2>
        <div className="form-group rows-2">
          <div className="field-wrap">
            <label htmlFor="studioEmail">Email</label>
            <div className="input-with-icon disabled">
              <input
                type="text"
                id="studioEmail"
                name="studioEmail"
                value={localData.studioEmail || ''}
                readOnly
              />
              <div className="google-logo" alt="Google"></div>
            </div>
          </div>
          <div className="field-wrap">
            <label htmlFor="studioPhone">Phone</label>
            <div className="editable-data">
              <input
                type="text"
                id="studioPhone"
                name="studioPhone"
                value={localData.studioPhone || ''}
                onChange={handleInputChange}
              />
              {renderEditActions('studioPhone', 'studioPhone')}
            </div>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="studioAddress">Address</label>
          <div className="editable-data">
            <textarea
              id="studioAddress"
              name="studioAddress"
              rows="3"
              style={{ width: '100%', minWidth: '8px*24*1.6' }}
              value={localData.studioAddress || ''}
              onChange={handleInputChange}
            ></textarea>
            {renderEditActions('studioAddress', 'address')}
          </div>
        </div>

        <h2>Social Media</h2>
        <div className="form-group rows-2">
          <div className="field-wrap">
            <label htmlFor="studioInstagram">Instagram</label>
            <div className="editable-data">
              <div className="input-with-prefix">
                <span className="prefix">instagram.com/</span>
                <input
                  type="text"
                  id="studioInstagram"
                  name="studioInstagram"
                  value={localData.studioInstagram || ''}
                  onChange={handleInputChange}
                />
              </div>
              {renderEditActions('studioInstagram', 'social')}
            </div>
          </div>
          <div className="field-wrap">
            <label htmlFor="studioFacebook">Facebook</label>
            <div className="editable-data">
              <div className="input-with-prefix">
                <span className="prefix">facebook.com/</span>
                <input
                  type="text"
                  id="studioFacebook"
                  name="studioFacebook"
                  value={localData.studioFacebook || ''}
                  onChange={handleInputChange}
                />
              </div>
              {renderEditActions('studioFacebook', 'social')}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default StudioSettings;