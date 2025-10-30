import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateGalleryTaglineAsync } from '../../app/slices/adminSettingsSlice';
import { selectStudio } from '../../app/slices/studioSlice';

function GallerySettings({ formData, handleChange }) {
  const dispatch = useDispatch();
  const studio = useSelector(selectStudio);
  const studioId = studio?.domain; // Assuming studioId is the domain

  const [initialTagline, setInitialTagline] = useState(formData.galleryTagline);
  const [isTaglineDirty, setIsTaglineDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    setInitialTagline(formData.galleryTagline);
  }, [formData.galleryTagline]);

  const handleSaveTagline = async () => {
    if (studioId) {
      setIsLoading(true);
      try {
        await dispatch(updateGalleryTaglineAsync({ studioId, tagline: formData.galleryTagline }));
        setInitialTagline(formData.galleryTagline); // Update initial tagline after successful save
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCancelTagline = () => {
    handleChange({ target: { name: 'galleryTagline', value: initialTagline } });
  };
  useEffect(() => {
    setIsTaglineDirty(formData.galleryTagline !== initialTagline);
  }, [formData.galleryTagline, initialTagline]);

  return (
    <div className="gallery-privacy-settings">
      <form className="settings-form">

        <h2>Tagline</h2>
        <div className="form-group">
          <label htmlFor="galleryTagline">Footer Tagline</label>
          <input
            type="text"
            id="galleryTagline"
            name="galleryTagline"
            value={formData.galleryTagline}
            onChange={handleChange}
          ></input>
          <div className="input-edit-actions">
            <button
              type="button"
              className={`${isTaglineDirty ? '' : 'disabled'} button primary icon icon-only check`}
              onClick={handleSaveTagline}
              /* disabled={!isTaglineDirty || isLoading} */
            ></button>
            <button type="button" className="button secondary  icon icon-only close" onClick={handleCancelTagline}></button>
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
