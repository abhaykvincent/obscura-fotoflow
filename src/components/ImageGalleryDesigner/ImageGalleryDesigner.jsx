import React, { useState } from 'react';
import './ImageGalleryDesigner.scss';

const ImageGalleryDesigner = ({ project, collectionId }) => {
  const [title, setTitle] = useState(project.name);
  const [description, setDescription] = useState(project.type);
  const [textPosition, setTextPosition] = useState('center');

  const handleTextPositionChange = () => {
    const positions = ['center', 'top-left', 'top-right', 'bottom-left', 'bottom-right'];
    const currentIndex = positions.indexOf(textPosition);
    const nextIndex = (currentIndex + 1) % positions.length;
    setTextPosition(positions[nextIndex]);
  };

  const handleContentChange = (e, setter) => {
    setter(e.target.innerText);
  };

  return (
    <div className="image-gallery-designer">
      <div className="cover-photo-container">
        <div className={`text-overlay ${textPosition}`}>
          <h1
            className="cover-title"
            contentEditable
            onBlur={(e) => handleContentChange(e, setTitle)}
            suppressContentEditableWarning={true}
          >
            {title}
          </h1>
          <p
            className="cover-description"
            contentEditable
            onBlur={(e) => handleContentChange(e, setDescription)}
            suppressContentEditableWarning={true}
          >
            {description}
          </p>
        </div>
        <div className="cover-overlay"></div>
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
          <button onClick={handleTextPositionChange}>Text Position</button>
          <button>Overlay Colour</button>
          <button>Delete Cover</button>
        </div>
      </div>
    </div>
  );
};

export default ImageGalleryDesigner;
