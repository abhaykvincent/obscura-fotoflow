import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { showAlert } from '../../app/slices/alertSlice';
import { addDummyProjects } from '../../app/slices/adminPaneSlice';
import { selectDomain } from '../../app/slices/authSlice';
import './AdminPanel.scss';

function AdminPane() {
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

    return (
        <main className="admin-panel billing-container">
            <h1 className="admin-title">Admin Pane</h1>
            <div className="admin-dashboard">
                <div className="admin-actions">
                    <div className="button secondary outline" onClick={handleAddDummyProjects}>
                        Add Dummy Projects
                    </div>
                </div>
            </div>
        </main>
    );
}

export default AdminPane;
