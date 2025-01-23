// ImageDisplay.jsx
import React, { useState, useEffect } from 'react';

function ImageDisplay({ image }) {
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });

  

  return (
    <div className="image-wrap">
        <div
          className="image"
          style={{
            backgroundImage: `url("${image.url}")`,
            backgroundSize: 'contain'
          }}
        ></div>
    </div>
  );
}

export default ImageDisplay;
