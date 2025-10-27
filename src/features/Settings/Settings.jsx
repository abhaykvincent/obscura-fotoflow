
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// Selectors and actions
import { selectUser, selectUserStudio } from '../../app/slices/authSlice';
// Components

// Styles
import './Settings.scss';
import SettingsDashboard from './SettingsDashboard';
import { selectStudio } from '../../app/slices/studioSlice';

function Settings() {
    const dispatch = useDispatch();
    const defaultStudio = useSelector(selectUserStudio);
    const studio = useSelector(selectStudio);
    const userData = useSelector(selectUser);
    // Initial state for all fields in the settings form
    const [formData, setFormData] = useState({
        studioName: defaultStudio?.name || '',
        galleryTagline: studio?.galleryTagline || '',
        studioEmail: userData?.email || '',
        studioPhone: userData?.phone || '',
        // Add other fields here as they are added (e.g., studio address, phone number)
    });
    console.log('Default Studio:', studio);
    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const hasChanges = 
        formData.studioName !== (defaultStudio?.name || '') ||
        formData.galleryTagline !== (studio?.galleryTagline || '') ||
        formData.studioEmail !== (userData?.email || '') ||
        formData.studioPhone !== (userData?.phone || '');


    // Handle form field changes dynamically
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevState) => ({
            ...prevState,
            [name]: value, // Make sure the correct field is being updated
        }));
    };
    // Handle form submission
    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setSuccessMessage('');

        // Your API logic for saving settings here
        try {
            // Assuming `updateStudioAsync` is your async action for saving data
            // await dispatch(updateStudioAsync(formData));
            setSuccessMessage('Settings updated successfully!');
        } catch (error) {
            console.error('Error saving settings:', error);
            setSuccessMessage('Failed to update settings. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    document.title = `${defaultStudio?.name} | Settings`;

    return (
        <>
            {/* Modals */}

            {/* Main - settings */}
            <main className="settings">
                {/* Page Header */}
                <div className="settings-header">
                    <h1>Settings</h1>
                    <button
                        type="submit"
                        className={`button primary ${hasChanges ? 'active' : ''}`}
                        onClick={handleSave}
                        disabled={isSaving || !hasChanges}
                    >
                        {isSaving ? 'Saving...' : 'Save'}
                    </button>
                    {
                        successMessage && <div className="success-message">{successMessage}</div>
                    }
                </div>
                <SettingsDashboard {...{formData, handleChange}} />
                {/* Settings Form */}
                
            </main>
        </>
    );
}

export default Settings;
