import React, { useState, useEffect, useRef } from 'react';
import './masanory-grid.scss';
import useLoadedImages from './useLoadedImages';

const ImageGallery = ({ imageUrls,galleryRef }) => {  // Accept image URLs as a prop
  const [scale, setScale] = useState(1);
  const [rows, setRows] = useState([]);
  const { loadedImages, loadImages } = useLoadedImages(imageUrls);
  
  useEffect(() => {
	loadImages(loadedImages)
    if (loadedImages.length === 0) return;
	console.log(loadedImages)
    const computeRows = () => {
      const containerWidth = galleryRef.current.offsetWidth;
      const targetHeight = 200 * scale;
      let row = [];
      let currentWidth = 0;
      let newRows = [];

      loadedImages.forEach(({ src, width, height }) => {
        const aspectRatio = width / height;
        const scaledWidth = targetHeight * aspectRatio;

        if (currentWidth + scaledWidth > containerWidth) {
          const rowScale = containerWidth / currentWidth;
          row = row.map((img) => ({
            ...img,
            width: img.width * rowScale,
            height: img.height * rowScale,
          }));
          newRows.push(row);
          row = [];
          currentWidth = 0;
        }

        row.push({
          src,
          width: scaledWidth,
          height: targetHeight,
        });
        currentWidth += scaledWidth;
      });

      if (row.length > 0) {
        const rowScale = containerWidth / currentWidth;
        row = row.map((img) => ({
          ...img,
          width: img.width * rowScale,
          height: img.height * rowScale,
        }));
        newRows.push(row);
      }

      setRows(newRows);
    };

    computeRows();
  }, [loadedImages, scale]);

  const handleScaleChange = (event) => {
    setScale(Number(event.target.value));
  };

  return (
    <div className="gallery-container">
      <div className="scale-control">
        <input
          type="range"
          id="scale"
          name="scale"
          min="1.5"
          max="3"
          step="0.1"
          value={scale}
          onChange={handleScaleChange}
        />
      </div>
      <div className="gallery" >
        {rows.map((row, rowIndex) => (
          <div className="gallery-row" key={rowIndex}>
            {row.map(({ src, width, height }, index) => (
              <div
                className="gallery-item"
                key={index}
                style={{ width: `${width}px`, height: `${height}px` }}
              >
                <img src={src} alt={`Gallery ${index}`} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageGallery;
