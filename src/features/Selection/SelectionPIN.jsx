import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { fetchProject, fetchSelectionGallery, fetchProjectPhotoById } from '../../firebase/functions/firestore';
import GalleryPIN from '../../components/GalleryPIN/GalleryPIN';
import { toTitleCase } from '../../utils/stringUtils';
import { getCoverUrl } from '../../utils/urlUtils';
import './Selection.scss'; // Reuse the same styles

export default function SelectionPIN() {
  const { studioName, projectId, selectionGalleryId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [gallery, setGallery] = useState(null);
  const [fallbackCoverUrl, setFallbackCoverUrl] = useState('');
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    document.body.style.backgroundColor = 'white';
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchProjectData = async () => {
      try {
        const [projectData, galleryData] = await Promise.all([
          fetchProject(studioName, projectId),
          selectionGalleryId
            ? fetchSelectionGallery(studioName, projectId, selectionGalleryId).catch(() => null)
            : Promise.resolve(null),
        ]);
        if (cancelled) return;
        setProject(projectData);
        if (galleryData) setGallery(galleryData);

        if (!projectData?.projectCover) {
          const firstColl = projectData?.collections?.[0];
          const immediateFallback = firstColl?.galleryCover || firstColl?.uploadedFiles?.[0]?.url || '';
          if (immediateFallback) {
            setFallbackCoverUrl(immediateFallback);
          } else if (firstColl?.photoIds?.[0]) {
            const firstPhoto = await fetchProjectPhotoById(studioName, projectId, firstColl.photoIds[0]).catch(() => null);
            if (!cancelled && firstPhoto) {
              setFallbackCoverUrl(firstPhoto.urls?.web || firstPhoto.url || '');
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch project:', error);
      }
    };
    fetchProjectData();
    return () => { cancelled = true; };
  }, [studioName, projectId, selectionGalleryId]);

  useEffect(() => {
    if (authenticated) {
      if (selectionGalleryId) {
        navigate(`/${studioName}/selection/${projectId}/gallery/${selectionGalleryId}`);
      } else {
        navigate(`/${studioName}/selection/${projectId}`);
      }
    }
  }, [authenticated, navigate, studioName, projectId, selectionGalleryId]);

  if (!project) return null; // Or a loading indicator

  return (
    <div className="select-project">
      <div className="project-header">
        <Link to={`/${studioName}/smart-gallery/${project.id}`} className="button back-btn icon back">
          Back to Gallery
        </Link>
        <img className='banner' src={getCoverUrl(project.projectCover || fallbackCoverUrl)} alt="Project Banner" />
        <div className="gallery-info">
          <h1 className='projet-name'>{toTitleCase(project.name)}</h1>
          {gallery?.name && <p className="gallery-subtitle">{gallery.name}</p>}
        </div>
      </div>
      <div className="pin-container" style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
        <GalleryPIN setAuthenticated={setAuthenticated} projectPin={project.pin} projectId={projectId} />
        <Link
          to={`/${studioName}/smart-gallery/${project.id}`}
          className="button secondary outline small"
          style={{ textShadow: 'none', border: '1px solid #ddd', color: '#666' }}
        >
          Cancel & Back to Gallery
        </Link>
      </div>
    </div>
  );
}
