// ImageDisplay.jsx
import React, { useState, useEffect } from 'react';

function ImageDisplay({ image }) {
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const img = new Image();
    img.src = image.url;
    img.onload = () => setImageSize({ width: img.width, height: img.height });
  }, [image.url]);

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
