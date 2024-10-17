import React, { useEffect } from 'react'
import './Preview.scss'
import { shortenFileName } from '../../utils/stringUtils'
import { setCoverPhotoInFirestore } from '../../firebase/functions/firestore'
import { useState } from 'react'
import { selectDomain } from '../../app/slices/authSlice'
import { useSelector } from 'react-redux'
import { useDebouncedResize } from '../../hooks/debouncedResize'

function Preview({ image, previewIndex,setPreviewIndex,imagesLength, closePreview, projectId }) {
  const domain = useSelector(selectDomain)

  const { screenWidth: screenWidth, screenHeight: screenHeight } = useDebouncedResize();
  
  // get the image width and height 
  const [imageWidth, setImageWidth] = useState(0);
  const [imageHeight, setImageHeight] = useState(0);

  const [zoomValue, setZoomValue] = useState(100)
  // screeen size
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [lastMousePosition, setLastMousePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
// NEW: Track touch positions for swipe handling.
const [touchStartX, setTouchStartX] = useState(0);
const [touchEndX, setTouchEndX] = useState(0);
  

  useEffect(() => {
    //scrolltotop
    window.scrollTo(0, 0);
    console.log(image)
  }, [])

  useEffect(() => {
    const setImageSize = () => {
      const img = new Image();
      img.src = image.url;
      img.onload = () => {
        setImageWidth(img.width);
        setImageHeight(img.height);
  
        // Set initial image position after loading
        setImagePosition({
          x: (window.innerWidth / 2) - img.width / 2,
          y: (window.innerHeight / 2) - img.height / 2,
        });
      };
    };
    setImageSize();
  }, [image]);
  
  useEffect(() => {
    console.log(imagePosition)
  }, [imagePosition])


  // Preview ZOOM 
  const zoomIn = () => {
    setZoomValue((prev) => Math.min(prev + 20, 500)); // Limit to 500% max zoom
  };
  
  const zoomOut = () => {
    setZoomValue((prev) => Math.max(prev - 20, 100)); // Minimum zoom 100%
  };
  
  const zoomReset = () => {
    setZoomValue(100);
    setImagePosition({
      x: (window.innerWidth / 2) - imageWidth / 2,
      y: (window.innerHeight / 2) - imageHeight / 2,
    });
  };
  
  const handleMouseMove = (event) => {
    if (!isDragging || zoomValue === 100) return; // Ignore if not dragging or zoomed out
  
    const deltaX = event.clientX - lastMousePosition.x;
    const deltaY = event.clientY - lastMousePosition.y;
  
    setImagePosition((prev) => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY,
    }));
  
    setLastMousePosition({ x: event.clientX, y: event.clientY });
  };

  const handlePrev = () => {
    if (previewIndex > 0) {
      setPreviewIndex(previewIndex - 1);
    }
  };
  const handleNext = () => {
    if (previewIndex < imagesLength - 1) {
      setPreviewIndex(previewIndex + 1);
    }
  };

  // 1️⃣ NEW: Handle touch start event to track the initial touch point.
  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  // 2️⃣ NEW: Handle touch move event to update the end position.
  const handleTouchMove = (e) => {
    setTouchEndX(e.touches[0].clientX);
  };

  // 3️⃣ NEW: Handle touch end event to determine swipe direction.
  const handleTouchEnd = () => {
    const swipeDistance = touchEndX - touchStartX;

    if (swipeDistance > 50) {
      handlePrev(); // Swipe right -> Go to previous image.
    } else if (swipeDistance < -50) {
      handleNext(); // Swipe left -> Go to next image.
    }
  };

  return (
    <div className="preview-wrapper"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}

    >
      <div
      className='preview'
      onMouseDown={(e) => {
        setIsDragging(true);
        setLastMousePosition({ x: e.clientX, y: e.clientY });
      }}
      onMouseUp={() => setIsDragging(false)}
      onMouseMove={handleMouseMove}
    >
      <div className="image-wrap">
      <div
        className="image"
        style={{
          backgroundImage: `url("${image.url}")`,
          backgroundPositionX: zoomValue > 100 ? `${imagePosition.x}px` : 'center',
          backgroundPositionY: zoomValue > 100 ? `${imagePosition.y}px` : 'center',
          backgroundSize: `${zoomValue}%`,
        }}
      ></div>
      </div>

      <div className="controls">
            {(previewIndex >= imagesLength - 1) ||
          <div className="next"
            onClick={() => {
                setPreviewIndex(prevIndex => prevIndex + 1)
            }}
          ></div>
    }
        {previewIndex ===0 ||<div className="prev"
          onClick={() => {
              setPreviewIndex(prevIndex => prevIndex - 1)
          }}
        ></div>}

      </div>

      <div className="controls bottom">
        <div className="left-controls"></div>
        <div className="center-controls">
          <div className="tool">{image.status=="selected"?
            <div className="selected-button active">
              <div className="icon selected"></div>
              <div className="text">Selected</div>
            </div>
          :
            <div className="selected-button active">
              <div className="icon not-selected"></div>
              <div className="text">Approve</div>
            </div>}
          </div>
        </div>
        <div className="right-controls"></div>
      </div>

      <div className="controls top">
        <div className="left-controls">
          <div className="back"
            onClick={() => closePreview()}
          ></div>
          <div className="file-name">{shortenFileName(image.name)}</div>
        </div>
        <div className="right-controls">
          <div className="icon set-cover"
            onClick={() => setCoverPhotoInFirestore(domain,projectId, image.url)}
          >Set as cover</div>
          <div className="icon download"></div>{/* 
          <div className="icon share"></div> */}
        </div>
        <div className="center-controls">
          <div className="magnifier">
            <div className="zoom-out"
              onClick={() => zoomOut()}
            ></div>
            <div className="zoom-value">{zoomValue}%</div>
            <div className="zoom-in"
              onClick={() => zoomIn()}
            ></div>
            <div className={`zoom-reset ${zoomValue !== 100 ? 'show' : ''}`}
              onClick={zoomReset}
            >Reset</div>
          </div>
        </div>
      </div>
    </div>

    </div>
    
  )
}

export default Preview

  // Line Complexity  1.5 -> 