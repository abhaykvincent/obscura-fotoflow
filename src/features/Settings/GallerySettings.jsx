import React from 'react';

function GallerySettings({ formData, handleChange }) {
  return (
    <div className="gallery-privacy-settings">
      <form className="settings-form">
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

        <h2>Footer</h2>
        <div className="form-group">
          <label htmlFor="galleryTagline">Tagline</label>
          <input
            type="text"
            id="galleryTagline"
            name="galleryTagline"
            value={formData.galleryTagline}
            onChange={handleChange}
          ></input>
        </div>
      </form>
    </div>
  );
}

export default GallerySettings;
