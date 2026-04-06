import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import SectionRenderer from './SectionRenderer';
import ProjectExpiredPage from './ProjectExpiredPage';
import Preview from '../../features/Preview/Preview';
import SmartAlbumLoading from './SmartAlbumLoading';
import SmartAlbumHeader from './SmartAlbumHeader';
import { selectIsAuthenticated } from '../../app/slices/authSlice';
import { selectStudio } from '../../app/slices/studioSlice';
import { useSmartAlbum } from '../../hooks/useSmartAlbum';
import './SmartAlbum.scss';

const SmartAlbum = ({ domain, projectId, collectionId, project: propProject }) => {
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const studio = useSelector(selectStudio);

  const {
    project,
    smartGalleryData,
    status,
    displayGallery,
    allImages,
    processedSections,
    isExpired
  } = useSmartAlbum(domain, projectId, collectionId, propProject);

  const [preview, setPreview] = useState({ isOpen: false, index: 0 });

  const handleBack = () => navigate(-1);

  const openPreview = (image) => {
    const urlToFind = image.originalUrl || image.url;
    const index = allImages.findIndex((img) => img.url === urlToFind);
    if (index !== -1) {
      setPreview({ isOpen: true, index });
    }
  };

  const closePreview = () => setPreview({ ...preview, isOpen: false });

  const getCollectionName = () => {
    return project?.collections?.find((c) => c.id === collectionId)?.name || '';
  };

  // Guard Clauses
  if (isExpired && !isAuthenticated) {
    return <ProjectExpiredPage project={project} studio={studio} studioName={domain} />;
  }

  if (status === 'loading') {
    return <SmartAlbumLoading project={project} onBack={handleBack} />;
  }

  if (status === 'failed') {
    return <div className="error-container">Error loading gallery.</div>;
  }

  if (!smartGalleryData) return null;

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

      <SmartAlbumHeader 
        galleryData={smartGalleryData} 
        project={project} 
        collectionName={getCollectionName()} 
      />

      <div className="gallery-sections">
        {processedSections.map((section) => (
          <SectionRenderer 
            key={section.id} 
            section={section} 
            onImageClick={openPreview} 
          />
        ))}
      </div>

      {preview.isOpen && (
        <Preview
          image={allImages[preview.index]}
          previewIndex={preview.index}
          setPreviewIndex={(index) => setPreview({ ...preview, index })}
          imagesLength={allImages.length}
          closePreview={closePreview}
          projectId={projectId}
          collectionId={collectionId}
          images={allImages}
        />
      )}
    </div>
  );
};

export default SmartAlbum;
