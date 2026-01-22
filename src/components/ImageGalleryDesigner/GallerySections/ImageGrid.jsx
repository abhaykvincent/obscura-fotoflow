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

const TARGET_ROW_HEIGHT = 200;
const GAP = 10;
const MOBILE_BREAKPOINT = 768;

const computeLayout = (images, containerWidth, targetRowHeight, gap, isMobile, tempDimensions = {}) => {
  if (!containerWidth || !images || images.length === 0) return [];

  const getAspectRatio = (img) => {
    if (img.dimensions?.width && img.dimensions?.height) {
      return img.dimensions.width / img.dimensions.height;
    }
    const temp = tempDimensions[img.url];
    if (temp?.width && temp?.height) {
      return temp.width / temp.height;
    }
    return 1; // Default to square
  };

  const rows = [];
  let currentRow = [];
  let currentRowWidth = 0;

  images.forEach(image => {
    const aspectRatio = getAspectRatio(image);
    const scaledWidth = targetRowHeight * aspectRatio;

    let shouldBreak = false;
    if (currentRow.length > 0) {
      if (isMobile) {
        if (currentRow.length >= 2) shouldBreak = true;
      } else {
        if (currentRowWidth + scaledWidth + gap > containerWidth) {
          shouldBreak = true;
        }
      }
    }

    if (shouldBreak) {
      const totalAspectRatio = currentRow.reduce((acc, img) => acc + getAspectRatio(img), 0);
      const rowHeight = (containerWidth - (currentRow.length - 1) * gap) / totalAspectRatio;

      rows.push(currentRow.map(img => ({
        ...img,
        width: rowHeight * getAspectRatio(img),
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
    if (isMobile || currentRowWidth > containerWidth * 0.8) {
      const totalAspectRatio = currentRow.reduce((acc, img) => acc + getAspectRatio(img), 0);
      const rowHeight = Math.min(targetRowHeight * 1.5, (containerWidth - (currentRow.length - 1) * gap) / totalAspectRatio);
      rows.push(currentRow.map(img => ({
        ...img,
        width: rowHeight * getAspectRatio(img),
        height: rowHeight,
      })));
    } else {
      rows.push(currentRow.map(img => ({
        ...img,
        width: targetRowHeight * getAspectRatio(img),
        height: targetRowHeight,
      })));
    }
  }

  return rows;
};

const SortableImage = ({ image, sectionId, alt, style: propsStyle }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: image.url,
    data: {
      type: 'image',
      image,
      fromSection: sectionId,
    },
  });

  const style = {
    transform: transform ? CSS.Translate.toString({ ...transform, x: 0 }) : undefined,
    transition: [
      transition,
      'width 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
      'height 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
      'opacity 0.2s ease'
    ].filter(Boolean).join(', '),
    opacity: isDragging ? 0 : 1,
    ...propsStyle,
  };

  return (
    <div 
      className="image-grid-item" 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners} 
      onMouseDown={(e) => e.stopPropagation()}
    >
      <img 
        src={image.url} 
        alt={alt} 
        loading="lazy"
        style={{ width: '100%', height: '100%', display: 'block', borderRadius: '4px', objectFit: 'cover' }} 
      />
    </div>
  );
};

const LazyRow = ({ children, height }) => {
  const [isVisible, setIsVisible] = useState(false);
  const rowRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      },
      { rootMargin: '400px' } // Buffer for smoother scrolling
    );

    if (rowRef.current) {
      observer.observe(rowRef.current);
    }

    return () => {
      if (rowRef.current) {
        observer.unobserve(rowRef.current);
      }
    };
  }, []);

  return (
    <div ref={rowRef} className="image-grid-row" style={{ minHeight: isVisible ? 'auto' : `${height}px` }}>
      {isVisible ? children : null}
    </div>
  );
};

export const ImageDragOverlay = ({ image }) => {
  if (!image) return null;
  return (
    <div style={{ width: image.width, height: image.height, borderRadius: '4px', overflow: 'hidden' }}>
      <img
        src={image.url}
        alt="dragged item"
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          objectFit: 'cover',
          opacity: 0.9
        }}
      />
    </div>
  );
};

