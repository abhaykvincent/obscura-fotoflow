import React, { useState } from 'react';
import './ImageGalleryDesigner.scss';

const ImageGalleryDesigner = ({ project, collectionId }) => {
  const [title, setTitle] = useState(project.name);
  const [description, setDescription] = useState(project.type);
  const [textPosition, setTextPosition] = useState('center');
  const [overlayColor, setOverlayColor] = useState('rgba(0, 0, 0, 0.5)');
  const [showColorDialog, setShowColorDialog] = useState(true);
  let leaveTimeout;

  const colors = ['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff'];

  const handleColorSelect = (color) => {
    setOverlayColor(color);
    setShowColorDialog(false);
  };

  const handleTextPositionChange = () => {
    const positions = ['center', 'top-left', 'top-right', 'bottom-left', 'bottom-right'];
    const currentIndex = positions.indexOf(textPosition);
    const nextIndex = (currentIndex + 1) % positions.length;
    setTextPosition(positions[nextIndex]);
  };

  const handleContentChange = (e, setter) => {
    setter(e.target.innerText);
  };

  const handleMouseEnter = () => {
    clearTimeout(leaveTimeout);
    setShowColorDialog(true);
  };

  const handleMouseLeave = () => {
    leaveTimeout = setTimeout(() => {
      setShowColorDialog(true);
    }, 200);
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
        <div className="cover-overlay" style={{ backgroundColor: overlayColor }}></div>
        {project.projectCover ? (
          <img src={project.projectCover} alt="Cover" className="cover-photo" />
        ) : (
          <div className="cover-photo-placeholder">
            <span>Cover Photo</span>
          </div>
        )}


        <div className="toolbar">
          <div className="tools-container">

          <button className='button text-only  icon set-focus dark-icon'></button>
          <button className='button text-only  icon cover-size dark-icon' ></button>
          <button  className='button text-only  icon title-position dark-icon' 
            onClick={handleTextPositionChange}>
          </button>
          <div className="overlay-colour" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <button  className='button text-only  icon colour-wheel dark-icon'></button>
            {showColorDialog && (
              <div className="color-dialog">
                {colors.map((color) => (
                  <div
                    key={color}
                    className="color-swatch"
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorSelect(color)}
                  ></div>
                ))}
              </div>
            )}
          </div>
          <button  className='button text-only  icon delete-red dark-icon'></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageGalleryDesigner;
