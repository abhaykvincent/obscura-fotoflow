import React, { useState, useEffect, useRef } from 'react';
import './masanory-grid.scss';
import useLoadedImages from './useLoadedImages';

const images = [
  // Add your image URLs here
  'https://images.squarespace-cdn.com/content/v1/5a1fac7e914e6b30d737146f/1683652897432-UKUTT07XCKS9NI9NLOXT/228A4750a.jpg',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTlR9K3tgLkjrmtjykLeqMt2QGq110SC-mPaP5DDjhOC5z1OcVrxXTBXhZXoKqf3et0ZFk&usqp=CAU',
  'https://pebblely.com/ideas/perfume/use-water.jpg',
  'https://pebblely.com/ideas/perfume/black-white.jpg',
  'https://cdn4.beautinow.com/wp-content/uploads/2023/08/The_Ultimate_Guide_to_Perfume_Photography_aa48d40f4ef542b192ee69c49e911362.jpgv=1691390651',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSar--Y9CqXMtUBos7xd-GgQFvodkFcaCCoirIg-Yijbg&s',
  'https://i.pinimg.com/originals/3e/74/89/3e7489a038bb6747ed2a4e7e6c0c8560.jpg',
  // Add your image URLs here
  'https://cdn4.beautinow.com/wp-content/uploads/2023/08/The_Ultimate_Guide_to_Perfume_Photography_aa48d40f4ef542b192ee69c49e911362.jpgv=1691390651',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSar--Y9CqXMtUBos7xd-GgQFvodkFcaCCoirIg-Yijbg&s',
  'https://i.pinimg.com/originals/3e/74/89/3e7489a038bb6747ed2a4e7e6c0c8560.jpg',
  'https://images.squarespace-cdn.com/content/v1/5a1fac7e914e6b30d737146f/1683652897432-UKUTT07XCKS9NI9NLOXT/228A4750a.jpg',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTlR9K3tgLkjrmtjykLeqMt2QGq110SC-mPaP5DDjhOC5z1OcVrxXTBXhZXoKqf3et0ZFk&usqp=CAU',
  'https://pebblely.com/ideas/perfume/use-water.jpg',
  'https://pebblely.com/ideas/perfume/black-white.jpg',
  // Add your image URLs here
  'https://images.squarespace-cdn.com/content/v1/5a1fac7e914e6b30d737146f/1683652897432-UKUTT07XCKS9NI9NLOXT/228A4750a.jpg',
  'https://cdn4.beautinow.com/wp-content/uploads/2023/08/The_Ultimate_Guide_to_Perfume_Photography_aa48d40f4ef542b192ee69c49e911362.jpgv=1691390651',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSar--Y9CqXMtUBos7xd-GgQFvodkFcaCCoirIg-Yijbg&s',
  'https://i.pinimg.com/originals/3e/74/89/3e7489a038bb6747ed2a4e7e6c0c8560.jpg',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTlR9K3tgLkjrmtjykLeqMt2QGq110SC-mPaP5DDjhOC5z1OcVrxXTBXhZXoKqf3et0ZFk&usqp=CAU',
  'https://pebblely.com/ideas/perfume/use-water.jpg',
  'https://pebblely.com/ideas/perfume/black-white.jpg',
  // Add your image URLs here
  
  'https://pebblely.com/ideas/perfume/black-white.jpg',
  'https://cdn4.beautinow.com/wp-content/uploads/2023/08/The_Ultimate_Guide_to_Perfume_Photography_aa48d40f4ef542b192ee69c49e911362.jpgv=1691390651',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSar--Y9CqXMtUBos7xd-GgQFvodkFcaCCoirIg-Yijbg&s',
  'https://i.pinimg.com/originals/3e/74/89/3e7489a038bb6747ed2a4e7e6c0c8560.jpg','https://images.squarespace-cdn.com/content/v1/5a1fac7e914e6b30d737146f/1683652897432-UKUTT07XCKS9NI9NLOXT/228A4750a.jpg',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTlR9K3tgLkjrmtjykLeqMt2QGq110SC-mPaP5DDjhOC5z1OcVrxXTBXhZXoKqf3et0ZFk&usqp=CAU',
  'https://pebblely.com/ideas/perfume/use-water.jpg',
  // Add more image URLs
];
const ImageGallery = () => {
	const [scale, setScale] = useState(1);
	const [rows, setRows] = useState([]);
	const galleryRef = useRef(null);
	const loadedImages = useLoadedImages(images);
  
	useEffect(() => {
	  if (loadedImages.length === 0) return;
  
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
		  <label htmlFor="scale">Adjust Scale: </label>
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
		<div className="gallery" ref={galleryRef}>
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