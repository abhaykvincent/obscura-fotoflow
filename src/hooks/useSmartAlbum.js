import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSmartGallery, selectSmartGallery, selectSmartGalleryStatus } from '../app/slices/smartGallerySlice';
import { selectProjects } from '../app/slices/projectsSlice';
import { fetchCollectionStatus } from '../firebase/functions/firestore';
import { trackEvent } from '../analytics/utils';
import { getThumbnailUrl } from '../utils/urlUtils';

export const useSmartAlbum = (domain, projectId, collectionId, propProject) => {
  const dispatch = useDispatch();
  const smartGalleryData = useSelector(selectSmartGallery);
  const status = useSelector(selectSmartGalleryStatus);
  const projects = useSelector(selectProjects);
  
  const [displayGallery, setDisplayGallery] = useState(false);
  const [allImages, setAllImages] = useState([]);

  const project = useMemo(() => 
    propProject || projects?.find((p) => p.id === projectId),
    [propProject, projects, projectId]
  );

  // Fetch Gallery Data
  useEffect(() => {
    if (domain && projectId && collectionId) {
      dispatch(fetchSmartGallery({ domain, projectId, collectionId }));
    }
  }, [dispatch, domain, projectId, collectionId]);

  // Check Collection Visibility
  useEffect(() => {
    const verifyStatus = async () => {
      try {
        const collectionStatus = await fetchCollectionStatus(domain, projectId, collectionId);
        setDisplayGallery(collectionStatus === 'visible' || collectionStatus === 'active');
      } catch (error) {
        console.error('Error fetching collection status:', error);
        setDisplayGallery(false);
      }
    };
    verifyStatus();
  }, [domain, projectId, collectionId]);

  // Analytics
  useEffect(() => {
    if (projectId) {
      trackEvent('gallery_viewed', { project_id: projectId, collection_id: collectionId });
    }
  }, [projectId, collectionId]);

  // Image Processing for Preview
  useEffect(() => {
    if (smartGalleryData?.sections) {
      const images = smartGalleryData.sections
        .filter(section => section.type === 'image-grid' && section.images)
        .flatMap(section => section.images);
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
            url: img.thumbAvailable ? getThumbnailUrl(img.url, collectionId) : img.url,
            originalUrl: img.url
          }))
        };
      }
      return section;
    });
  }, [smartGalleryData?.sections, collectionId]);

  const isExpired = useMemo(() => {
    if (!project) return false;
    if (project.status === 'expired') return true;
    
    if (project.createdAt) {
      const createdAt = new Date(project.createdAt);
      const retentionYears = parseInt(project.fileRetentionYears || '1');
      const expiryDate = new Date(createdAt);
      expiryDate.setMonth(expiryDate.getMonth() + (retentionYears * 12));
      expiryDate.setDate(expiryDate.getDate() + 30);
      
      return Date.now() > expiryDate.getTime();
    }
    return false;
  }, [project]);

  return {
    project,
    smartGalleryData,
    status,
    displayGallery,
    allImages,
    processedSections,
    isExpired
  };
};
