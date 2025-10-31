import React from 'react';

function StudioSettings({ formData, handleChange }) {
  return (
    <div className="studio-settings">
      <form className="settings-form">
        <h2>Branding</h2>
        <div className="form-group">
          <label htmlFor="logo-input">Studio Logo</label>
          <div className="logo-input">
            <div className="logo-image"></div>
            <div className="button primary outline">Change logo</div>
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
