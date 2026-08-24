import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useAnimation, useTransform } from 'framer-motion';
import { getThumbnailUrl, getWebUrl } from '../../utils/urlUtils';

const swipeConfidenceThreshold = 10000;
const swipePower = (offset, velocity) => {
  return Math.abs(offset) * velocity;
};

function ImageDisplay({ image, direction, paginate, closePreview, collectionId, resetControlsTimeout, onCurrentLoad }) {
  // Image Loading State
  const [imgSrc, setImgSrc] = useState(getThumbnailUrl(image.url));
  const [isHighResLoaded, setIsHighResLoaded] = useState(false);

  // Zoom & Pan State
  const [isZoomed, setIsZoomed] = useState(false);
  const controls = useAnimation();
  const scale = useMotionValue(1);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Vertical movement threshold: 
  // We counter-move the content until the wrapper has been dragged past the threshold.
  const threshold = 40;
  const contentY = useTransform(y, (latest) => {
    if (isZoomed) return 0; // Don't interfere with zoom panning
    if (Math.abs(latest) < threshold) return -latest;
    return latest > 0 ? -threshold : threshold;
  });
  
  // Touch Refs for Pinch
  const distRef = useRef(0);
  const initialScaleRef = useRef(1);

  useEffect(() => {
    // Reset state for new image
    setIsHighResLoaded(false);
    setImgSrc(getThumbnailUrl(image.url));
    setIsZoomed(false);
    scale.set(1);
    x.set(0);
    y.set(0);
    
    // Reset zoom controls
    controls.start({ scale: 1, x: 0, y: 0, transition: { duration: 0 } });

    // Load High Res (Web Preview Quality)
    const webUrl = getWebUrl(image.url);
    const highResImg = new Image();
    highResImg.src = webUrl;
    highResImg.onload = () => {
      setImgSrc(webUrl);
      setIsHighResLoaded(true);
      if (onCurrentLoad) onCurrentLoad();
    };
  }, [image.url, scale, controls, x, y, onCurrentLoad]);

  // Gestures (Swipe / Dismiss) - Applied to Wrapper
  const handleWrapperDragEnd = (e, { offset, velocity }) => {
    const swipe = swipePower(offset.x, velocity.x);
    const swipeY = swipePower(offset.y, velocity.y);

    if (swipe < -swipeConfidenceThreshold) {
      paginate(1);
    } else if (swipe > swipeConfidenceThreshold) {
      paginate(-1);
    } else if (Math.abs(offset.y) > 120 || swipeY > swipeConfidenceThreshold) { 
      // Dismiss if dragged down significantly or swiped down fast
      // (Increased threshold to 120 to account for the 40px visual dead-zone)
      closePreview();
    }
    // Note: If no action, AnimatePresence's animate="center" will snap x back to 0 automatically.
  };

  const handleDoubleTap = (e) => {
    if (isZoomed) {
      setIsZoomed(false);
      controls.start({ scale: 1, x: 0, y: 0, transition: { duration: 0.3 } });
      scale.set(1);
    } else {
      setIsZoomed(true);
      controls.start({ scale: 3, transition: { duration: 0.3 } });
      scale.set(3);
    }
    resetControlsTimeout();
  };
  
  // Pinch Logic
  const onTouchStart = (e) => {
      if (e.touches.length === 2) {
          const dist = Math.hypot(
              e.touches[0].clientX - e.touches[1].clientX,
              e.touches[0].clientY - e.touches[1].clientY
          );
          distRef.current = dist;
          initialScaleRef.current = scale.get();
      }
      resetControlsTimeout();
  };

  const onTouchMove = (e) => {
      if (e.touches.length === 2) {
          const dist = Math.hypot(
              e.touches[0].clientX - e.touches[1].clientX,
              e.touches[0].clientY - e.touches[1].clientY
          );
          const newScale = initialScaleRef.current * (dist / distRef.current);
          const clampedScale = Math.max(1, Math.min(newScale, 5));
          
          scale.set(clampedScale);
          controls.set({ scale: clampedScale }); // Update controls to keep sync

          if(clampedScale > 1.1) setIsZoomed(true);
          else setIsZoomed(false);
      }
  };

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0
    })
  };

  return (
    <motion.div
      className="slide-wrapper"
      // Layout
      style={{ 
        position: 'absolute', top: 0, left: 0, 
        width: '100%', height: '100%', 
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        touchAction: 'none',
        x, y // Bind motion values for drag tracking
      }}
      
      // Slide Animations (Enter/Exit)
      key={image.url}
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.01 }
      }}

      // Swipe Gestures (Only when NOT zoomed)
      drag={!isZoomed}
      dragDirectionLock={true} // Lock to axis to prevent diagonal jitter
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.7} // Rubber band effect
      onDragEnd={handleWrapperDragEnd}
      
      // Touch Handlers for Pinch/DoubleTap
      onDoubleClick={handleDoubleTap}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
    >
      <motion.div style={{ y: contentY, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.img
          src={imgSrc}
          // Zoom & Pan Animations
          animate={controls}
          
          // Pan Gestures (Only when Zoomed)
          drag={isZoomed}
          dragConstraints={{ left: -1000, right: 1000, top: -1000, bottom: 1000 }} // Limit pan
          dragElastic={0.1}

          style={{
            width: 'auto',
            height: 'auto',
            maxWidth: '100%',
            maxHeight: '100%',
            // scale is handled by controls/animate
            filter: isHighResLoaded ? 'none' : 'blur(15px)',
            transition: 'filter 0.4s ease-out',
            cursor: isZoomed ? 'grab' : 'default'
          }}
          draggable={false} // Prevent native drag
        />
      </motion.div>
    </motion.div>
  );
}

export default ImageDisplay;
