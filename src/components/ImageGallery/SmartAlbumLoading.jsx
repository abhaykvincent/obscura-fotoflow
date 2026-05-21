import React from 'react';
import { toTitleCase } from '../../utils/stringUtils';

const SmartAlbumLoading = ({ project, onBack }) => {
  const renderContent = () => {
    if (project?.projectCover) {
      return (
        <div className="loading-cover-container">
          <img 
            src={project.projectCover} 
            alt="Loading Cover" 
            className="loading-cover"
            style={{ 
              objectPosition: project.focusPoint 
                ? `${project.focusPoint.x * 100}% ${project.focusPoint.y * 100}%` 
                : 'center' 
            }}
          />
          <div className="loading-overlay">
            <div className="loading-content">
              <h1 className="project-name">{toTitleCase(project.name || '')}</h1>
              <div className="loading-indicator">
                <div className="spinner"></div>
                <span>Loading Gallery...</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="loading-fallback">
        <div className="spinner"></div>
        <p>Loading {toTitleCase(project?.name || 'Gallery')}...</p>
      </div>
    );
  };

  return (
    <div className="smart-album-loading">
      <button 
        className="nav-button prev back-button" 
        onClick={onBack}
        title="Go Back"
      />
      {renderContent()}
    </div>
  );
};

export default SmartAlbumLoading;
