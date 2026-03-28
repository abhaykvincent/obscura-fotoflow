import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchSmartGallery, selectSmartGallery, selectSmartGalleryStatus } from '../../app/slices/smartGallerySlice';
import SectionRenderer from './SectionRenderer';
import { toTitleCase } from '../../utils/stringUtils';
import './SmartAlbum.scss'
import { selectProjects } from '../../app/slices/projectsSlice';
import ProjectExpiredPage from './ProjectExpiredPage';
import { selectIsAuthenticated } from '../../app/slices/authSlice';
import { selectStudio } from '../../app/slices/studioSlice';
import Preview from '../../features/Preview/Preview';
import { getImageUrlByQuality, getThumbnailUrl, getOriginalUrl } from '../../utils/urlUtils';
import { fetchCollectionStatus } from '../../firebase/functions/firestore';
import { trackEvent } from '../../analytics/utils';
import { collection } from 'firebase/firestore';

const SmartAlbum = ({ domain, projectId, collectionId, project: propProject }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const smartGalleryData = useSelector(selectSmartGallery);
  const smartGalleryStatus = useSelector(selectSmartGalleryStatus);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const studio = useSelector(selectStudio);
  const [displayGallery, setDisplayGallery] = useState(false);
  
  // Preview State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [allImages, setAllImages] = useState([]);

  const projects = useSelector(selectProjects);
  const selectedProject = useMemo(() => 
      propProject || projects?.find((p) => p.id === projectId),
      [propProject, projects, projectId]
    );

  useEffect(() => {
    if (domain && projectId && collectionId) {
      dispatch(fetchSmartGallery({ domain, projectId, collectionId }));
    }
  }, [dispatch, domain, projectId, collectionId])

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await fetchCollectionStatus(domain, projectId, collectionId);
        if (status === 'visible'  || status === 'active') {
          setDisplayGallery(true);
        } else {
          setDisplayGallery(false);
        }
      } catch (error) {
        console.error('Error fetching collection status:', error);
        setDisplayGallery(false);
      }
    };

    checkStatus();
  }, [domain, projectId, collectionId]);

  useEffect(() => {
    if (projectId) {
      trackEvent('gallery_viewed', {
        project_id: projectId,
        collection_id: collectionId
      });
    }
  }, [projectId, collectionId]);

  useEffect(() => {
    if (smartGalleryData?.sections) {
      const images = [];
      smartGalleryData.sections.forEach(section => {
        if (section.type === 'image-grid' && section.images) {
          images.push(...section.images.map(img => ({
            ...img,
            url: getImageUrlByQuality(img.url, 'web'), // Default to web quality via CDN
            thumbUrl: getThumbnailUrl(img.url),
            originalUrl: getOriginalUrl(img.url)
          })));
        }
      });
      setAllImages(images);
    }
  }, [smartGalleryData]);

  const processedSections = useMemo(() => {
    if (!smartGalleryData?.sections) return [];

    return smartGalleryData.sections.map(section => {
      if (section.type === 'image-grid' && section.images) {
        return {
          ...section,
          images: section.images.map(img => ({
            ...img,
            url: img.thumbAvailable ? getThumbnailUrl(img.url) : getImageUrlByQuality(img.url, 'web'),
            originalUrl: getOriginalUrl(img.url)
          }))
        };
      }
      return section;
    });
  }, [smartGalleryData?.sections]);

  const openPreview = (image) => {
    const targetUrl = image.originalUrl || image.url;
    const index = allImages.findIndex(img => (img.originalUrl || img.url) === targetUrl);
    if (index !== -1) {
      setPreviewIndex(index);
      setIsPreviewOpen(true);
    }
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
  };

  const handleBack = () => {
    navigate(-1);
  };
  const getCollectionById = (project,collectionId) => {
    return project.collections.find((collection) => collection.id === collectionId);
    
  }
  const isStage2Expired = useMemo(() => {
    if (!selectedProject) return false;
    if (selectedProject.status === 'expired') return true;
    
    if (selectedProject.createdAt) {
      const createdAt = new Date(selectedProject.createdAt);
      const retentionYears = parseInt(selectedProject.fileRetentionYears || '1');
      const finalExpiryThresholdDate = new Date(createdAt);
      finalExpiryThresholdDate.setMonth(finalExpiryThresholdDate.getMonth() + (retentionYears * 12));
      finalExpiryThresholdDate.setDate(finalExpiryThresholdDate.getDate() + 30);
      
      return Date.now() > finalExpiryThresholdDate.getTime();
    }
    return false;
  }, [selectedProject]);

  if (isStage2Expired && !isAuthenticated) {
    return <ProjectExpiredPage project={selectedProject} studio={studio} studioName={domain} />;
  }

  if (smartGalleryStatus === 'loading') {
    return (
      <div className="smart-album-loading">
        <button 
          className="nav-button prev back-button" 
          onClick={handleBack}
          title="Go Back"
        />
        {selectedProject?.projectCover ? (
          <div className="loading-cover-container">
            <img 
              src={selectedProject.projectCover} 
              alt="Loading Cover" 
              className="loading-cover"
              style={{ 
                objectPosition: selectedProject?.focusPoint 
                  ? `${selectedProject.focusPoint.x * 100}% ${selectedProject.focusPoint.y * 100}%` 
                  : 'center' 
              }}
            />
            <div className="loading-overlay">
              <div className="loading-content">
                <h1 className="project-name">{toTitleCase(selectedProject?.name || '')}</h1>
                <div className="loading-indicator">
                  <div className="spinner"></div>
                  <span>Loading Gallery...</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="loading-fallback">
            <div className="spinner"></div>
            <p>Loading {toTitleCase(selectedProject?.name || 'Gallery')}...</p>
          </div>
        )}
      </div>
    );
  }

  if (smartGalleryStatus === 'failed') {
    return <div>Error loading gallery.</div>;
  }

  if (!smartGalleryData) {
    return null;
  }

  if (!displayGallery) {
    return (
      <div className="smart-album-inactive">
        <p>This gallery is not active.</p>
      </div>
    );
  }

  return (
    <div className="smart-album">
      <button 
        className="nav-button prev back-button" 
        onClick={handleBack}
        title="Go Back"
      />
      <div className="project-header">

        {smartGalleryData?.projectCover ? (

          <img 
            src={smartGalleryData.projectCover} 
            alt="Cover" 
            className="banner cover" 
            loading="lazy"
            style={{ objectPosition: `${smartGalleryData?.focusPoint?.x * 100}% ${smartGalleryData.focusPoint?.y * 100}%` }} 
          />
        ) : (
          <div className="cover-photo-placeholder">
            <span>Cover Photo</span>
          </div>
        )}
        <div className="gallery-info">
          <h1 className='project-name'>{toTitleCase(selectedProject?.name || '')}</h1>
          <p className='project-type'>{toTitleCase(getCollectionById(selectedProject,collectionId)?.name || '')}</p>
        </div>
      </div>

      <div className={`cover-photo-container ${smartGalleryData.coverSize}`}>
          <div className={`text-overlay ${smartGalleryData.textPosition}`}>
        </div>
        <div className="cover-overlay" style={{ backgroundColor: smartGalleryData.overlayColor }}></div>
        
      </div>

      <div className="gallery-sections">
        {processedSections.map((section) => (
          <SectionRenderer key={section.id} section={section} onImageClick={openPreview} />
        ))}
      </div>

      {isPreviewOpen && (
        <Preview
          image={allImages[previewIndex]}
          previewIndex={previewIndex}
          setPreviewIndex={setPreviewIndex}
          imagesLength={allImages.length}
          closePreview={closePreview}
          projectId={projectId}
          collectionId={collectionId}
          images={allImages} // Pass allImages if Preview expects it for swiping
        />
      )}
    </div>
  );
};

export default SmartAlbum;