import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSmartGallery, selectSmartGallery, selectSmartGalleryStatus } from '../app/slices/smartGallerySlice';
import { selectProjects } from '../app/slices/projectsSlice';
import { fetchGalleryAccess } from '../firebase/functions/firestore';
import { trackEvent } from '../analytics/utils';
import { getThumbnailUrl } from '../utils/urlUtils';

export const useSmartAlbum = (domain, projectId, collectionId, propProject) => {
  const dispatch = useDispatch();
  const smartGalleryData = useSelector(selectSmartGallery);
  const status = useSelector(selectSmartGalleryStatus);
  const projects = useSelector(selectProjects);

  const [displayGallery, setDisplayGallery] = useState(false);
  const [galleryBlockedReason, setGalleryBlockedReason] = useState(null);
  const [studioStatus, setStudioStatus] = useState(null);
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

  // Check Gallery Access: Studio allowed + Project allowed + Collection allowed.
  // The gallery must not be considered available solely because its collection
  // is active if the parent studio is suspended or inactive.
  useEffect(() => {
    let cancelled = false;
    const verifyStatus = async () => {
      if (!domain || !projectId || !collectionId) {
        setDisplayGallery(false);
        setGalleryBlockedReason(null);
        return;
      }
      try {
        const access = await fetchGalleryAccess(domain, projectId, collectionId);
        if (cancelled) return;
        setStudioStatus(access.studioStatus || null);
        if (access.allowed) {
          setDisplayGallery(true);
          setGalleryBlockedReason(null);
        } else {
          // access.reason: 'studio-suspended' | 'studio-inactive' | 'collection-hidden'
          setDisplayGallery(false);
          setGalleryBlockedReason(access.reason || 'collection-hidden');
        }
      } catch (error) {
        if (cancelled) return;
        console.error('Error fetching gallery access:', error);
        // Direct error codes from the enforcement layer map to blocked reasons.
        const code = error?.code;
        if (code === 'studio-suspended') {
          setStudioStatus('suspended');
          setGalleryBlockedReason('studio-suspended');
        } else if (code === 'studio-inactive') {
          setStudioStatus('inactive');
          setGalleryBlockedReason('studio-inactive');
        } else {
          setGalleryBlockedReason('unavailable');
        }
        setDisplayGallery(false);
      }
    };
    verifyStatus();
    return () => { cancelled = true; };
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
            url: getThumbnailUrl(img.url),
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
    galleryBlockedReason,
    studioStatus,
    allImages,
    processedSections,
    isExpired
  };
};
