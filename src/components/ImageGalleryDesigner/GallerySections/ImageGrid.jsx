import React, { useState, useCallback, useRef, useLayoutEffect, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { handleUpload } from '../../../utils/uploadOperations';
import './ImageGrid.scss';
import { selectDomain } from '../../../app/slices/authSlice';
import { selectStudio } from '../../../app/slices/studioSlice';
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const computeLayout = (images, containerWidth, targetRowHeight, gap, isMobile) => {
  if (!containerWidth || !images || images.length === 0) return [];

  const rows = [];
  let currentRow = [];
  let currentRowWidth = 0;

  images.forEach(image => {
    if (!image.dimensions || !image.dimensions.width || !image.dimensions.height) {
      return;
    }
    const aspectRatio = image.dimensions.width / image.dimensions.height;
    const scaledWidth = targetRowHeight * aspectRatio;

    let shouldBreak = false;
    if (currentRow.length > 0) {
      if (isMobile) {
        const isLandscape = aspectRatio >= 1;
        const currentHasLandscape = currentRow.some(img => (img.dimensions.width / img.dimensions.height) >= 1);
        if (currentHasLandscape || isLandscape || currentRow.length >= 2) {
          shouldBreak = true;
        }
      } else {
        if (currentRowWidth + scaledWidth + (currentRow.length > 0 ? gap : 0) > containerWidth) {
          shouldBreak = true;
        }
      }
    }

    if (shouldBreak) {
      const totalAspectRatio = currentRow.reduce((acc, img) => acc + (img.dimensions.width / img.dimensions.height), 0);
      const rowHeight = (containerWidth - (currentRow.length - 1) * gap) / totalAspectRatio;

      rows.push(currentRow.map(img => ({
        ...img,
        width: rowHeight * (img.dimensions.width / img.dimensions.height),
        height: rowHeight,
      })));

      currentRow = [image];
      currentRowWidth = scaledWidth;
    } else {
      currentRow.push(image);
      currentRowWidth += scaledWidth + (currentRow.length > 1 ? gap : 0);
    }
  });

  if (currentRow.length > 0) {
    if (isMobile) {
      const totalAspectRatio = currentRow.reduce((acc, img) => acc + (img.dimensions.width / img.dimensions.height), 0);
      const rowHeight = (containerWidth - (currentRow.length - 1) * gap) / totalAspectRatio;
      rows.push(currentRow.map(img => ({
        ...img,
        width: rowHeight * (img.dimensions.width / img.dimensions.height),
        height: rowHeight,
      })));
    } else {
      rows.push(currentRow.map(img => ({
        ...img,
        width: targetRowHeight * (img.dimensions.width / img.dimensions.height),
        height: targetRowHeight,
      })));
    }
  }

  return rows;
};

const SortableImage = ({ image, sectionId, ...props }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: image.url,
    data: {
      type: 'image',
      image,
      fromSection: sectionId,
    },
  });
  const combinedTransition = [
    transition,
    'width 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
    'height 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
    'opacity 0.2s ease'
  ].filter(Boolean).join(', ');
let newTransform;
  if(transform !== null){
    newTransform={
      x: 0,
      y: transform.y,
      scaleX: transform.scaleX,
      scaleY: transform.scaleY,
    }
    console.log(transform)

  }
  const style = {
    transform: CSS.Translate.toString(newTransform),
    transition: combinedTransition,
    opacity: isDragging ? 0 : 1, // Hide original when dragging
    ...props.style,
  };

  return (
    <div className="image-grid-item" ref={setNodeRef} style={style} {...attributes} {...listeners} onMouseDown={(e) => e.stopPropagation()}>
      <img src={image.url} alt={props.alt} style={{ width: '100%', height: '100%', display: 'block', borderRadius: '4px', objectFit: 'cover' }} />
    </div>
  );
};

// New component for the drag overlay
export const ImageDragOverlay = ({ image }) => {
  if (!image) return null;
  return (
    <div style={{ width: image.width, height: image.height, borderRadius: '4px' }}>
      <img
        src={image.url}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          borderRadius: '4px',
          objectFit: 'cover',
          opacity:0.9
        }}
        alt="dragged image"
      />
    </div>
  );
};

