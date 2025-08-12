import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeModal } from '../../app/slices/modalSlice';
import './ViewDetailsDrawer.scss';

function ViewDetailsDrawer() {
    const dispatch = useDispatch();
    const { isOpen, type, data } = useSelector((state) => state.modal);

    const isDrawerOpen = isOpen && type === 'viewDetailsDrawer';

    const handleClose = () => {
        dispatch(closeModal());
    };

    if (!isDrawerOpen) {
        return null;
    }

    return (
        <div className="drawer-overlay" onClick={handleClose}>
            <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
                <div className="drawer-header">
                    <h2>Details</h2>
                    <button className="close-button" onClick={handleClose}>&times;</button>
                </div>
                <div className="drawer-body">
                    {data ? (
                        <pre>{JSON.stringify(data, null, 2)}</pre>
                    ) : (
                        <p>No details available.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ViewDetailsDrawer;