import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchProject, addSelectedImagesToFirestore, updateProjectStatusInFirestore } from '../../firebase/functions/firestore';
import SelectionGallery from '../../components/ImageGallery/SelectionGallery';
import PaginationControl from '../../components/PaginationControl/PaginationControl';
import './Selection.scss';
import GalleryPIN from '../../components/GalleryPIN/GalleryPIN';
export default function Selection() {
  let { projectId, collectionId } = useParams();
  const [project, setProject] = useState();
  const [authenticated, setAuthenticated] = useState(false)
  const [images, setImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedImagesInCollection, setSelectedImagesInCollection] = useState([]);
  const [page,setPage]=useState(1);
  const [size,setSize]=useState(15);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCollections, setTotalCollections] = useState(0);
  const [currentCollectionIndex, setCurrentCollectionIndex] = useState(0);
  collectionId = collectionId || project?.collections[0]?.id;
  console.log(projectId, collectionId)
  // Set body color to white
  useEffect(() => {
    document.body.style.backgroundColor = 'white';
  }, []);

  // Fetch project and image URLs
  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  // Update images when project or collectionId changes
  useEffect(() => {
    if(!project) return
    // set document title
    setTotalCollections(project.collections.length)
    
    document.title = project.name+' | Selection'
    setCurrentCollectionIndex(project.collections.findIndex(collection => collection.id === collectionId))
    let newImages = project?.collections.find((collection)=>collection.id===collectionId)?.uploadedFiles || []
    setImages(newImages);
    setTotalPages(Math.ceil(newImages.length/size))
    setPage(1)
  }, [project, collectionId]);

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


  // Fetch project data
  const fetchProjectData = async () => {
    try {
      const projectData = await fetchProject(projectId);
      setProject(projectData);
      // get all images url with status 'selected' from projectData as set
      const selectedImagesInFirestore = []
      projectData.collections.forEach((collection) => {
        collection.uploadedFiles.forEach((image) => {
          if (image.status === 'selected') {
            selectedImagesInFirestore.push(image.url);
          }
        });
      });
      setSelectedImages(selectedImagesInFirestore)
    } catch (error) {
      console.error('Failed to fetch project:', error);
    }
  };

  // Handle add selected images
  const handleAddSelectedImages = async () => {
    try {
      await addSelectedImagesToFirestore(projectId, collectionId, selectedImages,page,size,totalPages);
      // handle success (e.g. show a success message)
    } catch (error) {
      console.error('Failed to add selected images:', error);
      // handle error (e.g. show an error message)
    }
  };

  // handle selection completed
  const handleSelectionCompleted = async () => {
    try {
      await updateProjectStatusInFirestore(projectId, 'selected');
      // handle success (e.g. show a success message)
    }
    catch (error) {
      console.error('Failed to update project status:', error);
      // handle error (e.g. show an error message)
    }
      
  };

  // Collections panel
  const CollectionsPanel = () => (
    <div className="collections-panel">
      {project.collections.map((collection, index) => (
        <div
          key={collection.id}
          className={`collection-tab ${collection.id === collectionId || (!collectionId && index === 0) ? 'active' : ''}`}
        >
          <Link to={`/selection/${project.id}/${collection.id}`}>{collection.name}</Link>
        </div>
      ))}
    </div>
  );

  if(!project) return null;

  return (
    <div className="select-project">
      <div className="project-header">
        <img className='banner' src={images[0]?images[0].url:''} alt="" srcset="" />
        <div className="project-info">
          <h1 className='projet-name'>{project.name}</h1>
          <p>10th October, 2023</p>
        </div>
        <div className="banner" />
      </div>

      <CollectionsPanel/>
      {
        authenticated?
      <div className="shared-collection">
        {
          paginatedImages.length>0?
          <SelectionGallery images={paginatedImages} {...{selectedImages,setSelectedImages,setSelectedImagesInCollection}} />
          :
          <div className="no-images-message">
            <p>There are no photos in this collection</p>
          </div>
        }
        <PaginationControl
          currentCollectionIndex={currentCollectionIndex+1}
          totalCollections={totalCollections}
          currentPage={page}
          totalPages={totalPages}
          handlePageChange={(newPage) => {
            saveSelectedImages()
            setPage(newPage)
          }}
          handleSelectionCompleted={handleSelectionCompleted}
          project={project}
        />
      </div>:
      <GalleryPIN{...{setAuthenticated,projectPin:project.pin}}/>
      }
    </div>
  );

  function saveSelectedImages() {
    handleAddSelectedImages()
    selectedImages.forEach((image) => selectedImagesInCollection.push(image))
  }
}
// Line Complexity  1.5 ->