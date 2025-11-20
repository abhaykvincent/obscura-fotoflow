import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { showAlert } from '../../app/slices/alertSlice';
import { addDummyProjects, addDummyUsers } from '../../app/slices/adminPaneSlice'; // Import addDummyUsers
import { selectDomain } from '../../app/slices/authSlice';
import './AdminPanel.scss';

function DeveloperTools() {
    const dispatch = useDispatch();
    const domain = useSelector(selectDomain);

    const handleAddDummyProjects = async () => {
        if (!domain) {
            dispatch(showAlert({ type: 'error', message: 'Domain not found. Cannot add dummy projects.' }));
            return;
        }
        try {
            await dispatch(addDummyProjects({ domain, count: 20 })).unwrap();
            dispatch(showAlert({ type: 'success', message: 'Dummy projects added successfully!' }));
        } catch (error) {
            dispatch(showAlert({ type: 'error', message: `Error adding dummy projects: ${error.message}` }));
        }
    };

    const handleAddDummyUsers = async () => {
        try {
            await dispatch(addDummyUsers()).unwrap();
            dispatch(showAlert({ type: 'success', message: '20 Dummy users added successfully!' }));
        } catch (error) {
            dispatch(showAlert({ type: 'error', message: `Error adding dummy users: ${error.message}` }));
        }
    };

    return (
        <main className="admin-panel billing-container">
            <h1 className="admin-title">Developer Tools</h1>
            <div className="admin-dashboard">
                <div className="admin-actions">
                    <div className="button secondary outline" onClick={handleAddDummyProjects}>
                        Add Dummy Projects
                    </div>
                    <div className="button secondary outline" onClick={handleAddDummyUsers}>
                        Add Dummy Users
                    </div>
                </div>
            </div>
        </main>
    );
}

export default DeveloperTools;
