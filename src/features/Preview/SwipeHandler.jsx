// SwipeHandler.jsx
import React, { useState } from 'react';

function SwipeHandler({ children, previewIndex, imagesLength, setPreviewIndex }) {
  const [touchStartX, setTouchStartX] = useState(0);

  const handleTouchStart = (e) => setTouchStartX(e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    const swipeDistance = e.changedTouches[0].clientX - touchStartX;
    if (swipeDistance > 50 && previewIndex > 0) {
      setPreviewIndex(previewIndex - 1);
    } else if (swipeDistance < -50 && previewIndex < imagesLength - 1) {
      setPreviewIndex(previewIndex + 1);
    }
  };

  return (
    <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {children}
    </div>
  );
}

export default SwipeHandler;
