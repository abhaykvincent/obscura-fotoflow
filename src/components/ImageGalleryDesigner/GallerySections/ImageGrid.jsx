import React, { useState, useCallback, useRef, useLayoutEffect, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { handleUpload } from '../../../utils/uploadOperations';
import './ImageGrid.scss';
import { selectDomain } from '../../../app/slices/authSlice';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const computeLayout = (images, containerWidth, targetRowHeight, gap) => {
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

    if (currentRowWidth + scaledWidth + (currentRow.length > 0 ? gap : 0) > containerWidth && currentRow.length > 0) {
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
    rows.push(currentRow.map(img => ({
      ...img,
      width: targetRowHeight * (img.dimensions.width / img.dimensions.height),
      height: targetRowHeight,
    })));
  }

  return rows;
};

const SortableImage = ({ image, ...props }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: image.url });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1, // Hide original when dragging
    ...props.style,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} onMouseDown={(e) => e.stopPropagation()}>
      <img src={image.url} alt={props.alt} style={{ width: '100%', height: '100%', display: 'block', borderRadius: '4px' }} />
    </div>
  );
};

const ImageGrid = ({id, collectionId,collectionName, section, onSectionUpdate }) => {
  const dispatch = useDispatch();
  const [images, setImages] = useState(section.images || []);
  const domain = useSelector(selectDomain);

  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [layout, setLayout] = useState([]);
  const [activeImage, setActiveImage] = useState(null);

  useLayoutEffect(() => {
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        setContainerWidth(entry.contentRect.width);
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

  useEffect(() => {
    if (images && containerWidth) {
      const targetRowHeight = 200;
      const gap = 10;
      const computedLayout = computeLayout(images, containerWidth, targetRowHeight, gap);
      setLayout(computedLayout);
    }
  }, [images, containerWidth]);

  const onDrop = useCallback((acceptedFiles) => {
    const importFileSize = 0;
    handleUpload(domain, acceptedFiles, id, collectionId, importFileSize, dispatch, collectionName, section.id);
  }, [section.id, dispatch, domain, id, collectionId, collectionName]);

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

  React.useEffect(() => {
    if (section.images) {
      setImages(section.images);
    }
  }, [section.images]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleImageDragStart = (event) => {
    const { active } = event;
    const image = images.find((img) => img.url === active.id);
    if (image) {
      for (const row of layout) {
        const layoutImage = row.find(img => img.url === image.url);
        if (layoutImage) {
          setActiveImage(layoutImage);
          break;
        }
      }
    }
  };

  const handleImageDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((img) => img.url === active.id);
      const newIndex = images.findIndex((img) => img.url === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const newImages = arrayMove(images, oldIndex, newIndex);
        setImages(newImages);
        onSectionUpdate({ ...section, images: newImages });
      }
    }
    setActiveImage(null);
  };

  return (
    <div className="image-grid-section">
      {images.length === 0 ? (
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
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleImageDragStart} onDragEnd={handleImageDragEnd}>
          <SortableContext items={images.map(img => img.url)} strategy={rectSortingStrategy}>
            <div className="image-grid-display" ref={containerRef}>
              {layout.map((row, rowIndex) => (
                <div key={rowIndex} className="image-grid-row">
                  {row.map((image, imgIndex) => (
                    <SortableImage
                      key={image.url}
                      image={image}
                      alt={`Gallery Image ${imgIndex}`}
                      style={{ width: image.width, height: image.height }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeImage ? (
              <img
                src={activeImage.url}
                style={{
                  width: activeImage.width,
                  height: activeImage.height,
                  borderRadius: '4px',
                }}
                alt="dragged image"
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
};

export default ImageGrid;