import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSmartGallery, selectSmartGallery, selectSmartGalleryStatus } from '../../app/slices/smartGallerySlice';
import SectionRenderer from './SectionRenderer';
import { toTitleCase } from '../../utils/stringUtils';
import './SmartAlbum.scss'
import { selectProjects } from '../../app/slices/projectsSlice';
import Preview from '../../features/Preview/Preview';

const SmartAlbum = ({ domain, projectId, collectionId }) => {
  const dispatch = useDispatch();
  const smartGalleryData = useSelector(selectSmartGallery);
  const smartGalleryStatus = useSelector(selectSmartGalleryStatus);
  
  // Preview State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [allImages, setAllImages] = useState([]);

  const projects = useSelector(selectProjects);
  const selectedProject = useMemo(() => 
      projects?.find((p) => p.id === projectId),
      [projects, projectId]
    );

  useEffect(() => {
    if (domain && projectId && collectionId) {
      dispatch(fetchSmartGallery({ domain, projectId, collectionId }));
    }
  }, [dispatch, domain, projectId, collectionId])

  useEffect(() => {
    if (smartGalleryData?.sections) {
      const images = [];
      smartGalleryData.sections.forEach(section => {
        if (section.type === 'image-grid' && section.images) {
          images.push(...section.images);
        }
        // Add other section types here if they contain images that should be in the global preview
      });
      setAllImages(images);
    }
  }, [smartGalleryData]);

  const openPreview = (image) => {
    const index = allImages.findIndex(img => img.url === image.url);
    if (index !== -1) {
      setPreviewIndex(index);
      setIsPreviewOpen(true);
    }
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
  };

  if (smartGalleryStatus === 'loading') {
    return <div>Loading...</div>;
  }

  if (smartGalleryStatus === 'failed') {
    return <div>Error loading gallery.</div>;
  }

  if (!smartGalleryData) {
    return null;
  }

  return (
    <div className="smart-album">
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
          <p className='project-type'>{toTitleCase(smartGalleryData?.name || '')}</p>
        </div>
      </div>

      <div className={`cover-photo-container ${smartGalleryData.coverSize}`}>
          <div className={`text-overlay ${smartGalleryData.textPosition}`}>
        </div>
        <div className="cover-overlay" style={{ backgroundColor: smartGalleryData.overlayColor }}></div>
        
      </div>

      <div className="gallery-sections">
        {smartGalleryData.sections.map((section) => (
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