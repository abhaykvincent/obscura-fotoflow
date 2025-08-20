import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { fetchProject } from '../../firebase/functions/firestore';
import GalleryPIN from '../../components/GalleryPIN/GalleryPIN';
import { toTitleCase } from '../../utils/stringUtils';
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
        <Link to={`/${studioName}/share/${project.id}`} className="button back-btn icon back">
          Back to Gallery
        </Link>
        <img className='banner' src={images[0] ? images[0].url : ''} alt="Project Banner" />
        <div className="gallery-info">
          <h1 className='projet-name'>{toTitleCase(project.name)}</h1>
        </div>
      </div>
      <GalleryPIN setAuthenticated={setAuthenticated} projectPin={project.pin} />
    </div>
  );
}
