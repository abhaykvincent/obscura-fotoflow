import React from 'react';
import { useSelector } from 'react-redux';
import './LoadingScreen.scss';

const LoadingScreen = () => {
    const { show, context, subcontext } = useSelector((state) => state.loading);

    if (!show) {
        return null;
    }

    return (
        <div className="loading-container">
            <div className="loading-spinner"></div>
            <div className="loading-context-container">
                <p className="loading-context">{context}</p>
                <p className="loading-subcontext">{subcontext}</p>
            </div>
        </div>
    );
};

export default LoadingScreen;
