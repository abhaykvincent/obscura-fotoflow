
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// Selectors and actions
import { selectUser, selectUserStudio } from '../../app/slices/authSlice';
import { updateStudioAsync } from '../../app/slices/adminSettingsSlice';
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
        studioName: studio?.name || defaultStudio?.name || '',
        studioLogo: studio?.studioLogo || '',
        settings:{
            gallery:{
                galleryTagline: studio?.settings?.gallery?.galleryTagline || ''
            }
        },
        studioEmail: studio?.studioEmail || userData?.email || '',
        studioPhone: studio?.studioPhone || userData?.phone || '',
        studioWebsite: studio?.website || '',
        studioAddress: studio?.address || '',
        studioInstagram: studio?.social?.instagram || '',
        studioFacebook: studio?.social?.facebook || '',
    });

    useEffect(() => {
        if (studio || defaultStudio) {
            setFormData(prev => ({
                ...prev,
                studioName: studio?.name || defaultStudio?.name || '',
                studioLogo: studio?.studioLogo || '',
                settings: {
                    gallery: {
                        galleryTagline: studio?.settings?.gallery?.galleryTagline || ''
                    }
                },
                studioEmail: studio?.studioEmail || userData?.email || '',
                studioPhone: studio?.studioPhone || userData?.phone || '',
                studioWebsite: studio?.website || '',
                studioAddress: studio?.address || '',
                studioInstagram: studio?.social?.instagram || '',
                studioFacebook: studio?.social?.facebook || '',
            }));
        }
    }, [studio, defaultStudio]);

    console.log('Default Studio:', studio);
    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const hasChanges = 
        formData.studioName !== (studio?.name || defaultStudio?.name || '') ||
        formData.studioLogo !== (studio?.studioLogo || '') ||
        formData.settings?.gallery?.galleryTagline !== (studio?.settings?.gallery?.galleryTagline || '') ||
        formData.studioEmail !== (studio?.studioEmail || userData?.email || '') ||
        formData.studioPhone !== (studio?.studioPhone || userData?.phone || '') ||
        formData.studioWebsite !== (studio?.website || '') ||
        formData.studioAddress !== (studio?.address || '') ||
        formData.studioInstagram !== (studio?.social?.instagram || '') ||
        formData.studioFacebook !== (studio?.social?.facebook || '');


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

        const updates = {
            name: formData.studioName,
            studioEmail: formData.studioEmail,
            studioPhone: formData.studioPhone,
            website: formData.studioWebsite,
            address: formData.studioAddress,
            social: {
                instagram: formData.studioInstagram,
                facebook: formData.studioFacebook,
            },
            'settings.gallery.galleryTagline': formData.settings.gallery.galleryTagline
        };

        // Your API logic for saving settings here
        try {
            await dispatch(updateStudioAsync({ studioId: studio.domain, updates }));
            setSuccessMessage('Settings updated successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
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
