// ImageDisplay.jsx
import React, { useState, useEffect } from 'react';

function ImageDisplay({ currentImage, nextImage, direction }) {
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });

  

  return (
    <div className="image-wrap">
      <div
        className={`image ${direction === 'left' ? 'slide-out-left' : direction === 'right' ? 'slide-out-right' : ''}`}
        style={{
          backgroundImage: `url("${currentImage.url}")`,
          backgroundSize: 'contain'
        }}
      ></div>
      {nextImage && (
        <div
          className={`image ${direction === 'left' ? 'slide-in-left' : direction === 'right' ? 'slide-in-right' : ''}`}
          style={{
            backgroundImage: `url("${nextImage.url}")`,
            backgroundSize: 'contain'
          }}
        ></div>
      )}
    </div>
  );
}

export default ImageDisplay;
