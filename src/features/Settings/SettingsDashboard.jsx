import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectUserStudio } from '../../app/slices/authSlice';
import BillingHistory from '../BillingHistory/BillingHistory';

function SettingsDashboard({ formData,handleChange }) {
  const dispatch = useDispatch();
  const currentStudio = useSelector(selectUserStudio);
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('settingsActiveTab') || 'studio';
  });
  useEffect(() => {
    localStorage.setItem('settingsActiveTab', activeTab);
  }, [activeTab]);
  const renderTabContent = () => {
    switch (activeTab) {
        case 'studio':
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
                        <input type="text" id="studioName" name="studioName"
                        value={formData.studioName} onChange={handleChange}
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
                          <div 
                              className="google-logo"
                              alt="Google" 
                          ></div>
                        </div>
                      <label htmlFor="studioName">Phone</label>
                        <input type="text" id="studioPhone" name="studioPhone"
                        value={formData.studioPhone} onChange={handleChange}
                        ></input>
                        

                    </div>

                </form>
            </div>
            ) 
        break;
        case 'gallery':
            return (
            <div className="gallery-privacy-settings">
                <form className="settings-form">
                    <h2 > <span className='privacy'></span>Privacy</h2>
                    <div className="form-group">

                        <h4 className='group-title'>Share gallery </h4>   
                        <div className="radio-tabs share-view">

                            <div className="tab active">
                              <div className="tab-image public"></div>
                              <div className="tab-content">
                                <label htmlFor="">Public</label>
                                <label className='secondery' htmlFor="">Accessible via shared link</label>
                              </div>

                            </div>
                            <div className="tab ">
                              <div className="tab-image passcode"></div>
                              <div className="tab-content">
                                <label htmlFor="">Passcode Protected</label>
                                <label className='secondery' htmlFor="">Unlock with a secure passcode</label>
                              </div>
                            </div>
                            <div className="tab">
                              <div className="tab-image invite-only"></div>
                              <div className="tab-content">
                                <label htmlFor="">Invitation Only</label>
                                <label className='secondery' htmlFor="">Exclusive access for invited users</label>
                              </div>    
                            </div>
                            <label className='note-bene' htmlFor="">You can change privacy for each gallery later individualy.</label>
                        </div>

                        <h4 className='group-title'> Selection gallery</h4>   
                        <div className="radio-tabs selection-view">
                            <div className="tab active">
                              <div className="tab-image passcode "></div>
                              <div className="tab-content">
                                <label htmlFor="">Passcode Protected</label>
                                <label className='secondery' htmlFor="">Unlock with a secure passcode</label>
                              </div>
                            </div>
                            <div className="tab">
                              <div className="tab-image invite-only"></div>
                              <div className="tab-content">
                                <label htmlFor="">Invitation Only</label>
                                <label className='secondery' htmlFor="">Exclusive access for invited users</label>
                              </div>    
                            </div>
                            <label className='note-bene' htmlFor="">You can change privacy for each gallery later individualy.</label>

                          </div>

                    </div>

                    <h2> <span className='photos'></span>Photos</h2>
                    <div className="form-group">

                        <h4 className='group-title'>Resolution</h4>   
                        <div className="radio-tabs">
                            <div className="tab active">
                              <div className="tab-image optimized-resolution "></div>
                              <div className="tab-content">
                                <label htmlFor="">Optimized</label>
                                <label className='secondery' htmlFor="">Faster loading</label>
                              </div>
                            </div>
                            <div className="tab disabled">
                              <div className="tab-image original-resolution "></div>
                              <div className="tab-content">
                                <label htmlFor="">Original</label>
                                <label className='secondery' htmlFor="">Full resolution.</label>
                              </div>
                            </div>
                            <label className='note-bene' htmlFor="">Changes are applied for all new uploads.</label>
                        </div>

                    </div>
                    
                    <h2>Footer</h2>
                    <div className="form-group">
                        <label htmlFor="studioName">Tagline</label>
                        <input type="text" id="studioName" name="studioName"
                        value={`smile with ${formData.studioName}`} onChange={handleChange}
                        ></input>
                    </div>
                </form>
            </div>
            )
        break
        case 'billing': return(<BillingHistory />) 
        break
        default:
            return null;
    }
  };

  return (
    <div className="dashboard-tabs">
      <div className="tabs">
        <button
          className={`button secondary tab-button ${activeTab === 'studio' ? 'active' : ''}`}
          onClick={() => setActiveTab('studio')}
        >
          Studio
        </button>
        <button
          className={`button secondary tab-button ${activeTab === 'gallery' ? 'active' : ''}`}
          onClick={() => setActiveTab('gallery')}
        >
          Gallery
        </button>
        <button
          className={` button secondary tab-button ${activeTab === 'billing' ? 'active' : ''}`}
          onClick={() => setActiveTab('billing')}
        >Billing</button>
        <button
          className={`disabled button secondary tab-button ${activeTab === 'team' ? 'active' : ''}`}
          onClick={() => setActiveTab('team')}
        >Team</button>
        <button
          className={`disabled button secondary tab-button ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >Security</button>
      </div>
      <div className="tab-content">{renderTabContent()}</div>
    </div>
  );
}

export default SettingsDashboard;
