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
            setFormData({
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
            });
        }
    }, [studio, defaultStudio]);

    // Handle form field changes dynamically
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };

    document.title = `${defaultStudio?.name} | Settings`;

    return (
        <>
            {/* Main - settings */}
            <main className="settings">
                {/* Page Header */}
                <div className="settings-header">
                    <h1>Settings</h1>
                </div>
                <SettingsDashboard {...{formData, handleChange}} />
            </main>
        </>
    );
}

export default Settings;