import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchImageUrls } from '../../utils/storageOperations';
import './SmartGallery.scss';
import { fetchCollectionStatus, fetchProject, fetchProjectsFromFirestore } from '../../firebase/functions/firestore';
import ShareGallery from '../../components/ImageGallery/ShareGallery';
import { useSelector } from 'react-redux';
import { selectDomain, selectIsAuthenticated, selectUser, selectUserStudio } from '../../app/slices/authSlice';
import { toTitleCase } from '../../utils/stringUtils';
import { setUserType, trackEvent } from '../../analytics/utils';
import { set } from 'date-fns';
import { LoadingLight } from '../../components/Loading/Loading';

export default function SmartGallery() {
  const { studioName, projectId, collectionId } = useParams();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    document.body.style.backgroundColor = 'white';
  }, []);

  const [project, setProject] = useState();
  const [imageUrls, setImageUrls] = useState([]);
  const [displayGallery, setDisplayGallery] = useState(false);

  const fetchProjectData = async () => {
    try {
      const projectData = await fetchProject(studioName, projectId);
      setProject(projectData);
      
      if (!isAuthenticated || user === 'no-studio-found') {
        setUserType('Guest');
      }
    } catch (error) {
      console.error('Failed to fetch project:', error);
    }
  };

  const findCollectionById = (collections, collectionId) => {
    return collections.find((collection) => collection.id === collectionId);
  }

  useEffect(() => {
    fetchProjectData().then(() => {
      setTimeout(() => {
        setLoading(false);
      }, 2000);
    });
  }, []);

  useEffect(() => {
    if (!project) return;

    const currentCollectionId = collectionId || project.collections[0]?.id;
    const collection = findCollectionById(project.collections, currentCollectionId);
    document.title = `${project.name} | ${collection?.name} | Gallery`;
    const newImages = project?.collections.find((collection) => collection.id === currentCollectionId)?.uploadedFiles;
    setImageUrls(newImages);
  }, [project, collectionId]);

  useEffect(() => {
    const checkCollectionStatus = async () => {
      try {
        const status = await fetchCollectionStatus(studioName, projectId, collectionId, { domain: studioName });
        if (status === 'visible') {
          setDisplayGallery(true);
        } else {
          setDisplayGallery(false);
        }
      } catch (error) {
        console.error('Error fetching collection status:', error);
        setDisplayGallery(false);
      }
    };

    checkCollectionStatus();
  }, [studioName, projectId, collectionId]);

  if (!project) return null;

  return (
    <>
      {loading && <LoadingLight />}
      <div className="share-project">
        <div className="project-header">
          <img className='banner' src={project.projectCover} alt="" />
          <div className="gallery-info">
            <h1 className='projet-name'>{toTitleCase(project.name)}</h1>
            <p className='projet-type'>{toTitleCase(project.type)}</p>
          </div>
        </div>
        <div className="shared-collection">
          <ShareGallery images={imageUrls} projectId={projectId} collectionId={collectionId} domain={studioName} />
          {project.type !== "FUNERAL" && <p className='studio-tag-line'>{`smile with ${studioName}`}</p>}
        </div>
      </div>
    </>
  );
}