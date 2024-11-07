import { set } from 'firebase/database';
import React, { useEffect, useState } from 'react';

function SwipeHandler({ children, previewIndex, imagesLength, setPreviewIndex, showControls,handleUserInteraction, setShowControls }) {
  const [touchStartX, setTouchStartX] = useState(0);
  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
    setShowControls(false);  // Hide controls on swipe start
  };
  const handleTouchEnd = (e) => {
    const swipeDistance = e.changedTouches[0].clientX - touchStartX;
    if (swipeDistance === 0) {
        setShowControls(true);  // Show controls on swipe ends
    } else if (swipeDistance > 50 && previewIndex > 0) {
        setPreviewIndex(previewIndex - 1);
        setShowControls(false);  // Hide controls on swipe start
    } else if (swipeDistance < -50 && previewIndex < imagesLength - 1) {
        setPreviewIndex(previewIndex + 1);
        setShowControls(false);  // Hide controls on swipe start
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' && previewIndex < imagesLength - 1) {
        setPreviewIndex(prevIndex => prevIndex + 1);
      } else if (e.key === 'ArrowLeft' && previewIndex > 0) {
        setPreviewIndex(prevIndex => prevIndex - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewIndex, imagesLength, setPreviewIndex]);

  return (
    <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        {children}
        <div className={`controls ${showControls ? 'show' : 'hide'}`}>
            { previewIndex < imagesLength - 1 && (
                <div className="next" onClick={() => setPreviewIndex(prevIndex => prevIndex + 1)}></div>
            )}
            { previewIndex > 0 && (
                <div className="prev" onClick={() => setPreviewIndex(prevIndex => prevIndex - 1)}></div>
            )}
        </div>
    </div>
  );
}

export default SwipeHandler;