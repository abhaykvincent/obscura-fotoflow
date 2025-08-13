import React, { useState } from 'react';
import './ImageGalleryDesigner.scss';

const ImageGalleryDesigner = ({ project, collectionId }) => {
  const [title, setTitle] = useState(project.name);
  const [description, setDescription] = useState(project.type);
  const [textPosition, setTextPosition] = useState('center');
  const [overlayColor, setOverlayColor] = useState('rgba(0, 0, 0, 0.5)');
  const [showColorDialog, setShowColorDialog] = useState(false);

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
          <button>Focus Point</button>
          <button>Cover Size</button>
          <button onClick={handleTextPositionChange}>Text Position</button>
          <button onClick={() => setShowColorDialog(!showColorDialog)}>Overlay Colour</button>
          <button>Delete Cover</button>
        </div>
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
    </div>
  );
};

export default ImageGalleryDesigner;
