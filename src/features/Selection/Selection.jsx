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
import { useSelector } from 'react-redux';
import { trackEvent } from '../../analytics/utils';

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
    console.log(selectionCompleted)
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
    setTotalCollections(project.collections.length)
    
    document.title = project.name+' | Selection'
    setCurrentCollectionIndex(project.collections.findIndex(collection => collection.id === collectionId))
    let newImages = project?.collections.find((collection)=>collection.id===collectionId)?.uploadedFiles || []
    console.log(newImages)
    newImages.length>0?setImages(newImages):setImages([])
    setTotalPages(Math.ceil(newImages.length/size))
    setPage(1)
  }, [project, collectionId]);
  useEffect(() => {
    console.log(selectedImages)
  }, [selectedImages]);

  // Paginate images
  const paginatedImages = useMemo(() => {
    let imagesTemp = images
    return imagesTemp.slice((page-1)*size,page*size);
  }, [images, page]);
  useEffect(() => {
    const photosDiv = document.querySelector('.gallary');
    if (photosDiv) {
      photosDiv.scrollTop = 0;
    }
  }, [page]);


  // Fetch project data and set Selected Images  
  const fetchProjectData = async () => {
    try {
      const projectData = await fetchProject(studioName, projectId);
      console.log(projectData)

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
      setSelectionCompleted(true); // This triggers a re-render
      saveSelection();
      
      trackEvent('selection_completed', {
        project_id: project.id
      });
    }
  };
  const handleAddOrRemoveSelectedImages = async () => {
    try {
      console.log(selectedImages)
      if (selectedImages.length > 0) {
        await addSelectedImagesToFirestore(studioName, projectId, collectionId, selectedImages, page, size, totalPages);
      } 
      if (unselectedImages.length > 0) {
        await removeUnselectedImagesFromFirestore(studioName, projectId, collectionId, unselectedImages, page, size, totalPages);
      }
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
          <Link to={collection.uploadedFiles !== undefined && `/${studioName}/selection/${project.id}/${collection.id}`}>{collection.name}</Link>
          
        }
        </div>
      ))}
    </div>
  );

  if(!project) return null;

  return (
    <div className="select-project">
      <div className="project-header">
        <img className='banner' src={images[0]?images[0].url:''} alt="" srcset="" />
        <div className="gallery-info">
          <h1 className='projet-name'>{project.name}</h1>
          <p>10th October, 2023</p>
        </div>
        <div className="banner" />
      </div>
      {selectionCompleted ? 'true':'false'}
      {!selectionCompleted ? 
      (<>
        <CollectionsPanel/>
        {
          authenticated?
            <div className="shared-collection">
              {
                paginatedImages.length>0?
                <SelectionGallery images={paginatedImages} {...{selectedImages,setSelectedImages,setUnselectedImages,setSelectedImagesInCollection}} />
                :
                <div className="no-images-message">
                  <p>There are no photos in this collection</p>
                </div>
              }
              <PaginationControl
                images={paginatedImages}
                currentCollectionIndex={currentCollectionIndex+1}
                totalCollections={totalCollections}
                currentPage={page}
                totalPages={totalPages}
                completeSelection={completeSelection}
                handlePageChange={(newPage) => {
                  handleAddOrRemoveSelectedImages()
                  setPage(newPage)
                }}
                saveSelection={saveSelection}
                project={project}
              />
            </div> 
        :
          <GalleryPIN{...{setAuthenticated,projectPin:project.pin}}/>
        }
      </>)
      :
        <div className="selected-completed">
            <h4>Selection Complected</h4>
          <div className="completed-animation">
          <Lottie
            options={defaultOptions}
            height={200}
            width={200}
          />
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