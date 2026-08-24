import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { fetchProject } from '../../firebase/functions/firestore';
import GalleryPIN from '../../components/GalleryPIN/GalleryPIN';
import { toTitleCase } from '../../utils/stringUtils';
import { getCoverUrl } from '../../utils/urlUtils';
import './Selection.scss'; // Reuse the same styles

export default function SelectionPIN() {
  const { studioName, projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [images, setImages] = useState([]);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    document.body.style.backgroundColor = 'white';
  }, []);

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        const projectData = await fetchProject(studioName, projectId);
        setProject(projectData);
        const firstCollectionImages = projectData?.collections[0]?.uploadedFiles || [];
        setImages(firstCollectionImages);
      } catch (error) {
        console.error('Failed to fetch project:', error);
      }
    };
    fetchProjectData();
  }, [studioName, projectId]);

  useEffect(() => {
    if (authenticated) {
      navigate(`/${studioName}/selection/${projectId}`);
    }
  }, [authenticated, navigate, studioName, projectId]);

  if (!project) return null; // Or a loading indicator

  return (
    <div className="select-project">
      <div className="project-header">
        <Link to={`/${studioName}/smart-gallery/${project.id}`} className="button back-btn icon back">
          Back to Gallery
        </Link>
        <img className='banner' src={getCoverUrl(project.projectCover || images[0]?.url)} alt="Project Banner" />
        <div className="gallery-info">
          <h1 className='projet-name'>{toTitleCase(project.name)}</h1>
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
