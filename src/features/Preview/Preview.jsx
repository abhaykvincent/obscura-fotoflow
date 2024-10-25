import React, { useEffect } from 'react'
import './Preview.scss'
import { shortenFileName } from '../../utils/stringUtils'
import { deleteFileFromFirestoreAndStorage, setCoverPhotoInFirestore, setGalleryCoverPhotoInFirestore } from '../../firebase/functions/firestore'
import { useState } from 'react'
import { selectDomain } from '../../app/slices/authSlice'
import { useDispatch, useSelector } from 'react-redux'
import { useDebouncedResize } from '../../hooks/debouncedResize'
import { useParams } from 'react-router'
import { deleteFile, deleteFileFromCollection, deleteFileFromState } from '../../app/slices/projectsSlice'

function Preview({ image, previewIndex,setPreviewIndex,imagesLength, closePreview, projectId,collectionId }) {
  
  const { studioName } = useParams();
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
const dispatch = useDispatch();

const handleDelete = async () => {
  try {
    
    // Delete the file from Firebase Storage and Firestore
    await dispatch(deleteFile({
      studioName,
      projectId,
      collectionId,
      imageUrl: image.url, // Change this as per your requirement
      imageName: image.name,
    }));
    


    // Move to the next or previous image based on availability
    if (previewIndex < imagesLength - 1) {
      setPreviewIndex(previewIndex + 1); // Move to next image
    } else if (previewIndex > 0) {
      setPreviewIndex(previewIndex - 1); // Move to previous image if last image was deleted
    } else {
      closePreview(); // Close preview if no images left
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};



  useEffect(() => {
    //scrolltotop
    window.scrollTo(0, 0);
    console.log(image)
  }, [image])

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


  

  const handlePrev = () => {
    if (previewIndex > 0) {
      setPreviewIndex(previewIndex - 1);
    }
  };
  const handleNext = () => {
    if (previewIndex < imagesLength - 8) {
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
      console.log("Swiped right");
    } else if (swipeDistance < -50) {
      handleNext(); // Swipe left -> Go to next image.
      console.log("Swiped left");
    }
  };
  const downloadImage = async (url, fileName) => {
    try {
      const response = await fetch(url); // Use CORS mode explicitly
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const blob = await response.blob(); // Get the response as a Blob
      const objectURL = URL.createObjectURL(blob); // Create an object URL for the Blob
  
      const link = document.createElement("a"); // Create a temporary download link
      link.href = objectURL;
      link.download = fileName; // Set the desired file name
      document.body.appendChild(link);
      link.click(); // Trigger the download
      document.body.removeChild(link);
  
      // Release the object URL to free up memory
      URL.revokeObjectURL(objectURL);
      console.log("Download successful");
    } catch (error) {
      console.error("Download failed", error);
    }
  };
  

  return (
    <div className="preview-wrapper"

    >
      <div
      className='preview'
    >
     

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
            onClick={() => setCoverPhotoInFirestore(studioName,projectId, image.url)}
          >Set Project cover</div>
          <div className="icon set-cover"
            onClick={() => {
              console.log(studioName,projectId,collectionId, image.url)
              setGalleryCoverPhotoInFirestore(studioName,projectId,collectionId, image.url)}
            
            }
              >Set Gallery cover</div>
              <div className="icon delete" onClick={handleDelete}>Delete</div>
          <div className="icon download"
          onClick={async (event) => {
            event.stopPropagation(); // Prevent the next image navigation
            downloadImage(image.url, image.name);
          }}
          ></div>
          
          {/* 
          <div className="icon share"></div> */}
        </div>
        <div className="center-controls">
          {/* <div className="magnifier">
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
          </div> */}
        </div>
      </div>

      <div className="image-wrap">
      <div
        className="image"

      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
        style={{
          backgroundImage: `url("${image.url}")`,
          backgroundPositionX: zoomValue > 100 ? `${imagePosition.x}px` : 'center',
          backgroundPositionY: zoomValue > 100 ? `${imagePosition.y}px` : 'center',
          backgroundSize: `contain`,
        }}
      ></div>
      </div>
    </div>

    </div>
    
  )
}

export default Preview

  // Line Complexity  1.5 -> 