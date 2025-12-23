import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateStudioAsync } from '../../app/slices/adminSettingsSlice';
import { selectStudio } from '../../app/slices/studioSlice';
import { showAlert } from '../../app/slices/alertSlice';

function GallerySettings({ formData, handleChange }) {
  const dispatch = useDispatch();
  const studio = useSelector(selectStudio);
  const studioId = studio?.domain;

  const [localTagline, setLocalTagline] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLocalTagline(formData?.settings?.gallery?.galleryTagline || '');
  }, [formData]);

  const handleSaveTagline = async () => {
    if (studioId) {
      setIsSaving(true);
      try {
        await dispatch(updateStudioAsync({ 
          studioId, 
          updates: { 'settings.gallery.galleryTagline': localTagline } 
        })).unwrap();
        handleChange({
          target: {
            name: 'settings',
            value: {
              ...formData.settings,
              gallery: {
                ...formData.settings?.gallery,
                galleryTagline: localTagline,
              },
            },
          },
        });
        dispatch(showAlert({ type: 'success', message: 'Tagline updated' }));
      } catch (error) {
        dispatch(showAlert({ type: 'error', message: 'Failed to update tagline' }));
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleCancelTagline = () => {
    setLocalTagline(formData?.settings?.gallery?.galleryTagline || '');
  };

  const isTaglineDirty = localTagline !== (formData?.settings?.gallery?.galleryTagline || '');

  return (
    <div className="gallery-privacy-settings">
      <form className="settings-form" onSubmit={(e) => e.preventDefault()}>

        <h2>Tagline</h2>
        <div className="form-group">
          <label htmlFor="galleryTagline">Footer Tagline</label>
          <div className="editable-data">
            <input
              type="text"
              id="galleryTagline"
              name="galleryTagline"
              value={localTagline}
              onChange={(e) => setLocalTagline(e.target.value)}
            />
            {isTaglineDirty && (
              <div className="input-edit-actions">
                <button
                  type="button"
                  className={`button primary icon icon-only check ${isSaving ? 'disabled' : ''}`}
                  onClick={handleSaveTagline}
                  disabled={isSaving}
                ></button>
                <button 
                  type="button" 
                  className="button secondary icon icon-only close" 
                  onClick={handleCancelTagline}
                ></button>
              </div>
            )}
          </div>
        </div>

        <h2>
          {' '}
          <span className="privacy"></span>Privacy
        </h2>
        <div className="form-group">
          <h4 className="group-title">Share gallery </h4>
          <div className="radio-tabs share-view">
            <div className="tab active">
              <div className="tab-image public"></div>
              <div className="tab-content">
                <label htmlFor="">Public</label>
                <label className="secondery" htmlFor="">
                  Accessible via shared link
                </label>
              </div>
            </div>
            <div className="tab ">
              <div className="tab-image passcode"></div>
              <div className="tab-content">
                <label htmlFor="">Passcode Protected</label>
                <label className="secondery" htmlFor="">
                  Unlock with a secure passcode
                </label>
              </div>
            </div>
            <div className="tab">
              <div className="tab-image invite-only"></div>
              <div className="tab-content">
                <label htmlFor="">Invitation Only</label>
                <label className="secondery" htmlFor="">
                  Exclusive access for invited users
                </label>
              </div>
            </div>
            <label className="note-bene" htmlFor="">
              You can change privacy for each gallery later individualy.
            </label>
          </div>

          <h4 className="group-title"> Selection gallery</h4>
          <div className="radio-tabs selection-view">
            <div className="tab active">
              <div className="tab-image passcode "></div>
              <div className="tab-content">
                <label htmlFor="">Passcode Protected</label>
                <label className="secondery" htmlFor="">
                  Unlock with a secure passcode
                </label>
              </div>
            </div>
            <div className="tab">
              <div className="tab-image invite-only"></div>
              <div className="tab-content">
                <label htmlFor="">Invitation Only</label>
                <label className="secondery" htmlFor="">
                  Exclusive access for invited users
                </label>
              </div>
            </div>
            <label className="note-bene" htmlFor="">
              You can change privacy for each gallery later individualy.
            </label>
          </div>
        </div>

        <h2>
          {' '}
          <span className="photos"></span>Photos
        </h2>
        <div className="form-group">
          <h4 className="group-title">Resolution</h4>
          <div className="radio-tabs">
            <div className="tab active">
              <div className="tab-image optimized-resolution "></div>
              <div className="tab-content">
                <label htmlFor="">Optimized</label>
                <label className="secondery" htmlFor="">
                  Faster loading
                </label>
              </div>
            </div>
            <div className="tab disabled">
              <div className="tab-image original-resolution "></div>
              <div className="tab-content">
                <label htmlFor="">Original</label>
                <label className="secondery" htmlFor="">
                  Full resolution.
                </label>
              </div>
            </div>
            <label className="note-bene" htmlFor="">
              Changes are applied for all new uploads.
            </label>
          </div>
        </div>

      </form>
    </div>
  );
}

export default GallerySettings;