const ImageGrid = ({ id, collectionId, collectionName, section, onSectionUpdate, toggleScaleControl, isViewOnly, onImageClick }) => {
  const dispatch = useDispatch();
  const domain = useSelector(selectDomain);
  const studio = useSelector(selectStudio);
  
  const [tempDimensions, setTempDimensions] = useState({});
  const [containerWidth, setContainerWidth] = useState(0);
  const [layout, setLayout] = useState([]);
  
  const containerRef = useRef(null);
  const pendingRequests = useRef(new Set());
  const images = section.images || [];
  const gridScale = section.gridSettings?.scale || 1;

  // Fetch missing dimensions
  useEffect(() => {
    const missing = images.filter(img => 
      (!img.dimensions?.width || !img.dimensions?.height) && 
      !tempDimensions[img.url] && 
      !pendingRequests.current.has(img.url)
    );

    missing.forEach(img => {
      pendingRequests.current.add(img.url);
      const i = new Image();
      i.onload = () => {
        setTempDimensions(prev => ({
          ...prev,
          [img.url]: { width: i.naturalWidth, height: i.naturalHeight }
        }));
        pendingRequests.current.delete(img.url);
      };
      i.onerror = () => pendingRequests.current.delete(img.url);
      i.src = img.url;
    });
  }, [images, tempDimensions]);

  // Heal data: update section with discovered dimensions
  useEffect(() => {
    if (isViewOnly || !onSectionUpdate) return;

    const imagesToUpdate = images.filter(img => 
      (!img.dimensions?.width || !img.dimensions?.height) && tempDimensions[img.url]
    );

    if (imagesToUpdate.length > 0) {
      const updatedImages = images.map(img => {
        if ((!img.dimensions?.width || !img.dimensions?.height) && tempDimensions[img.url]) {
          return { ...img, dimensions: tempDimensions[img.url] };
        }
        return img;
      });
      onSectionUpdate({ ...section, images: updatedImages });
    }
  }, [images, tempDimensions, isViewOnly, onSectionUpdate, section]);

  // Handle Resize
  useLayoutEffect(() => {
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Compute Layout
  useLayoutEffect(() => {
    if (images.length && containerWidth) {
      const targetHeight = TARGET_ROW_HEIGHT * gridScale;
      const isMobile = containerWidth < MOBILE_BREAKPOINT;
      const computedLayout = computeLayout(images, containerWidth, targetHeight, GAP, isMobile, tempDimensions);
      setLayout(computedLayout);
    }
  }, [images, containerWidth, tempDimensions, gridScale]);

  const onDrop = useCallback((acceptedFiles) => {
    handleUpload(domain, acceptedFiles, id, collectionId, 0, dispatch, collectionName, section.id, undefined, studio.bucketUrl);
  }, [section.id, dispatch, domain, id, collectionId, collectionName, studio.bucketUrl]);

  const handleFileSelect = (event) => {
    onDrop(Array.from(event.target.files));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onDrop(Array.from(e.dataTransfer.files));
  };

  const renderUploadArea = () => (
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
  );

  if (images.length === 0) {
    return (
      <div className="image-grid-section">
        {isViewOnly ? (
          <div className="no-images-message"><p>No images to display.</p></div>
        ) : renderUploadArea()}
      </div>
    );
  }

  return (
    <div className="image-grid-section">
      {isViewOnly ? (
        <div className="image-grid-display" ref={containerRef}>
          {layout.map((row, rowIndex) => (
            <LazyRow key={rowIndex} height={row[0]?.height || TARGET_ROW_HEIGHT}>
              {row.map((image, imgIndex) => (
                <div 
                  key={image.url} 
                  className="image-grid-item" 
                  style={{ width: image.width, height: image.height, cursor: onImageClick ? 'pointer' : 'default' }}
                  onClick={() => onImageClick?.(image, images.findIndex(img => img.url === image.url))}
                >
                  <img 
                    src={image.url} 
                    alt={`Gallery item ${imgIndex}`} 
                    loading="lazy"
                    style={{ width: '100%', height: '100%', display: 'block', borderRadius: '4px', objectFit: 'cover' }} 
                  />
                </div>
              ))}
            </LazyRow>
          ))}
        </div>
      ) : (
        <SortableContext items={images.map(img => img.url)} strategy={rectSortingStrategy}>
          <div className="image-grid-display" ref={containerRef}>
            {layout.map((row, rowIndex) => (
              <div key={rowIndex} className="image-grid-row">
                {row.map((image, imgIndex) => (
                  <SortableImage
                    key={image.url}
                    image={image}
                    sectionId={section.id}
                    alt={`Gallery item ${imgIndex}`}
                    style={{ width: image.width, height: image.height }}
                  />
                ))}
              </div>
            ))}
          </div>
        </SortableContext>
      )}
    </div>
  );
};

export default ImageGrid;