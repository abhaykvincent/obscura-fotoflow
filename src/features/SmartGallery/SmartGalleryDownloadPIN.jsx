import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { fetchProject } from '../../firebase/functions/firestore';
import GalleryPIN from '../../components/GalleryPIN/GalleryPIN';
import { toTitleCase } from '../../utils/stringUtils';
import './SmartGallery.scss';

export default function SmartGalleryDownloadPIN() {
  const { studioName, projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    document.body.style.backgroundColor = 'white';
  }, []);

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        const projectData = await fetchProject(studioName, projectId);
        setProject(projectData);
      } catch (error) {
        console.error('Failed to fetch project:', error);
      }
    };
    fetchProjectData();
  }, [studioName, projectId]);

  useEffect(() => {
    if (authenticated) {
      navigate(`/${studioName}/smart-gallery/${projectId}?autoDownload=true`);
    }
  }, [authenticated, navigate, studioName, projectId]); 

  

  if (!project) return null;

  return (
    <div className="smart-gallery-page pin-entry-page">
      <div className="project-header">
        <Link to={`/${studioName}/smart-gallery/${project.id}`} className="button back-btn icon back" style={{ position: 'absolute', top: '24px', left: '24px', zIndex: 10 }}>
          Back to Gallery
        </Link>
        <img className='banner' src={project.projectCover} alt="Project Banner" />
        <div className="gallery-info">
          <h1 className='project-name'>{toTitleCase(project.name)}</h1>
          <p className='project-type'>Download Authentication</p>
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
