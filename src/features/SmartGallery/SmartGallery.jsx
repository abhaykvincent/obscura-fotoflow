import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import './SmartGallery.scss';
import { fetchProject } from '../../firebase/functions/firestore';
import SmartAlbum from '../../components/ImageGallery/SmartAlbum';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectUser } from '../../app/slices/authSlice';
import { selectStudioAdminSettings } from '../../app/slices/adminSettingsSlice';
import { selectStudio } from '../../app/slices/studioSlice';
import { toTitleCase } from '../../utils/stringUtils';
import { setUserType } from '../../analytics/utils';
import { LoadingLight } from '../../components/Loading/Loading';
import { fetchCollectionStatus } from '../../firebase/functions/firestore';

export default function SmartGallery() {
  const { studioName, projectId, collectionId } = useParams();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const studio = useSelector(selectStudio);
  const { settings } = useSelector(selectStudioAdminSettings);
  const tagline = settings?.gallery?.galleryTagline || `smile with ${studioName}`;
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [visibleCollections, setVisibleCollections] = useState([]);
  const [collectionsLoading, setCollectionsLoading] = useState(true);

  const StudioBrandingFooter = () => {
    if (project?.type === "FUNERAL") return null;
    
    return (
      <footer className="studio-branding-footer">
        <div className="footer-content">
          {studio?.studioLogo && (
            <img src={studio.studioLogo} alt={`${studio.name} logo`} className="studio-footer-logo" />
          )}
          <div className="branding-text">
            <h3 className="studio-name">{studio?.name || studioName}</h3>
            <p className="studio-tagline">{tagline}</p>
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
  }, []);

  useEffect(() => {
    const fetchProjectData = async () => {
      setLoading(true);
      try {
        const projectData = await fetchProject(studioName, projectId);
        setProject(projectData);
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

  if (loading) {
    return <LoadingLight />;
  }

  if (!project) {
    return <div>Project not found.</div>;
  }

  if (collectionId) {
    const currentIndex = visibleCollections.findIndex(c => c.id === collectionId);
    const prevCollection = currentIndex > 0 ? visibleCollections[currentIndex - 1] : null;
    const nextCollection = currentIndex < visibleCollections.length - 1 ? visibleCollections[currentIndex + 1] : null;

    return (
      <div className="share-project">
          <SmartAlbum domain={studioName} projectId={projectId} collectionId={collectionId} />
          
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
    if (collectionsLoading) {
      return <LoadingLight />;
    }

    return (
      <div className="collections-grid">
        {visibleCollections.map((collection) => (
            <Link key={collection.id} to={`/${studioName}/smart-gallery/${project.id}/${collection.id}`} className="collection-card-link">
              <div
                className="collection-card"
                style={{ backgroundImage: `url(${collection.uploadedFiles[0]?.url})` }}
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
        <img className='banner' src={project.projectCover} alt={`${project.name} cover`} />
        <div className="gallery-info">
          <h1 className='project-name'>{toTitleCase(project.name)}</h1>
          <p className='project-type'>{toTitleCase(project.type)}</p>
        </div>
      </div>
      <div className="collections-container">
        <CollectionsGrid />
      </div>
      <div className="action-buttons-container">
        <Link to={`/${studioName}/selection/${project.id}/pin`} className="button secondary icon selected">
          Select Photos
        </Link>
        <Link to={`/${studioName}/selection/${project.id}/pin`} className="button primary icon download">
          Download
        </Link>
      </div>
      <StudioBrandingFooter />
    </div>
  );
}
