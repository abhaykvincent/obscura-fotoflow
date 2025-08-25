import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import './SmartGallery.scss';
import { fetchProject } from '../../firebase/functions/firestore';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectUser } from '../../app/slices/authSlice';
import { toTitleCase } from '../../utils/stringUtils';
import { setUserType } from '../../analytics/utils';
import { LoadingLight } from '../../components/Loading/Loading';
import GalleryPIN from '../../components/GalleryPIN/GalleryPIN';

export default function SmartGallery() {
  const { studioName, projectId } = useParams();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);

  useEffect(() => {
    document.body.style.backgroundColor = 'white';
  }, []);

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        const projectData = await fetchProject(studioName, projectId);
        setProject(projectData);
        if (!isAuthenticated || user === 'no-studio-found') {
          setUserType('Guest');
        }
      } catch (error) {
        console.error('Failed to fetch project:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [studioName, projectId, isAuthenticated, user]);

  useEffect(() => {
    if (project) {
      document.title = `${toTitleCase(project.name)} | Smart Gallery`;
    }
  }, [project]);

  const CollectionsGrid = () => {
    return (
      <div className="collections-grid">
        {project.collections.map((collection) => (
          collection.uploadedFiles?.length > 0 && (
            <Link key={collection.id} to={`/${studioName}/share/${project.id}/${collection.id}`} className="collection-card-link">
              <div
                className="collection-card"
                style={{ backgroundImage: `url(${collection.uploadedFiles[0]?.url})` }}
              >
                <div className="collection-name">{toTitleCase(collection.name)}</div>
                <div className="collection-image-count">{collection.uploadedFiles.length} images</div>
              </div>
            </Link>
          )
        ))}
      </div>
    );
  };

  if (loading) {
    return <LoadingLight />;
  }

  if (!project) {
    return <div>Project not found.</div>;
  }

  return (
    <div className="smart-gallery-page">
      <div className="project-header">
        <img className='banner' src={project.projectCover} alt={`${project.name} cover`} />
        <div className="gallery-info">
          <h1 className='project-name'>{toTitleCase(project.name)}</h1>
          <p className='project-type'>{toTitleCase(project.type)}</p>
        </div>
      </div>
      <div className="action-buttons-container">
        <Link to={`/${studioName}/selection/${project.id}/pin`} className="button secondary icon selected">
          Select Photos
        </Link>
        <Link to={`/${studioName}/selection/${project.id}/pin`} className="button primary icon download">
          Download
        </Link>
      </div>
      <div className="collections-container">
        <CollectionsGrid />
      </div>
      {project.type !== "FUNERAL" && <p className='studio-tag-line'>{`smile with ${studioName}`}</p>}
    </div>
  );
}