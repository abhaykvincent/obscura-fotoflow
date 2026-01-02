// ImageDisplay.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useAnimation } from 'framer-motion';
import { getThumbnailUrl } from '../../utils/urlUtils';

const swipeConfidenceThreshold = 10000;
const swipePower = (offset, velocity) => {
  return Math.abs(offset) * velocity;
};

function ImageDisplay({ image, direction, paginate, closePreview, collectionId, resetControlsTimeout, isControlsVisible }) {
  // Image Loading State
  const [imgSrc, setImgSrc] = useState(getThumbnailUrl(image.url, collectionId));
  const [isHighResLoaded, setIsHighResLoaded] = useState(false);

  // Zoom & Pan State
  const [isZoomed, setIsZoomed] = useState(false);
  const controls = useAnimation();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(1);
  
  // Touch Refs for Pinch
  const distRef = useRef(0);
  const initialScaleRef = useRef(1);

  useEffect(() => {
    // Reset state for new image
    setIsHighResLoaded(false);
    setImgSrc(getThumbnailUrl(image.url, collectionId));
    setIsZoomed(false);
    scale.set(1);
    x.set(0);
    y.set(0);
    
    // Start entrance animation
    controls.start("center");

    // Load High Res
    const highResImg = new Image();
    highResImg.src = image.url;
    highResImg.onload = () => {
      setImgSrc(image.url);
      setIsHighResLoaded(true);
    };
  }, [image.url, collectionId, scale, x, y, controls]);

  // Gestures
  const handleDragEnd = (e, { offset, velocity }) => {
    if (isZoomed) return;

    const swipe = swipePower(offset.x, velocity.x);

    if (swipe < -swipeConfidenceThreshold) {
      paginate(1);
    } else if (swipe > swipeConfidenceThreshold) {
      paginate(-1);
    } else if (Math.abs(offset.y) > 150) { // Dismiss threshold
      closePreview();
    } else {
        // Snap back if no action
        controls.start("center");
    }
  };

  const handleDoubleTap = (e) => {
    // Prevent default to avoid browser zoom
    // e.preventDefault(); // Might block click events
    if (isZoomed) {
      setIsZoomed(false);
      controls.start("center");
      scale.set(1);
    } else {
      setIsZoomed(true);
      // Zoom to point logic could go here, for now simple center zoom
      controls.start({ scale: 3, x: 0, y: 0, transition: { duration: 0.3 } });
      scale.set(3);
    }
    resetControlsTimeout();
  };
  
  // Basic Pinch Logic
  const onTouchStart = (e) => {
      if (e.touches.length === 2) {
          const dist = Math.hypot(
              e.touches[0].clientX - e.touches[1].clientX,
              e.touches[0].clientY - e.touches[1].clientY
          );
          distRef.current = dist;
          initialScaleRef.current = scale.get();
      }
  };

  const onTouchMove = (e) => {
      if (e.touches.length === 2) {
          const dist = Math.hypot(
              e.touches[0].clientX - e.touches[1].clientX,
              e.touches[0].clientY - e.touches[1].clientY
          );
          const newScale = initialScaleRef.current * (dist / distRef.current);
          scale.set(Math.max(1, Math.min(newScale, 5)));
          if(newScale > 1.1) setIsZoomed(true);
          else setIsZoomed(false);
      }
  };

  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      y: 0,
      opacity: 1,
      scale: 1 // Ensure scale is reset in center variant
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  return (
    <motion.div
      className="image-wrap"
      style={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        touchAction: 'none' // Crucial for custom gestures
      }}
      drag={true}
      dragConstraints={isZoomed ? { left: -1000, right: 1000, top: -1000, bottom: 1000 } : { left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={isZoomed ? 0.2 : 0.7} // Rubber band effect when not zoomed
      onDragEnd={handleDragEnd}
      onDoubleClick={handleDoubleTap}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
    >
      <motion.img
        key={image.url}
        src={imgSrc}
        custom={direction}
        variants={variants}
        initial="enter"
        animate={controls}
        exit="exit"
        transition={{
          x: { type: "spring", stiffness: 300, damping: 30 },
          opacity: { duration: 0.2 }
        }}
        style={{
          width: 'auto',
          height: 'auto',
          maxWidth: '100%',
          maxHeight: '100%',
          scale: scale,
          filter: isHighResLoaded ? 'none' : 'blur(20px)',
          transition: 'filter 0.3s ease-out'
        }}
        draggable={false} // Prevent native drag
      />
    </motion.div>
  );
}

export default ImageDisplay;
