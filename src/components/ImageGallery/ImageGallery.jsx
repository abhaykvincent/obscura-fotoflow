import React, { useEffect, useMemo, useRef, useState } from 'react';
import Preview from '../../features/Preview/Preview';
import { shortenFileName } from '../../utils/stringUtils';

// Helper function to group images by lastModified threshold
const groupImagesByLastModified = (images, thresholdInMinutes, timeThrottleInMinutes) => {
  const thresholdInMilliseconds = thresholdInMinutes * 60 * 1000;
  const throttleInMilliseconds = timeThrottleInMinutes * 60 * 1000;

  // Sort images by lastModified timestamp
  const sortedImages = [...images].sort((a, b) => a.lastModified - b.lastModified);

  const groupedImages = [];
  let currentGroup = [];
  let groupStartTime = null;

  sortedImages.forEach((image, index) => {
    if (index === 0) {
      // Initialize first group with the first image
      currentGroup.push(image);
      groupStartTime = image.lastModified;
    } else {
      const previousImage = sortedImages[index - 1];
      const timeDifference = image.lastModified - previousImage.lastModified;
      const groupDuration = image.lastModified - groupStartTime;

      // Check if the current image exceeds either the threshold or the throttle
      if (timeDifference > thresholdInMilliseconds || groupDuration > throttleInMilliseconds) {
        // Push current group and start a new one
        groupedImages.push(currentGroup);
        currentGroup = [image];
        groupStartTime = image.lastModified; // Reset group start time
      } else {
        // Continue adding to the current group
        currentGroup.push(image);
      }
    }
  });

  // Add the last group if it's not empty
  if (currentGroup.length > 0) {
    groupedImages.push(currentGroup);
  }

  return groupedImages;
};

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  
  // Get the formatted date and time parts
  const options = {
    year: 'numeric',
    month: 'short',  // 'Dec', 'Jan', etc.
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: true,
  };
  
  // Format the date using locale options
  const formattedDate = date.toLocaleString('en-US', options) || '0';
  // Split the formatted date into date and time parts
  const [datePart, yearPart, timePart] = formattedDate.split(', ');
  
  // Extract the time and period (AM/PM) parts
  const [time, period] = timePart.split(' '); // Extract time and AM/PM
  const timeParts = time.split(':'); // Extract hour, minute, second
  const hour = timeParts[0]; // Always present
  const minute = timeParts[1]; // Always present
  const second = timeParts[2] ? timeParts[2] : '00'; // Handle missing seconds
  
  // Construct the highlighted time
  const highlightedTime = ` <span class="highlight">${hour}:${minute}</span> <span class="highlight">${period}</span>`;
  
  // Return the combined date and highlighted time
  return `${highlightedTime}, ${datePart}`;
};


const TimestampDisplay = ({ timestamp }) => {
  return (
    <div
      className="group-date"
      dangerouslySetInnerHTML={{ __html: formatTimestamp(timestamp) }}
    />
  );
};

const ImageGallery = ({ projectId,collectionId, imageUrls }) => {
  // Preview
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  const containerRef = useRef(null);
  const openPreview = (index) => {
    setIsPreviewOpen(true);
    setPreviewIndex(index);
  };
  const closePreview = () => {
    setIsPreviewOpen(false);
  };
  useEffect(() => {
    closePreview()
  }, [])
  useEffect(() => {
    console.log(previewIndex)
    debugger

    const scrollToImage = () => {
      // Find the target image
      const targetImage = containerRef.current?.querySelector(`img[alt="File ${previewIndex}"]`);
      
      if (targetImage) {
        // Scroll the image into view with smooth behavior
        targetImage.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    };

    scrollToImage();
  }, [previewIndex]); // Effect runs when previewIndex changes

  // Group images by lastModified
  const timeThreshold = 0.1;
  const timeThrottle = 0.5; 
  const groupedImages = useMemo(() => groupImagesByLastModified(imageUrls, timeThreshold,timeThrottle), [imageUrls, timeThreshold]);
  console.log(groupedImages)

  // Hide header, sidebar on Image Preview
  useEffect(() => {
    if (isPreviewOpen) {
      document.getElementsByClassName('header')[0].style.display = 'none';
      document.getElementsByClassName('sidebar')[0].style.display = 'none';
      document.getElementsByClassName('project-info')[0].style.display = 'none';
      // lock scroll
      document.body.style.overflow = 'hidden';
    } else {
      document.getElementsByClassName('header')[0].style.display = 'grid';
      document.getElementsByClassName('sidebar')[0].style.display = 'block';
      document.getElementsByClassName('project-info')[0].style.display = 'grid';
      // unlock scroll
      document.body.style.overflow = 'auto';
    }
  }, [isPreviewOpen]);
  
  useEffect(() => {
    function updateDisplayStyles() {
      document.getElementsByClassName('header')[0].style.display = 'grid';
      document.getElementsByClassName('sidebar')[0].style.display = 'block';
      //document.getElementsByClassName('project-info')[0].style.display = 'grid';
      // unlock scroll
      document.body.style.overflow = 'auto';
    }
    window.addEventListener('popstate', function() {
      updateDisplayStyles();
    });
  }, []);

  return (
    <div className="gallary">
      {groupedImages.map((group, groupIndex) => (
          <div className="photos" ref={containerRef}>
            <TimestampDisplay timestamp={group[0].lastModified} />

            {group.map((fileUrl, index) =>  (
              <div className="photo-wrap" key={index} onClick={() => openPreview(index)}>
                <div className="hover-options-wrap">
                  <div className="hover-options">
                    {fileUrl.status && (
                      <div className="favorite-wrap">
                        <div className={`favorite ${fileUrl?.status === 'selected' ? 'selected' : ''}`}>
                          <div className="icon"></div>
                        </div>
                      </div>
                    )}
                    <div className="top">
                      <div className="menu-icon"></div>
                      <div className="option-menu">
                        <div className="photo-option">Download</div>
                        <div className="photo-option">Share</div>
                        <div className="photo-option">Set as cover</div>
                        <div className="photo-option">Delete</div>
                      </div>
                    </div>
                    <div className="bottom">
                      <div className="filename">
                        {shortenFileName(fileUrl.name)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="photo" style={{ backgroundImage: `url("${fileUrl.url}")` }} alt={`File ${index}`}>
                </div>
              </div>
            ))}
          </div>
      ))}
      {isPreviewOpen && <Preview image={imageUrls[previewIndex]} {...{ previewIndex, setPreviewIndex, imagesLength: imageUrls.length, closePreview, projectId,collectionId,setPreviewIndex }} />}
    </div>
  );
};

export default ImageGallery;
