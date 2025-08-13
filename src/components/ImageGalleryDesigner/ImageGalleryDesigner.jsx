import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import './ImageGalleryDesigner.scss';
import GallerySections from './GallerySections/GallerySections';
import { findCollectionById } from '../../utils/CollectionQuery';
import { fetchSmartGallery, updateSmartGallery, selectSmartGallery, selectSmartGalleryStatus } from '../../app/slices/smartGallerySlice';
import { selectStudio } from '../../app/slices/studioSlice';

const ImageGalleryDesigner = ({ project, collectionId }) => {
  const dispatch = useDispatch();
  const domain = useSelector(selectStudio).domain
  const smartGalleryData = useSelector(selectSmartGallery);
  const smartGalleryStatus = useSelector(selectSmartGalleryStatus);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [textPosition, setTextPosition] = useState('center');
  const [overlayColor, setOverlayColor] = useState('rgba(0, 0, 0, 0.5)');
  const [showColorDialog, setShowColorDialog] = useState(false);
  const [showFocusDialog, setShowFocusDialog] = useState(false);
  const [showCoverSizeDialog, setShowCoverSizeDialog] = useState(false);
  const [showAddSectionDialog, setShowAddSectionDialog] = useState(false); // New state
  const [focusPoint, setFocusPoint] = useState({ x: 0.5, y: 0.5 });
  const [initialFocusPoint, setInitialFocusPoint] = useState({ x: 0.5, y: 0.5 });
  const [coverSize, setCoverSize] = useState('medium');
  const [sections, setSections] = useState([]);

  useEffect(() => {
    if (project?.id && collectionId) {
      dispatch(fetchSmartGallery({ domain: domain, projectId: project.id, collectionId }));
    }
  }, [dispatch, project.domain, project.id, collectionId]);

  useEffect(() => {
    if (smartGalleryStatus === 'succeeded' && smartGalleryData) {
      setTitle(smartGalleryData.name || '');
      setDescription(smartGalleryData.description || '');
      setTextPosition(smartGalleryData.textPosition || 'center');
      setOverlayColor(smartGalleryData.overlayColor || 'rgba(0, 0, 0, 0.5)');
      setFocusPoint(smartGalleryData.focusPoint || { x: 0.5, y: 0.5 });
      setInitialFocusPoint(smartGalleryData.focusPoint || { x: 0.5, y: 0.5 });
      setCoverSize(smartGalleryData.coverSize || 'medium');
      setSections(smartGalleryData.sections || []);
    }
  }, [smartGalleryStatus, smartGalleryData]);
  
  const focusChanged = initialFocusPoint.x !== focusPoint.x || initialFocusPoint.y !== focusPoint.y;

  let leaveTimeout;

  const colors = ['#000000', '#ffffff', '#ff6961', '#ffb340', '#ffd426', '#428924', '#66d4cf', '#5de6ff', '#70d7ff', '#409cff', '#7d7aff', '#da8fff', '#ff6482', '#b59469', '#aeaeae', '#7c7c80', '#545456', '#444446', '#363638', '#242426'];
  const coverSizes = ['small', 'medium', 'large'];


  const handleMouseEnter = (setter) => {
    clearTimeout(leaveTimeout);
    setter(true);
  };

  const handleMouseLeave = (setter, condition) => {
    if (!condition) {
      leaveTimeout = setTimeout(() => {
        setter(false);
      }, 200);
    }
  };

  const handleFocusClick = (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setFocusPoint({ x, y });
  };

  const handleColorSelect = (color) => {
    if (!domain || !project?.id || !collectionId || !smartGalleryData) {
      console.error("Missing data for updateSmartGallery: domain, projectId, collectionId, or smartGalleryData is undefined.");
      return;
    }
    const updatedSmartGallery = { ...smartGalleryData, overlayColor: color, updatedAt: Date.now() };
    dispatch(updateSmartGallery({
      domain: domain,
      projectId: project.id,
      collectionId,
      smartGallery: updatedSmartGallery,
    }));
    setOverlayColor(color);
    setShowColorDialog(false);
  };

  const handleCoverSizeSelect = (size) => {
    if (!domain || !project?.id || !collectionId || !smartGalleryData) {
      console.error("Missing data for updateSmartGallery: domain, projectId, collectionId, or smartGalleryData is undefined.");
      return;
    }
    const updatedSmartGallery = { ...smartGalleryData, coverSize: size, updatedAt: Date.now() };
    dispatch(updateSmartGallery({
      domain: domain,
      projectId: project.id,
      collectionId,
      smartGallery: updatedSmartGallery,
    }));
    setCoverSize(size);
    setShowCoverSizeDialog(false);
  };

  const handleTextPositionChange = () => {
    if (!domain || !project?.id || !collectionId || !smartGalleryData) {
      console.error("Missing data for updateSmartGallery: domain, projectId, collectionId, or smartGalleryData is undefined.");
      return;
    }
    const positions = ['center', 'top-left', 'top-right', 'bottom-left', 'bottom-right'];
    const currentIndex = positions.indexOf(textPosition);
    const nextIndex = (currentIndex + 1) % positions.length;
    const newTextPosition = positions[nextIndex];
    const updatedSmartGallery = { ...smartGalleryData, textPosition: newTextPosition, updatedAt: Date.now() };
    dispatch(updateSmartGallery({
      domain: domain,
      projectId: project.id,
      collectionId,
      smartGallery: updatedSmartGallery,
    }));
    setTextPosition(newTextPosition);
  };

  const handleContentChange = (e, fieldName) => {
    if (!domain || !project?.id || !collectionId || !smartGalleryData) {
      console.error("Missing data for updateSmartGallery: domain, projectId, collectionId, or smartGalleryData is undefined.");
      return;
    }
    const newValue = e.target.innerText;
    let updatedSmartGallery = { ...smartGalleryData, updatedAt: Date.now() };
    if (fieldName === 'name') {
      updatedSmartGallery.name = newValue;
      setTitle(newValue);
    } else if (fieldName === 'description') {
      updatedSmartGallery.description = newValue;
      setDescription(newValue);
    }
    dispatch(updateSmartGallery({
      domain: domain,
      projectId: project.id,
      collectionId,
      smartGallery: updatedSmartGallery,
    }));
  };

  const handleSaveFocus = () => {
    if (!domain || !project?.id || !collectionId || !smartGalleryData) {
      console.error("Missing data for updateSmartGallery: domain, projectId, collectionId, or smartGalleryData is undefined.");
      return;
    }
    const updatedSmartGallery = { ...smartGalleryData, focusPoint: focusPoint, updatedAt: Date.now() };
    dispatch(updateSmartGallery({
      domain: domain,
      projectId: project.id,
      collectionId,
      smartGallery: updatedSmartGallery,
    }));
    setInitialFocusPoint(focusPoint);
    setShowFocusDialog(false);
  };

  const handleCancelFocus = () => {
    setFocusPoint(initialFocusPoint);
    setShowFocusDialog(false);
  };

  const handleSectionsUpdate = (newSections) => {
    if (!domain || !project?.id || !collectionId || !smartGalleryData) {
      console.error("Missing data for updateSmartGallery: domain, projectId, collectionId, or smartGalleryData is undefined.");
      return;
    }
    const updatedSmartGallery = { ...smartGalleryData, sections: newSections, updatedAt: Date.now() };
    dispatch(updateSmartGallery({
      domain: domain,
      projectId: project.id,
      collectionId,
      smartGallery: updatedSmartGallery,
    }));
    setSections(newSections);
  };

  const handleAddSection = (type) => {
    if (!domain || !project?.id || !collectionId || !smartGalleryData) {
      console.error("Missing data for updateSmartGallery: domain, projectId, collectionId, or smartGalleryData is undefined.");
      return;
    }

    let newSection;
    const newSectionId = `${type}-${collectionId}-${Date.now()}`; // Unique ID for the new section
    const currentSections = smartGalleryData.sections || [];
    const newOrder = currentSections.length > 0 ? Math.max(...currentSections.map(s => s.order || 0)) + 1 : 1;

    switch (type) {
      case 'image-grid':
        newSection = {
          id: newSectionId,
          type: 'image-grid',
          order: newOrder,
          images: [], // Empty array for new image grid
          gridSettings: {
            columns: 3,
            spacing: '16px',
            aspectRatio: 'auto',
          },
        };
        break;
      // Add cases for other section types here
      default:
        console.warn('Unknown section type:', type);
        return;
    }

    const updatedSections = [...currentSections, newSection];
    const updatedSmartGallery = { ...smartGalleryData, sections: updatedSections, updatedAt: Date.now() };
    dispatch(updateSmartGallery({
      domain: domain,
      projectId: project.id,
      collectionId,
      smartGallery: updatedSmartGallery,
    }));
    setShowAddSectionDialog(false); // Close the dialog after adding
  };

  if (smartGalleryStatus === 'loading') {
    return <div>Loading Smart Gallery...</div>;
  }

  if (smartGalleryStatus === 'failed') {
    return <div>Error loading Smart Gallery.</div>;
  }

  if (!smartGalleryData) {
    return <div>No Smart Gallery data available.</div>;
  }

  return (
    <div className="image-gallery-designer">
      <div className={`cover-photo-container ${smartGalleryData.coverSize}`}>
        <div className={`text-overlay ${smartGalleryData.textPosition}`}>
          <h1
            className="cover-title"
            contentEditable
            onBlur={(e) => handleContentChange(e, 'name')}
            suppressContentEditableWarning={true}
          >
            {smartGalleryData.name}
          </h1>
          <p
            className="cover-description"
            contentEditable
            onBlur={(e) => handleContentChange(e, 'description')}
            suppressContentEditableWarning={true}
          >
            {smartGalleryData.description}
          </p>
        </div>
        <div className="cover-overlay" style={{ backgroundColor: smartGalleryData.overlayColor }}></div>
        {smartGalleryData.projectCover ? (
          <img src={smartGalleryData.projectCover} alt="Cover" className="cover-photo" style={{ objectPosition: `${smartGalleryData.focusPoint.x * 100}% ${smartGalleryData.focusPoint.y * 100}%` }} />
        ) : (
          <div className="cover-photo-placeholder">
            <span>Cover Photo</span>
          </div>
        )}


        <div className="toolbar">
          <div className="tools-container">

          <div className="focus-control" onMouseEnter={() => handleMouseEnter(setShowFocusDialog)} onMouseLeave={() => handleMouseLeave(setShowFocusDialog, focusChanged)}>
              <button className='button text-only  icon set-focus dark-icon'></button>
              {showFocusDialog && (
                <div className="focus-dialog">
                  <div className="focus-image-container" onClick={handleFocusClick}>
                    <img src={smartGalleryData.projectCover} alt="Cover" className="focus-image" />
                    <div className="focus-point" style={{ left: `${focusPoint.x * 100}%`, top: `${focusPoint.y * 100}%` }}></div>
                  </div>
                  <div className="focus-actions">
                    <button className='save-button' onClick={handleSaveFocus} disabled={!focusChanged}>Save</button>
                    <button className='cancel-button' onClick={handleCancelFocus}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
            <div className="cover-size-control" onMouseEnter={() => handleMouseEnter(setShowCoverSizeDialog)} onMouseLeave={() => handleMouseLeave(setShowCoverSizeDialog, false)}>
              <button className='button text-only  icon cover-size dark-icon' ></button>
              {showCoverSizeDialog && (
                <div className="cover-size-dialog">
                  {coverSizes.map((size) => (
                    <button key={size} onClick={() => handleCoverSizeSelect(size)}>{size}</button>
                  ))}
                </div>
              )}
            </div>
          <button  className='button text-only  icon title-position dark-icon' 
            onClick={handleTextPositionChange}>
          </button>
          <button  className='button text-only  icon title-font dark-icon' 
            >
          </button>
          <div className="overlay-colour" onMouseEnter={() => handleMouseEnter(setShowColorDialog)} onMouseLeave={() => handleMouseLeave(setShowColorDialog, false)}>
            <button  className='button text-only  icon colour-wheel dark-icon'></button>
            {showColorDialog && (
              <div className="color-dialog">
                {colors.map((color) => (
                  <div
                    key={color}
                    className="color-swatch"
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorSelect(color)}
                  ></div>
                ))}
              </div>
            )}
          </div>
          <button  className='button text-only  icon delete-red dark-icon'></button>
          <button className='button text-only icon add-section dark-icon' onClick={() => setShowAddSectionDialog(true)}></button> 
          </div>
        </div>
      </div>
      {showAddSectionDialog && (
        <div className="add-section-dialog">
          <button onClick={() => handleAddSection('image-grid')}>Add Image Grid</button>
          <button onClick={() => setShowAddSectionDialog(false)}>Cancel</button>
        </div>
      )}
      <GallerySections sections={smartGalleryData.sections} onSectionsUpdate={handleSectionsUpdate} id={project.id} collectionId={collectionId} collectionName={findCollectionById(project, collectionId)?.name} />
    </div>
  );
};

export default ImageGalleryDesigner;