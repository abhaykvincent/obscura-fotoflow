import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Lottie from 'react-lottie';
import animationData from '../../assets/animations/CompletedAnimation.json';
import { fetchProject, addSelectedImagesToFirestore, updateProjectStatusInFirestore, removeUnselectedImagesFromFirestore } from '../../firebase/functions/firestore';
import GalleryPIN from '../../components/GalleryPIN/GalleryPIN';
import SelectionGallery from '../../components/ImageGallery/SelectionGallery';
import PaginationControl from '../../components/PaginationControl/PaginationControl';
import './Selection.scss';
import { selectDomain } from '../../app/slices/authSlice';
import { useDispatch, useSelector } from 'react-redux';
import { trackEvent } from '../../analytics/utils';
import { toTitleCase } from '../../utils/stringUtils';
import { showAlert } from '../../app/slices/alertSlice';
import Alert from '../../components/Alert/Alert';

export default function Selection() {
  let { studioName,projectId, collectionId } = useParams();
  //Project
  const [project, setProject] = useState();
  const [images, setImages] = useState([]);
  const [authenticated, setAuthenticated] = useState(false)
  const [selectedImages, setSelectedImages] = useState([]);
  const [unselectedImages, setUnselectedImages] = useState([]);
  const [selectedImagesInCollection, setSelectedImagesInCollection] = useState([]);
  const [page,setPage]=useState(1);
  const [size,setSize]=useState(15);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCollections, setTotalCollections] = useState(0);
  const [currentCollectionIndex, setCurrentCollectionIndex] = useState(0);
  const [selectionCompleted, setSelectionCompleted] = useState(false);
  const [isInitialSelection, setIsInitialSelection] = useState(true);

  const [showAllPhotos, setShowAllPhotos] = useState(true);

  const dispatch = useDispatch();
  const defaultOptions = {
    loop: false,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: 'xMidYMid slice'
    }
  };
  collectionId = collectionId || project?.collections[0]?.id;
  
  useEffect(() => {
    document.body.style.backgroundColor = 'white';
  }, []);
  useEffect(() => {
    if(selectionCompleted)  {
      isInitialSelection && setIsInitialSelection(false);
      
  }
  }, [selectionCompleted]);

  // Fetch project and image URLs
  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  // Update images when project or collectionId changes
  useEffect(() => {
    if(!project) return
    document.title = project.name+' | Selection'

    setTotalCollections(project.collections.length)
    setCurrentCollectionIndex(project.collections.findIndex(collection => collection.id === collectionId))
    let newImages = project?.collections.find((collection)=>collection.id===collectionId)?.uploadedFiles || []
    newImages.length>0?setImages(newImages):setImages([])
    setTotalPages(Math.ceil(newImages.length/size))
    setPage(1)
  }, [project, collectionId]);

  // Paginate images
  const paginatedImages = useMemo(() => {
    let imagesTemp = images
    return imagesTemp.slice((page-1)*size,page*size);
  }, [images, page]);
  useEffect(() => {
    const photosDiv = document.querySelector('.gallery');
    if (photosDiv) {
      photosDiv.scrollIntoView({ behavior: 'auto', block: 'start' });
    }
  }, [page,collectionId]); // Trigger scroll on both page and collection changes


  // Fetch project data and set Selected Images  
  const fetchProjectData = async () => {
    try {
      const projectData = await fetchProject(studioName, projectId);

      setProject(projectData);
      // get all images url with status 'selected' from projectData as set
      const selectedImagesInFirestore = []
      projectData.collections.forEach((collection) => {
        collection.uploadedFiles?.forEach((image) => {
          if (image.status === 'selected') {
            selectedImagesInFirestore.push(image);
          }
        });
      });
      setSelectedImages(selectedImagesInFirestore)
    } catch (error) {
      console.error('Failed to fetch project:', error);
    }
  };

  


  // handle selection completed
  const saveSelection = async () => {
    try {
      handleAddOrRemoveSelectedImages()
      await updateProjectStatusInFirestore(studioName,projectId, 'selected')

    }
    catch (error) {
      console.error('Failed to update project status:', error);
    }
      
  };

  const completeSelection = () => {
    if (!selectionCompleted) {
      setSelectionCompleted(true); 
      saveSelection();
    }
  };
  const handleAddOrRemoveSelectedImages = async () => {
    try {
      if (selectedImages.length > 0) {
        await addSelectedImagesToFirestore(studioName, projectId, collectionId, selectedImages, page, size, totalPages);
      } 
      if (unselectedImages.length > 0) {
        await removeUnselectedImagesFromFirestore(studioName, projectId, collectionId, unselectedImages, page, size, totalPages);
      }
      dispatch(showAlert({type:'success', message:`Selection saved!`})); 

      
    } catch (error) {
      console.error('Error updating selected/unselected images:', error);
    }
  };


  // Collections panel
  const CollectionsPanel = () => (
    <div className="collections-panel">
      {project.collections.map((collection, index) => (
        <div
          key={collection.id}
          className={`
            collection-tab 
            ${collection.id === collectionId || (!collectionId && index === 0) ? 'active' : ''}
            ${collection.uploadedFiles === undefined ? 'disabled' : ''}
          `}
        >
          {
          <Link to={collection.uploadedFiles !== undefined && `/${studioName}/selection/${project.id}/${collection.id}`}>{collection.name}
            <span className='photo-count-label'>{` ${project.collections[currentCollectionIndex]?.uploadedFiles?.length}`}</span>
          </Link>
          
        }
        </div>
      ))}
    </div>
  );

  if(!project) return null;

  return (
    <div className="select-project">

      <Alert />
      <div className="project-header">
        <img className='banner' src={images[0]?images[0].url:''} />
        <div className="gallery-info">
          <h1 className='projet-name'>{toTitleCase(project.name)}</h1>
          
        </div>
      </div>
      {!selectionCompleted ? 
      (<>
        <CollectionsPanel/>
        {
          authenticated?
            <div className="shared-collection">
              <div className="view-control">
                  <div className="control-label label-all-photos">{project.uploadedFilesCount} Photos</div>
                  <div className="control-wrap">
                      <div className="controls">
                          <div className={`control ${showAllPhotos ? 'active' : ''}`} onClick={() => setShowAllPhotos(true)}>All</div>
                          <div className={`control ${!showAllPhotos ? 'active' : ''}`} onClick={() => setShowAllPhotos(false)}>Selected  {selectedImages.length>0&&<div className='favorite selected'></div>}</div>
                      </div>
                      <div className={`active`}></div>
                  </div>
                  <div className={`control-label label-selected-photos ${selectedImages.length>0&&' active'}`}>{selectedImages.length} Photos</div>
              </div>
              {
                project.status === 'selected'?
                <div className="selection-completed-label">Selection Completed</div>:
                <div className="selection-completed-label">Click photos to select</div>
              }
              {
                paginatedImages.length>0?
                (<SelectionGallery project={project} images={showAllPhotos ? paginatedImages:selectedImages} {...{selectedImages,setSelectedImages,setUnselectedImages,setSelectedImagesInCollection}} />)
                :
                <div className="no-images-message">
                  <p>There are no photos in this collection</p>
                </div>
              }
              {showAllPhotos && <PaginationControl
                images={paginatedImages}
                currentCollectionIndex={currentCollectionIndex+1}
                totalCollections={totalCollections}
                currentPage={page}
                totalPages={totalPages}
                completeSelection={completeSelection}
                handlePageChange={async (newPage) => {
                  handleAddOrRemoveSelectedImages()

                  setPage(newPage)
                }}
                saveSelection={saveSelection}
                project={project}
              />
}
            </div> 
        :
          <GalleryPIN{...{setAuthenticated,projectPin:project.pin}}/>
        }
      </>)
      :
        <div className="selected-completed">
            <h4>Selection Completed</h4>
          <div className="completed-animation">
          <Lottie
            options={defaultOptions}
            height={200}
            width={200}
            />
            <p className='selected-files-count'>Selected <b>{selectedImages.length}</b> out of {project.uploadedFilesCount}</p>
          <div className="button primary"
            onClick={() => setSelectionCompleted(false)}
          >
            Select Again
          </div>
          </div>
        </div>
      }
    </div>
  );
  
  
  
}
// Line Complexity  1.5 -> 1.7