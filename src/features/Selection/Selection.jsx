import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Lottie from 'react-lottie';
import animationData from '../../assets/animations/CompletedAnimation.json';
import { fetchProject, updateProjectStatusInFirestore } from '../../firebase/functions/firestore';
import SelectionGallery from '../../components/ImageGallery/SelectionGallery';
import PaginationControl from '../../components/PaginationControl/PaginationControl';
import './Selection.scss';
import { useDispatch } from 'react-redux';
import { toTitleCase } from '../../utils/stringUtils';
import { isPinValid } from '../../utils/pinUtils';
import { showAlert } from '../../app/slices/alertSlice';
import Alert from '../../components/Alert/Alert';
import { requestSelectionReset } from '../../app/slices/selectionRequestSlice';
import { updateCollectionStatus } from '../../app/slices/projectsSlice';
import { usePersistentSelection } from '../../hooks/usePersistentSelection';

export default function Selection() {
  let { studioName, projectId, collectionId } = useParams();
  
  // Custom hook for persistent selection logic
  const { 
    selectedIds, 
    toggleSelection, 
    lastProgress,
    saveProgress,
    isSyncing, 
    initialLoad 
  } = usePersistentSelection(studioName, projectId);

  // Project state
  const [project, setProject] = useState();
  const [images, setImages] = useState([]);
  const [selectedImagesInCollection, setSelectedImagesInCollection] = useState([]);
  const [page, setPage] = useState(1);
  const [hasInitializedProgress, setHasInitializedProgress] = useState(false);
  const [size, setSize] = useState(15);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCollections, setTotalCollections] = useState(0);
  const [currentCollectionIndex, setCurrentCollectionIndex] = useState(0);
  const [selectionCompleted, setSelectionCompleted] = useState(false);
  const [isInitialSelection, setIsInitialSelection] = useState(true);

  const [showAllPhotos, setShowAllPhotos] = useState(true);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const defaultOptions = {
    loop: false,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: 'xMidYMid slice'
    }
  };

  // Ensure collectionId is valid
  const currentCollectionId = useMemo(() => {
    return collectionId || project?.collections[0]?.id;
  }, [collectionId, project]);
  
  // Derive selected image objects from IDs across all collections
  const selectedImages = useMemo(() => {
    if (!project) return [];
    const allImages = project.collections.flatMap(c => c.uploadedFiles || []);
    return allImages.filter(img => selectedIds.includes(img.url));
  }, [project, selectedIds]);

  // Security check: PIN validation
  useEffect(() => {
    if (!isPinValid(projectId)) {
      navigate(`/${studioName}/selection/${projectId}/pin`);
    }
  }, [studioName, projectId, navigate]);

  useEffect(() => {
    document.body.style.backgroundColor = 'white';
  }, []);

  useEffect(() => {
    if (selectionCompleted) {
      isInitialSelection && setIsInitialSelection(false);
    }
  }, [selectionCompleted]);

  // Initial Fetch
  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  // Initialize progress once project and lastProgress are loaded
  useEffect(() => {
    if (!initialLoad && project && lastProgress && !hasInitializedProgress) {
      let resumed = false;

      // If we're on a deep-link collection, we respect that, otherwise navigate to last collection
      if (!collectionId && lastProgress.collectionId) {
        navigate(`/${studioName}/selection/${projectId}/${lastProgress.collectionId}`, { replace: true });
        resumed = true;
      }
      
      // If the current collection matches the saved progress collection, set the page
      const activeCollId = collectionId || project.collections[0]?.id;
      if (lastProgress.collectionId === activeCollId) {
        if (lastProgress.page && lastProgress.page > 1) {
          setPage(lastProgress.page);
          resumed = true;
        }
      }

      if (resumed) {
        dispatch(showAlert({
          type: 'success',
          message: 'Resumed from where you left off!',
        }));
      }
      
      setHasInitializedProgress(true);
    } else if (!initialLoad && project && !hasInitializedProgress) {
      // If no progress found but initial load is done
      setHasInitializedProgress(true);
    }
  }, [initialLoad, project, lastProgress, hasInitializedProgress, collectionId, studioName, projectId, navigate, dispatch]);

  // Update images when project or collectionId changes
  useEffect(() => {
    if (!project) return;
    
    const currentColl = project.collections.find(c => c.id === currentCollectionId);

    if (currentColl && currentColl.selectionGallery === false) {
      const currentIndex = project.collections.findIndex(c => c.id === currentColl.id);
      const nextColl = project.collections.slice(currentIndex + 1).find(c => c.selectionGallery !== false);
      
      if (nextColl) {
        navigate(`/${studioName}/selection/${projectId}/${nextColl.id}`);
        return;
      } else {
        setSelectionCompleted(true);
        return;
      }
    }

    document.title = project.name + ' | Selection';

    setTotalCollections(project.collections.length);
    setCurrentCollectionIndex(project.collections.findIndex(collection => collection.id === currentCollectionId));
    
    let newImages = currentColl?.uploadedFiles || [];
    setImages(newImages);
    setTotalPages(Math.ceil(newImages.length / size));
    
    // Only reset page to 1 if we haven't initialized from lastProgress or if the collection changed manually
    if (hasInitializedProgress && lastProgress?.collectionId !== currentCollectionId) {
        setPage(1);
    }
  }, [project, currentCollectionId, studioName, projectId, navigate, size, hasInitializedProgress]);

  // Paginate images
  const paginatedImages = useMemo(() => {
    return images.slice((page - 1) * size, page * size);
  }, [images, page, size]);

  // Scroll to top on page change
  useEffect(() => {
    const photosDiv = document.querySelector('.gallery');
    if (photosDiv) {
      photosDiv.scrollIntoView({ behavior: 'auto', block: 'start' });
    }
  }, [page, currentCollectionId]);

  const fetchProjectData = async () => {
    try {
      const projectData = await fetchProject(studioName, projectId);
      setProject(projectData);

      const firstSelectable = projectData.collections.find(c => c.selectionGallery !== false);
      if (firstSelectable && !collectionId) {
        navigate(`/${studioName}/selection/${projectId}/${firstSelectable.id}`, { replace: true });
      } else if (!firstSelectable) {
        setSelectionCompleted(true);
      }
    } catch (error) {
      console.error('Failed to fetch project:', error);
    }
  };

  const handleToggleSelection = useCallback((image) => {
    const isSelecting = !selectedIds.includes(image.url);
    toggleSelection(image.url);
    
    // Save progress only when an image is being selected (not unselected)
    if (isSelecting) {
      saveProgress({ collectionId: currentCollectionId, page: page });
    }
  }, [toggleSelection, currentCollectionId, page, selectedIds, saveProgress]);

  const saveSelection = async () => {
    dispatch(showAlert({ type: 'success', message: 'Selection auto-saved!' }));
  };

  const completeCollection = async () => {
    try {
      dispatch(updateCollectionStatus({ domain: studioName, projectId, collectionId: currentCollectionId, status: 'visible', selectionGallery: false }));
    } catch (error) {
      console.error('Failed to update collection status:', error);
    }
  };

  const completeSelection = async () => {
    if (!selectionCompleted) {
      setSelectionCompleted(true); 
      try {
        dispatch(updateCollectionStatus({ domain: studioName, projectId, collectionId: currentCollectionId, status: 'visible', selectionGallery: false }));
        await updateProjectStatusInFirestore(studioName, projectId, 'selected');
      } catch (error) {
        console.error('Failed to update project status:', error);
      }
    }
  };

  const SyncStatus = () => (
    <div className={`sync-status ${isSyncing ? 'syncing' : 'saved'}`}>
      {isSyncing ? (
        <><span className="sync-icon">🔄</span> Syncing...</>
      ) : (
        <><span className="sync-icon">✅</span> Saved</>
      )}
    </div>
  );

  const CollectionsPanel = () => (
    <div className="collections-panel">
      {project.collections
        .filter(collection => collection.selectionGallery !== false)
        .map((collection, index) => (
        <div
          key={collection.id}
          className={`
            collection-tab 
            ${collection.id === currentCollectionId ? 'active' : ''}
            ${collection.uploadedFiles === undefined ? 'disabled' : ''}
          `}
        >
          <Link to={collection.uploadedFiles !== undefined ? `/${studioName}/selection/${project.id}/${collection.id}` : '#'}>
            {collection.name}
            <span className='photo-count-label'>{` ${collection.uploadedFiles?.length || 0}`}</span>
          </Link>
        </div>
      ))}
    </div>
  );

  if (!project || initialLoad) return null;

  return (
    <div className="select-project">
      <Alert />
      <div className="project-header">
        <Link to={`/${studioName}/smart-gallery/${project.id}`} className="button back-btn icon back">
          Back to Gallery
        </Link>
        <img className='banner' src={images[0]?.url || ''} alt="Banner" />
        <div className="gallery-info">
          <h1 className='projet-name'>{toTitleCase(project.name)}</h1>
          <SyncStatus />
        </div>
      </div>
      {!selectionCompleted ? 
        (<>
          <CollectionsPanel/>
          <div className="shared-collection">
            <div className="view-control">
                <div className="control-label label-all-photos">{project.uploadedFilesCount} Photos</div>
                <div className="control-wrap">
                    <div className="controls">
                        <div className={`control ${showAllPhotos ? 'active' : ''}`} onClick={() => setShowAllPhotos(true)}>All</div>
                        <div className={`control ${!showAllPhotos ? 'active' : ''}`} onClick={() => setShowAllPhotos(false)}>Selected {selectedImages.length > 0 && <div className='favorite selected'></div>}</div>
                    </div>
                    <div className={`active`}></div>
                </div>
                <div className={`control-label label-selected-photos ${selectedImages.length > 0 ? ' active' : ''}`}>{selectedImages.length} Photos</div>
            </div>
            {
              project.status === 'selected'?
              <div className="selection-completed-label">Selection Completed</div>:
              <div className="selection-completed-label">Click photos to select</div>
            }
            {
              (showAllPhotos ? paginatedImages : selectedImages).length > 0 ?
              (<SelectionGallery 
                project={project} 
                images={showAllPhotos ? paginatedImages : selectedImages} 
                selectedImages={selectedImages} 
                setSelectedImages={handleToggleSelection} 
              />)
              :
              <div className="no-images-message">
                <p>{showAllPhotos ? "There are no photos in this collection" : "You haven't selected any photos yet"}</p>
              </div>
            }
            {showAllPhotos &&
            <PaginationControl
              images={paginatedImages}
              currentCollectionIndex={currentCollectionIndex + 1}
              totalCollections={totalCollections}
              currentPage={page}
              totalPages={totalPages}
              completeSelection={completeSelection}
              completeCollection={completeCollection}
              handlePageChange={(newPage) => setPage(newPage)}
              saveSelection={saveSelection}
              project={project}
            />
            }
          </div> 
        </>)
      :
        <div className="selected-completed">
          <div className="completed-animation">
            <Lottie
              options={defaultOptions}
              height={160}
              width={160}
            />
            <h4>Congratulations!<br/> Your selections are complete</h4>
            <p className='selected-files-count'>You've chosen <b>{selectedImages.length}</b> beautiful moments out of <b>{project.uploadedFilesCount} </b>photos</p>
            <Link to={`/${studioName}/smart-gallery/${project.id}`} className="button large primary ">
              Go to gallery
            </Link>
            <p className='button-label'>Need to make changes? </p>
            <div className="button secondary light-mode text"
              onClick={() => {
                dispatch(requestSelectionReset({ domain: studioName, projectId: project.id, projectName: project.name }));
                dispatch(showAlert({ type: 'success', message: 'Request sent to photographer!' }));
              }}
            >
              Request to select again
            </div>
          </div>
        </div>
      }
    </div>
  );
}
