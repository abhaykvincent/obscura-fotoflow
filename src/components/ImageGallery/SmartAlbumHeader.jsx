import React from 'react';
import { toTitleCase } from '../../utils/stringUtils';
import { getCoverUrl } from '../../utils/urlUtils';

const SmartAlbumHeader = ({ galleryData, project, collectionName }) => {
  const { projectCover, focusPoint, overlayColor, coverSize, textPosition } = galleryData;

  return (
    <>
      <div className="project-header">
        {projectCover ? (
          <img 
            src={getCoverUrl(projectCover)} 
            alt="Cover" 
            className="banner cover" 
            loading="lazy"
            style={{ 
              objectPosition: focusPoint 
                ? `${focusPoint.x * 100}% ${focusPoint.y * 100}%` 
                : 'center' 
            }} 
          />
        ) : (
          <div className="cover-photo-placeholder">
            <span>Cover Photo</span>
          </div>
        )}
        <div className="gallery-info">
          <h1 className="project-name">{toTitleCase(project?.name || '')}</h1>
          <p className="project-type">{toTitleCase(collectionName || '')}</p>
        </div>
      </div>

      <div className={`cover-photo-container ${coverSize || ''}`}>
        <div className={`text-overlay ${textPosition || ''}`} />
        <div 
          className="cover-overlay" 
          style={{ backgroundColor: overlayColor }} 
        />
      </div>
    </>
  );
};

export default SmartAlbumHeader;
