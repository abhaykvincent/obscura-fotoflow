import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import './SmartGallery.scss';
import { fetchProject } from '../../firebase/functions/firestore';
import SmartAlbum from '../../components/ImageGallery/SmartAlbum';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectUser } from '../../app/slices/authSlice';
import { toTitleCase } from '../../utils/stringUtils';
import { setUserType } from '../../analytics/utils';
import { LoadingLight } from '../../components/Loading/Loading';

export default function SmartGallery() {
  const { studioName, projectId, collectionId } = useParams();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);

  useEffect(() => {
    document.body.style.backgroundColor = 'white';
  }, []);

  useEffect(() => {
    const fetchProjectData = async () => {
      setLoading(true);
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
        if (collectionId) {
            const collection = project.collections.find((c) => c.id === collectionId);
            document.title = `${toTitleCase(project.name)} | ${toTitleCase(collection?.name || '')} | Gallery`;
        } else {
            document.title = `${toTitleCase(project.name)} | Smart Gallery`;
        }
    }
  }, [project, collectionId]);

  if (loading) {
    return <LoadingLight />;
  }

  if (!project) {
    return <div>Project not found.</div>;
  }

  if (collectionId) {
    return (
      <div className="share-project">
          <SmartAlbum domain={studioName} projectId={projectId} collectionId={collectionId} />
          {project.type !== "FUNERAL" && <p className='studio-tag-line'>{`smile with ${studioName}`}</p>}
 
      </div>
    );
  }

  const CollectionsGrid = () => {
    return (
      <div className="collections-grid">
        {project.collections.map((collection) => (
          collection.uploadedFiles?.length > 0 && (
            <Link key={collection.id} to={`/${studioName}/smart-gallery/${project.id}/${collection.id}`} className="collection-card-link">
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

  return (
    <div className="smart-gallery-page">
      <div className="project-header">
        <img className='banner' src={project.projectCover} alt={`${project.name} cover`} />
        <div className="gallery-info">
          <h1 className='project-name'>{toTitleCase(project.name)}</h1>
          <p className='project-type'>{toTitleCase(project.type)}</p>
        </div>
      </div>
      <div className="collections-container">
        <CollectionsGrid />
      </div>
      <div className="action-buttons-container">
        <Link to={`/${studioName}/selection/${project.id}/pin`} className="button secondary icon selected">
          Select Photos
        </Link>
        <Link to={`/${studioName}/selection/${project.id}/pin`} className="button primary icon download">
          Download
        </Link>
      </div>
      {project.type !== "FUNERAL" && <p className='studio-tag-line'>{`smile with ${studioName}`}</p>}
    </div>
  );
}