// ... imports ...

// ... computeLayout ...

// ... SortableImage ... (keep as is)

// ... ImageDragOverlay ... (keep as is)

const ImageGrid = ({id, collectionId,collectionName, section, onSectionUpdate, toggleScaleControl, isViewOnly, onImageClick }) => {
  const [showScaleControl, setShowScaleControl] = useState(false);

  useEffect(() => {
    if (toggleScaleControl) {
      toggleScaleControl.current = () => setShowScaleControl(prev => !prev);
    }
  }, [toggleScaleControl]);
  
  const handleScaleChange = (event) => {
    const newScale = Number(event.target.value);
    onSectionUpdate({ ...section, gridSettings: { ...section.gridSettings, scale: newScale } });
  };
  const dispatch = useDispatch();
  const images = section.images || [];
  const domain = useSelector(selectDomain);
  const studio = useSelector(selectStudio);

  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [layout, setLayout] = useState([]);

  useLayoutEffect(() => {
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        const newContainerWidth = entry.contentRect.width;
        setContainerWidth(newContainerWidth);
      }
    });

    const currentRef = containerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  useLayoutEffect(() => {
    if (images && containerWidth) {
      const targetRowHeight = 200;
      const gap = 10;
      const isMobile = containerWidth < 768;
      const computedLayout = computeLayout(images, containerWidth, targetRowHeight, gap, isMobile);
      setLayout(computedLayout);
    }
  }, [images, containerWidth]);

  const onDrop = useCallback((acceptedFiles) => {
    const importFileSize = 0;
    handleUpload(domain, acceptedFiles, id, collectionId, importFileSize, dispatch, collectionName, section.id, undefined, studio.bucketUrl);
  }, [section.id, dispatch, domain, id, collectionId, collectionName, studio.bucketUrl]);

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    onDrop(files);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const files = Array.from(event.dataTransfer.files);
    onDrop(files);
  };

  return (
    <div className="image-grid-section">
      {images.length === 0 && !isViewOnly ? (
        <div
          className="upload-area"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => document.getElementById(`fileInput-${section.id}`).click()}
        >
          <input
            type="file"
            id={`fileInput-${section.id}`}
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <div className="upload-content">
            <svg className="upload-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
            </svg>
            <p className="upload-main-text">Drag & drop files here</p>
            <p className="upload-sub-text">or click to upload</p>
          </div>
        </div>
      ) : images.length === 0 && isViewOnly ? (
        <div className="no-images-message">
          <p>No images to display.</p>
        </div>
      ) : (
        isViewOnly ? (
           <div className="image-grid-display" ref={containerRef} data-section-id={section.id}>
            {layout.map((row, rowIndex) => (
              <div key={rowIndex} className="image-grid-row">
                {row.map((image, imgIndex) => (
                   <div 
                      key={image.url} 
                      className="image-grid-item" 
                      style={{ width: image.width, height: image.height, cursor: onImageClick ? 'pointer' : 'default' }}
                      onClick={() => onImageClick && onImageClick(image, images.findIndex(img => img.url === image.url))}
                   >
                    <img src={image.url} alt={`Gallery Image ${imgIndex}`} style={{ width: '100%', height: '100%', display: 'block', borderRadius: '4px', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
        <SortableContext items={images.map(img => img.url)} strategy={rectSortingStrategy}>
          <div className="image-grid-display" ref={containerRef} data-section-id={section.id}>
            {layout.map((row, rowIndex) => (
              <div key={rowIndex} className="image-grid-row">
                {row.map((image, imgIndex) => (
                  <SortableImage
                    key={image.url}
                    image={image}
                    sectionId={section.id}
                    alt={`Gallery Image ${imgIndex}`}
                    style={{ width: image.width, height: image.height }}
                  />
                ))}
              </div>
            ))}
          </div>
        </SortableContext>
        )
      )}
    </div>
  );
};

export default ImageGrid;