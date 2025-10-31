import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSmartGallery, selectSmartGallery, selectSmartGalleryStatus } from '../../app/slices/smartGallerySlice';
import SectionRenderer from './SectionRenderer';
import { toTitleCase } from '../../utils/stringUtils';
import './SmartAlbum.scss'
import { selectProjects } from '../../app/slices/projectsSlice';
import { get } from 'firebase/database';
const SmartAlbum = ({ domain, projectId, collectionId }) => {
  const dispatch = useDispatch();
  const smartGalleryData = useSelector(selectSmartGallery);
  const smartGalleryStatus = useSelector(selectSmartGalleryStatus);

  const projects = useSelector(selectProjects);
  const selectedProject = useMemo(() => 
      projects?.find((p) => p.id === projectId),
      [projects, projectId]
    );
  useEffect(() => {
    if (domain && projectId && collectionId) {
      dispatch(fetchSmartGallery({ domain, projectId, collectionId }));
    }
  }, [dispatch, domain, projectId, collectionId]);

  if (smartGalleryStatus === 'loading') {
    return <div>Loading...</div>;
  }

  if (smartGalleryStatus === 'failed') {
    return <div>Error loading gallery.</div>;
  }

  if (!smartGalleryData) {
    return <div>No gallery data available.</div>;
  }

  return (
    <div className="smart-album">
      <div className="project-header">

        {smartGalleryData.projectCover ? (

          <img src={smartGalleryData.projectCover} alt="Cover" className="banner cover" style={{ objectPosition: `${smartGalleryData.focusPoint.x * 100}% ${smartGalleryData.focusPoint.y * 100}%` }} />
        ) : (
          <div className="cover-photo-placeholder">
            <span>Cover Photo</span>
          </div>
        )}
        <div className="gallery-info">
          <h1 className='project-name'>{toTitleCase(selectedProject.name)}</h1>
          <p className='project-type'>{toTitleCase(smartGalleryData.name)}</p>
        </div>
      </div>

      <div className={`cover-photo-container ${smartGalleryData.coverSize}`}>
          <div className={`text-overlay ${smartGalleryData.textPosition}`}>
        </div>
        <div className="cover-overlay" style={{ backgroundColor: smartGalleryData.overlayColor }}></div>
        
      </div>

      <div className="gallery-sections">
        {smartGalleryData.sections.map((section) => (
          <SectionRenderer key={section.id} section={section} />
        ))}
      </div>
    </div>
  );
};

export default SmartAlbum;