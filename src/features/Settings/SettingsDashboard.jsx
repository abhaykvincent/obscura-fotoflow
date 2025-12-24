import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectUserStudio } from '../../app/slices/authSlice';
import BillingHistory from '../BillingHistory/BillingHistory';
import StudioSettings from './StudioSettings';
import GallerySettings from './GallerySettings';

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
            return <StudioSettings formData={formData} handleChange={handleChange} />;
        case 'gallery':
            return <GallerySettings formData={formData} handleChange={handleChange} />;
        case 'billing': return(<BillingHistory />) 
        default:
            return null;
    }
  };

  return (
    <div className="dashboard-tabs">
      <div className="tabs">
        <button
          className={`button secondary icon tab-button studio ${activeTab === 'studio' ? 'active' : ''}`}
          onClick={() => setActiveTab('studio')}
        >
          Studio
        </button>
        <button
          className={`button secondary icon tab-button ai ${activeTab === 'gallery' ? 'active' : ''}`}
          onClick={() => setActiveTab('gallery')}
        >
          Gallery
        </button>
        <button
          className={` button secondary icon tab-button history ${activeTab === 'billing' ? 'active' : ''}`}
          onClick={() => setActiveTab('billing')}
        >Billing</button>
        <button
          className={`disabled button secondary icon tab-button user ${activeTab === 'team' ? 'active' : ''}`}
          onClick={() => setActiveTab('team')}
        >Team</button>
        <button
          className={`disabled button secondary icon tab-button security ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >Security</button>
      </div>
      
      <div className="tab-content">{renderTabContent()}</div>
      
    </div>
  );
}

export default SettingsDashboard;