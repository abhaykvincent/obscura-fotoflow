import React, { memo, useRef, useEffect } from 'react';
import { getThumbnailUrl } from '../../utils/urlUtils';

/**
 * GalleryImage component for rendering individual images in the selection gallery.
 * Memoized to prevent unnecessary re-renders when other images change.
 */
const GalleryImage = memo(({ 
  image, 
  index, 
  isSelected, 
  isSelectionCompleted, 
  onToggleSelection, 
  onNotifyCompleted 
}) => {
  
  const handleClick = (e) => {
    // If it's a checkbox, stop propagation to avoid double trigger
    if (e.target.type === 'checkbox') e.stopPropagation();
    
    if (isSelectionCompleted) {
      if (onNotifyCompleted) onNotifyCompleted();
    } else {
      onToggleSelection(image);
    }
  };

  const handleCheckboxChange = (e) => {
    e.stopPropagation();
    if (isSelectionCompleted) {
      if (onNotifyCompleted) onNotifyCompleted();
    } else {
      onToggleSelection(image);
    }
  };

  return (
    <div className="photo" onClick={handleClick}>
      <img 
        className="img" 
        src={getThumbnailUrl(image.url)} 
        alt={`File ${index}`} 
        loading="lazy"
      />
      
      {!isSelectionCompleted && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleCheckboxChange}
        />
      )}
    </div>
  );
});

/**
 * SelectionGallery component for displaying a grid of images for selection.
 */
const SelectionGallery = ({ 
  isSelectionCompleted, 
  images, 
  selectedIdsSet, 
  onToggleSelection, 
  onLoadMore, 
  hasMore,
  onNotifyCompleted 
}) => {
  const observerTarget = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && onLoadMore) {
          onLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [onLoadMore, hasMore]);

  return (
    <div className="gallery">
      <div className="photos">
        {images.map((image, index) => {
          const isSelected = selectedIdsSet.has(image.url);
          
          return (
            <GalleryImage 
              key={image.url || index}
              image={image}
              index={index}
              isSelected={isSelected}
              isSelectionCompleted={isSelectionCompleted}
              onToggleSelection={onToggleSelection}
              onNotifyCompleted={onNotifyCompleted}
            />
          );
        })}
        {/* Sentinel element for infinite scroll */}
        <div ref={observerTarget} style={{ height: '20px', width: '100%', clear: 'both' }} />
      </div>
    </div>
  );
};

export default memo(SelectionGallery);
