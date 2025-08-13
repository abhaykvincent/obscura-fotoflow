import React from 'react';
import './ImageGalleryDesigner.scss';

const ImageGalleryDesigner = ({ project, collectionId }) => {
  console.log(project)
  return (
    <div className="image-gallery-designer">
      <div className="cover-photo-container">
        {project.projectCover ? (
          <img src={project.projectCover} alt="Cover" className="cover-photo" />
        ) : (
          <div className="cover-photo-placeholder">
            <span>Cover Photo</span>
          </div>
        )}
        <div className="toolbar">
          <button>Focus Point</button>
          <button>Cover Size</button>
          <button>Text Position</button>
          <button>Overlay Colour</button>
          <button>Delete Cover</button>
        </div>
      </div>
    </div>
  );
};

export default ImageGalleryDesigner;
