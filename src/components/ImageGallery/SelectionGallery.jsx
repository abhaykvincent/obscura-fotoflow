import React, { memo, useRef, useEffect } from 'react';
import { getThumbnailUrl } from '../../utils/urlUtils';
import { getPhotoKey } from '../../utils/selectionGalleryUtils';

/**
 * GalleryImage component for rendering individual images in the selection gallery.
 * Memoized to prevent unnecessary re-renders when other images change.
 * Supports both legacy url-based selection ids and stable photoId keys.
 */
const GalleryImage = memo(({
  image,
  index,
  isSelected,
  isSelectionCompleted,
  onToggleSelection,
  onNotifyCompleted,
  categoryBadge = null,
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
    <div className={`photo ${isSelected ? 'selected' : ''}`} onClick={handleClick}>
      <img
        className="img"
        src={getThumbnailUrl(image.url)}
        alt={`File ${index}`}
        loading="lazy"
      />

      {categoryBadge && isSelected && (
        <span className="photo-category-badge">{categoryBadge}</span>
      )}

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
 * selectedIdsSet may contain urls (legacy) or photoKeys (new). Both match.
 */
const SelectionGallery = ({
  isSelectionCompleted,
  images,
  selectedIdsSet,
  onToggleSelection,
  onLoadMore,
  hasMore,
  onNotifyCompleted,
  categoryByPhoto = {},
  categories = [],
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

  const catNameById = {};
  (categories || []).forEach((c) => { catNameById[c.id] = c.name; });

  return (
    <div className="gallery">
      <div className="photos">
        {images.map((image, index) => {
          const key = getPhotoKey(image);
          const isSelected = selectedIdsSet.has(image.url) || (key && selectedIdsSet.has(key));
          const catId = (key && categoryByPhoto[key]) || categoryByPhoto[image.url];
          const badge = catId ? (catNameById[catId] || null) : null;

          return (
            <GalleryImage
              key={key || image.url || index}
              image={image}
              index={index}
              isSelected={isSelected}
              isSelectionCompleted={isSelectionCompleted}
              onToggleSelection={onToggleSelection}
              onNotifyCompleted={onNotifyCompleted}
              categoryBadge={badge}
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
