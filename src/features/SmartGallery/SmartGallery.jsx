import React, { useEffect, useState } from 'react';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import './SmartGallery.scss';
import { fetchProject } from '../../firebase/functions/firestore';
import SmartAlbum from '../../components/ImageGallery/SmartAlbum';
import ProjectExpiredPage from '../../components/ImageGallery/ProjectExpiredPage';
import ExpiredGallery from '../../components/galleries/ExpiredGallery.tsx';
import { useDispatch, useSelector } from 'react-redux';
import { selectIsAuthenticated, selectUser } from '../../app/slices/authSlice';
import { selectStudioAdminSettings } from '../../app/slices/adminSettingsSlice';
import { selectGalleryStudio, selectGalleryStudioLoading, fetchGalleryStudio } from '../../app/slices/studioSlice';
import { toTitleCase } from '../../utils/stringUtils';
import { setUserType, trackEvent } from '../../analytics/utils';
import { LoadingLight } from '../../components/Loading/Loading';
import { fetchCollectionStatus } from '../../firebase/functions/firestore';
import { getImageUrlByQuality, getThumbnailUrl } from '../../utils/urlUtils';
import { isPinValid } from '../../utils/pinUtils';
import { showAlert } from '../../app/slices/alertSlice';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export default function SmartGallery() {
  const { studioName, projectId, collectionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const studio = useSelector(selectGalleryStudio);
  const studioLoading = useSelector(selectGalleryStudioLoading);
  const { settings } = useSelector(selectStudioAdminSettings);
  const tagline = settings?.gallery?.galleryTagline;
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [isExpired, setIsExpired] = useState(false);
  const [expiryDate, setExpiryDate] = useState(null);
  const [isStage2Expired, setIsStage2Expired] = useState(false);
  const [visibleCollections, setVisibleCollections] = useState([]);
  const [collectionsLoading, setCollectionsLoading] = useState(true);
  
  const [isClientAuthenticated, setIsClientAuthenticated] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (studioName) {
      dispatch(fetchGalleryStudio({ currentDomain: studioName }));
    }
  }, [studioName, dispatch]);

  const StudioBrandingFooter = () => {
    if (project?.type === "FUNERAL") return null;
    
    return (
      <footer className="studio-branding-footer">
        <div className="footer-content">
          {studio?.studioLogo && (
            <img 
              src={studio.studioLogo} 
              alt={`${studio.name} logo`} 
              className="studio-footer-logo" 
              loading="lazy"
            />
          )}
          <div className="branding-text">
            <h3 className="studio-name">{studio?.name || studioName}</h3>
            <p className="studio-tagline">{studio?.settings?.gallery.galleryTagline}</p>
          </div>
          <div className="studio-contact-info">
            {studio?.website && (
              <a href={studio.website.startsWith('http') ? studio.website : `https://${studio.website}`} target="_blank" rel="noopener noreferrer" className="contact-link">
                Website
              </a>
            )}
            {studio?.social?.instagram && (
              <a href={`https://instagram.com/${studio.social.instagram}`} target="_blank" rel="noopener noreferrer" className="contact-link">
                Instagram
              </a>
            )}
            {studio?.social?.facebook && (
              <a href={`https://facebook.com/${studio.social.facebook}`} target="_blank" rel="noopener noreferrer" className="contact-link">
                Facebook
              </a>
            )}
          </div>
        </div>
        <div className="powered-by">
          Powered by <a href="https://fotoflow.pro" target="_blank" rel="noopener noreferrer">FotoFlow Pro</a>
        </div>
      </footer>
    );
  };

  useEffect(() => {
    document.body.style.backgroundColor = 'white';
    if (isPinValid(projectId)) {
      setIsClientAuthenticated(true);
    }
  }, [projectId]);

  useEffect(() => {
    const fetchProjectData = async () => {
      setLoading(true);
      try {
        const projectData = await fetchProject(studioName, projectId);
        setProject(projectData);

        // Check for project expiry (gallery access)
        if (projectData.createdAt) {
          const createdAt = new Date(projectData.createdAt);
          
          // Stage 1: Archive threshold (Gallery Validity)
          const validityMonths = parseInt(projectData.projectValidityMonths || '6');
          const archiveThresholdDate = new Date(createdAt);
          archiveThresholdDate.setMonth(archiveThresholdDate.getMonth() + validityMonths);
          setExpiryDate(archiveThresholdDate);
          
          // Stage 2: Final Expiry (File Retention)
          const retentionYears = parseInt(projectData.fileRetentionYears || '1');
          const finalExpiryThresholdDate = new Date(createdAt);
          finalExpiryThresholdDate.setMonth(finalExpiryThresholdDate.getMonth() + (retentionYears * 12));
          finalExpiryThresholdDate.setDate(finalExpiryThresholdDate.getDate() + 30);

          const isStage1Expired = Date.now() > archiveThresholdDate.getTime();
          const isStage2ExpiredNow = Date.now() > finalExpiryThresholdDate.getTime() || projectData.status === 'expired';
          
          setIsExpired(isStage1Expired);
          setIsStage2Expired(isStage2ExpiredNow);
        }

        if (!isAuthenticated || user === 'no-studio-found') {
          setUserType('Guest');
        }
      } catch (error) {
        console.error('Failed to fetch project:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [studioName, projectId, isAuthenticated, user]);

  useEffect(() => {
    const checkCollectionVisibility = async () => {
      if (!project?.collections) return;
      
      setCollectionsLoading(true);
      const newVisibleCollections = [];
      for (const collection of project.collections) {
        if (collection.uploadedFiles?.length > 0) {
          const status = await fetchCollectionStatus(studioName, projectId, collection.id);
          if (status !== 'hide') {
            newVisibleCollections.push(collection);
          }
        }
      }
      setVisibleCollections(newVisibleCollections);
      setCollectionsLoading(false);
    };

    checkCollectionVisibility();
  }, [project, studioName, projectId]);

  useEffect(() => {
    if (project) {
        if (collectionId) {
            const collection = project.collections.find((c) => c.id === collectionId);
            document.title = `${toTitleCase(project.name)} | ${toTitleCase(collection?.name || '')} | Gallery`;
        } else {
            document.title = `${toTitleCase(project.name)} | Smart Gallery`;
        }
    }
  }, [project, collectionId]);

  const handleDownloadAll = async () => {
    if (!project || isDownloading) return;

    // Check project age (90 days limit)
    const createdAt = new Date(project.createdAt);
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    if (createdAt < ninetyDaysAgo) {
      dispatch(showAlert({ 
        type: 'error', 
        message: 'Bulk download for this project is no longer available (90-day limit exceeded). Please contact the studio for support.' 
      }));
      return;
    }

    setIsDownloading(true);
    const zip = new JSZip();
    let totalFiles = 0;

    try {
      for (const collection of visibleCollections) {
        const folder = zip.folder(toTitleCase(collection.name));
        const files = collection.uploadedFiles || [];
        
        const filePromises = files.map(async (file) => {
          try {
            const webUrl = getImageUrlByQuality(file.url, 'web');
            const response = await fetch(webUrl);
            const blob = await response.blob();
            folder.file(file.name, blob);
            totalFiles++;
          } catch (err) {
            console.error(`Failed to download ${file.name}:`, err);
          }
        });
        
        await Promise.all(filePromises);
      }

      if (totalFiles === 0) {
        dispatch(showAlert({ type: 'error', message: 'No photos found to download.' }));
        setIsDownloading(false);
        return;
      }

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${toTitleCase(project.name)} - All Albums (Web Quality).zip`);
      
      trackEvent('gallery_bulk_downloaded', {
        project_id: projectId,
        total_files: totalFiles
      });

      dispatch(showAlert({ type: 'success', message: 'Download started successfully!' }));
    } catch (error) {
      console.error('Download failed:', error);
      dispatch(showAlert({ type: 'error', message: 'Failed to generate download. Please try again.' }));
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const autoDownload = searchParams.get('autoDownload');

    if (autoDownload === 'true' && isClientAuthenticated && visibleCollections.length > 0 && !isDownloading) {
      handleDownloadAll();
      // Remove the search param from URL to prevent multiple triggers on reload
      navigate(location.pathname, { replace: true });
    }
  }, [location.search, isClientAuthenticated, visibleCollections, isDownloading, navigate, location.pathname]);

  const handleDownloadClick = (e) => {
    e.preventDefault();
    if (!isClientAuthenticated) {
      navigate(`/${studioName}/smart-gallery/${projectId}/download/pin`);
    } else {
      handleDownloadAll();
    }
  };

  if (loading || (collectionsLoading && !collectionId) || studioLoading) {
    return (
      <div className="smart-album-loading">
        {project?.projectCover ? (
          <div className="loading-cover-container">
            <img 
              src={project.projectCover} 
              alt="Loading Cover" 
              className="loading-cover"
              style={{ 
                objectPosition: project?.focusPoint 
                  ? `${project.focusPoint.x * 100}% ${project.focusPoint.y * 100}%` 
                  : 'center' 
              }}
            />
            <div className="loading-overlay">
              <div className="loading-content">
                <h1 className="project-name">{toTitleCase(project?.name || '')}</h1>
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
            <p>Loading {toTitleCase(project?.name || 'Gallery')}...</p>
          </div>
        )}
      </div>
    );
  }

  if (!project) {
    return <div>Project not found.</div>;
  }
  if (isExpired && !isAuthenticated && !isPinValid(projectId)) {
    return (
      <ExpiredGallery 
        backgroundImage={project.projectCover}
        photographerName={studio?.name || studioName}
        expiryDate={expiryDate}
        projectId={project.id}
        projectName={project.name}
        domain={studioName}
      />
    );
  }

  if (isStage2Expired && !isAuthenticated) {
    return <ProjectExpiredPage project={project} studio={studio} studioName={studioName} />;
  }

  if (collectionId) {
    const currentIndex = visibleCollections.findIndex(c => c.id === collectionId);
    const prevCollection = currentIndex > 0 ? visibleCollections[currentIndex - 1] : null;
    const nextCollection = currentIndex < visibleCollections.length - 1 ? visibleCollections[currentIndex + 1] : null;

    return (
      <div className="share-project">
          <SmartAlbum domain={studioName} projectId={projectId} collectionId={collectionId} project={project} />
          
          {(prevCollection || nextCollection) && !collectionsLoading && (
            <div className="collection-navigation">
              <div className="nav-links">
                {prevCollection ? (
                  <Link 
                    to={`/${studioName}/smart-gallery/${projectId}/${prevCollection.id}`} 
                    className="nav-link prev"
                    style={{ backgroundImage: `url(${prevCollection.uploadedFiles[0]?.url})` }}
                  >
                    <div className="nav-content">
                      <span className="nav-label">Previous Album</span>
                      <span className="nav-name">{toTitleCase(prevCollection.name)}</span>
                    </div>
                  </Link>
                ) : <div className="nav-placeholder" />}

                {nextCollection ? (
                  <Link 
                    to={`/${studioName}/smart-gallery/${projectId}/${nextCollection.id}`} 
                    className="nav-link next"
                    style={{ backgroundImage: `url(${nextCollection.uploadedFiles[0]?.url})` }}
                  >
                    <div className="nav-content">
                      <span className="nav-label">Next Album</span>
                      <span className="nav-name">{toTitleCase(nextCollection.name)}</span>
                    </div>
                  </Link>
                ) : (
                  <Link 
                    to={`/${studioName}/smart-gallery/${projectId}`} 
                    className="nav-link next home"
                  >
                    <div className="nav-content">
                      <span className="nav-label">Back to</span>
                      <span className="nav-name">All Albums</span>
                    </div>
                  </Link>
                )}
              </div>
            </div>
          )}

          <StudioBrandingFooter />
      </div>
    );
  }

  const CollectionsGrid = () => {
    return (
      <div className="collections-grid">
        {visibleCollections.map((collection) => (
            <Link key={collection.id} to={`/${studioName}/smart-gallery/${project.id}/${collection.id}`} className="collection-card-link">
              <div
                className="collection-card"
                style={{ backgroundImage: `url(${getThumbnailUrl(collection.galleryCover)})` }}
              >
                <div className="collection-name">{toTitleCase(collection.name)}</div>
                <div className="collection-image-count">{collection.uploadedFiles.length} images</div>
              </div>
            </Link>
        ))}
      </div>
    );
  };

  return (
    <div className="smart-gallery-page">
      <div className="project-header">
        <img 
          className='banner' 
          src={project.projectCover} 
          alt={`${project.name} cover`} 
          loading="lazy"
        />
        <div className="gallery-info">
          <h1 className='project-name'>{toTitleCase(project.name)}</h1>
          <p className='project-type'>{toTitleCase(project.type)}</p>
        </div>
      </div>
      <div className="collections-container">
        <CollectionsGrid />
      </div>
      <div className="action-buttons-container">
        {project?.collections?.some(c => c.selectionGallery === true) && (
          <Link to={`/${studioName}/selection/${project.id}/pin`} className="button secondary icon selected">
            Select Photos
          </Link>
        )}
        <button 
          onClick={handleDownloadClick} 
          className={`button primary icon download ${isDownloading ? 'loading' : ''}`}
          disabled={isDownloading}
        >
          {isDownloading ? 'Preparing...' : 'Download'}
        </button>
      </div>

      <StudioBrandingFooter />
    </div>
  );
}


