import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchImageUrls } from '../../utils/storageOperations';
import { findCollectionById } from '../../utils/CollectionQuery';
import './Share.scss';
import { fetchProject } from '../../firebase/functions/firestore';
import ShareGallery from '../../components/ImageGallery/ShareGallery';

export default function ShareProject() {
  // set body color to white
  useEffect(() => {
    document.body.style.backgroundColor = 'white';
  }, []);
  // Get project from fetchProject and store in state
  let  { projectId, collectionId } = useParams();
  const [project, setProject] = useState();
  const [imageUrls, setImageUrls] = useState([]);

  const [page,setPage]=useState(1);
  const [size,setSize]=useState(100);
  // Fetch Images
// if co collectionIs is passed, use the first collectionId
    collectionId  = collectionId || project?.collections[0]?.id
    
  // Fetch Images based on projectId
  const fetchProjectData = async () => {
    try {
      const projectData = await fetchProject(projectId);
      setProject(projectData);
    } catch (error) {
      console.error('Failed to fetch project:', error);
    }
  };
  const fetchImagesData = async () => {
    try {
      fetchImageUrls(projectId, collectionId, setImageUrls, page, size);
    } catch (error) {
      console.error('Failed to fetch project:', error);
    }
  };
  const findCollectionById= (collections, collectionId) => {
    return collections.find((collection) => collection.id === collectionId);
  }

  useEffect(() => {
    fetchProjectData();
  }, []);

  useEffect(() => {
    if(!project) return
    // find collection name from collection id
    const collection = findCollectionById(project.collections, collectionId);
    document.title = `${project.name} | ${collection.name} | Gallery`
    const newImages = project?.collections.find((collection)=>collection.id===collectionId)?.uploadedFiles;

    setImageUrls(newImages)
    setPage(1)
  }, [project, collectionId]);

  if(!project) return
  
  // Collections panel
  const CollectionsPanel = () => {
    return (
      <div className="collections-panel">
        {
          project.collections.map((collection, index) => (
            <div
              key={collection.id}
              className={`collection-tab ${collection.id === collectionId || (!collectionId && index === 0) ? 'active' : ''}`}
            >
              <Link to={`/share/${project.id}/${collection.id}`}>{collection.name}</Link>
            </div>
          ))
        }
      </div>
    );
  };
  return (
    <div className="share-project">
      <div className="project-header">
        <img className='banner' src={project.projectCover} alt="" srcset="" />
        <div className="gallery-info">
          <h1 className='projet-name'>{project.name}</h1>
          <p>10th October, 2023</p>
          <CollectionsPanel/>
        </div>
        
        
      </div>
        <div className="shared-collection">
          <ShareGallery images={imageUrls} projectId={projectId}/>

        </div>
    </div>
  );
}
