
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// Selectors and actions
import { selectUser, selectUserStudio } from '../../app/slices/authSlice';
// Components
import AddProjectModal from '../../components/Modal/AddProject/AddProject';
// Styles
import './Settings.scss';
import SettingsDashboard from './SettingsDashboard';

function Settings() {
    const dispatch = useDispatch();
    const defaultStudio = useSelector(selectUserStudio);
    const userData = useSelector(selectUser);
    // Initial state for all fields in the settings form
    const [formData, setFormData] = useState({
        studioName: defaultStudio?.name || '',
        studioEmail: userData?.email || '',
        studioPhone: userData?.phone || '',
        // Add other fields here as they are added (e.g., studio address, phone number)
    });
    
    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const hasChanges = Object.values(formData).some((value, idx) => value !== Object.values(defaultStudio)[idx]);


    useEffect(() => {
        console.log(formData.studioName)
    }, [formData]);

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
            <AddProjectModal />

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
