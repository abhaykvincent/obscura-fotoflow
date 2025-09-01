import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchImageUrls } from '../../utils/storageOperations';
import { findCollectionById } from '../../utils/CollectionQuery';
import './Share.scss';
import { fetchCollectionStatus, fetchProject, fetchProjectsFromFirestore } from '../../firebase/functions/firestore';
import ShareGallery from '../../components/ImageGallery/ShareGallery';
import { useSelector } from 'react-redux';
import { selectDomain, selectIsAuthenticated, selectUser, selectUserStudio } from '../../app/slices/authSlice';
import { toTitleCase } from '../../utils/stringUtils';
import { setUserType, trackEvent } from '../../analytics/utils';
import { set } from 'date-fns';
import { LoadingLight } from '../../components/Loading/Loading';

export default function ShareProject() {
  // studio =  get the url and the name is lorem for url http://localhost:3000/lorem/gallery/william-thomas-b23Sg/birthday-qr22E
  
  const { studioName } = useParams();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const [loading, setLoading] = useState(true);
  
  // set body color to white
  useEffect(() => {
    document.body.style.backgroundColor = 'white';
    

  }, []);
  // Get project from fetchProject and store in state
  let  { projectId, collectionId } = useParams();
  const [project, setProject] = useState();
  const [imageUrls, setImageUrls] = useState([]);
  const defaultStudio = useSelector(selectUserStudio)

  const [displayGallery, setDisplayGallery] = useState(false);
  const [page,setPage]=useState(1);
  const [size,setSize]=useState(100);
  // Fetch Images
// if co collectionIs is passed, use the first collectionId
    collectionId  = collectionId || project?.collections[0]?.id
    
    
  // Fetch Images based on projectId
  const fetchProjectData = async () => {
    try {
      const projectData = await fetchProject(studioName,projectId);
      setProject(projectData);
      
      if(!isAuthenticated || user=='no-studio-found'){
        setUserType('Guest');
      }
    } catch (error) {
      console.error('Failed to fetch project:', error);
    }
  };
  /* const fetchImagesData = async () => {
    try {
      fetchImageUrls(studioName, projectId, collectionId, setImageUrls, page, size);
    } catch (error) {
      console.error('Failed to fetch project:', error);
    }
  }; */
  const findCollectionById= (collections, collectionId) => {
    return collections.find((collection) => collection.id === collectionId);
  }

  useEffect(() => {
    fetchProjectData().then(() => {
      setTimeout(() => {
        setLoading(false);
      }, 2000);
    });
    //fetchImagesData()
    

  }, []);

  useEffect(() => {
    if(!project) return
    // find collection name from collection id
    const collection = findCollectionById(project.collections, collectionId);
    document.title = `${project.name} | ${collection?.name} | Gallery`
    const newImages = project?.collections.find((collection)=>collection.id===collectionId)?.uploadedFiles;
    setImageUrls(newImages)
    setPage(1)
  }, [project, collectionId]);

  useEffect(() => {
    const checkCollectionStatus = async () => {
      try {
        const status = await fetchCollectionStatus(studioName, projectId, collectionId, {domain: studioName});
        if (status === 'visible') {
          setDisplayGallery(true);
        } else {
          setDisplayGallery(false);
        }
      } catch (error) {
        console.error('Error fetching collection status:', error);
        setDisplayGallery(false); // Hide gallery on error
      }
    };

    checkCollectionStatus();
  }, [studioName, projectId, collectionId]);
  if(!project) return
  
  // Collections panel
  const CollectionsPanel = () => {
  return (
    <div className="">
      <div className="collections-panel">
        {project.collections.map((collection, index) => (
          collection.uploadedFiles?.length !== 0 && 
        
          collection.uploadedFiles !== undefined && <div
            key={collection.id}
            className={`
              collection-tab  active
            `}
          >
            {
            <Link to={collection.uploadedFiles !== undefined && `/${studioName}/share/${project.id}/${collection.id}`}>{collection.name}</Link>
            }
          </div>
        ))}
      </div>
    </div>
    );
  };
  return (
    <>
    {
      loading && <LoadingLight/> 
    }
    <div className="share-project" >
      <div className="project-header">
        <img className='banner' src={project.projectCover} alt="" />
        <div className="gallery-info">
          <h1 className='projet-name'>{toTitleCase(project.name)}</h1>
          <p className='projet-type'>{toTitleCase(project.type)}</p>
          <div className="collections-panel client-selection">
            <div className={`collection-tab client-selection-tab`}  >
              <Link to={`/${studioName}/selection/${project.id}`}>Photo Selection</Link>
            </div>
          </div>
          <CollectionsPanel/>
        </div>
      </div>
      <div className="shared-collection">
        <ShareGallery images={imageUrls} projectId={projectId} collectionId={collectionId} domain={studioName}/>
        
        {/* !!! HIGH Cloud Cost Trigger */}
        {/* DONOT USE until we have a better way to handle this */}
        {/* <p className='align-center'>Other Collections</p>
        {
          project.collections.length>=1 &&
            <CollectionsPanel/>
        }
        */}


        {
          project.type !== "FUNERAL" && <p className='studio-tag-line'>{`smile with ${studioName}`}</p>
        }
        
      </div>
    </div>
      
    </>

  );
}
