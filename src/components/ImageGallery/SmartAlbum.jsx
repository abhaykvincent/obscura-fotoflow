import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSmartGallery, selectSmartGallery, selectSmartGalleryStatus } from '../../app/slices/smartGallerySlice';
import SectionRenderer from './SectionRenderer';

const SmartAlbum = ({ domain, projectId, collectionId }) => {
  const dispatch = useDispatch();
  const smartGalleryData = useSelector(selectSmartGallery);
  const smartGalleryStatus = useSelector(selectSmartGalleryStatus);

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
      <div className={`cover-photo-container ${smartGalleryData.coverSize}`}>
        <div className={`text-overlay ${smartGalleryData.textPosition}`}>
          <h1 className="cover-title">{smartGalleryData.name}</h1>
          <p className="cover-description">{smartGalleryData.description}</p>
        </div>
        <div className="cover-overlay" style={{ backgroundColor: smartGalleryData.overlayColor }}></div>
        {smartGalleryData.projectCover ? (
          <img src={smartGalleryData.projectCover} alt="Cover" className="cover-photo" style={{ objectPosition: `${smartGalleryData.focusPoint.x * 100}% ${smartGalleryData.focusPoint.y * 100}%` }} />
        ) : (
          <div className="cover-photo-placeholder">
            <span>Cover Photo</span>
          </div>
        )}
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