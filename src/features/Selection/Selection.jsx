import React, { useEffect, useMemo, useState, useCallback, memo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Lottie from 'react-lottie';
import animationData from '../../assets/animations/CompletedAnimation.json';
import { fetchProject, updateProjectStatusInFirestore } from '../../firebase/functions/firestore';
import SelectionGallery from '../../components/ImageGallery/SelectionGallery';
import PaginationControl from '../../components/PaginationControl/PaginationControl';
import { useDispatch } from 'react-redux';
import { toTitleCase } from '../../utils/stringUtils';
import { isPinValid } from '../../utils/pinUtils';
import { showAlert } from '../../app/slices/alertSlice';
import Alert from '../../components/Alert/Alert';
import { requestSelectionReset } from '../../app/slices/selectionRequestSlice';
import { updateCollectionStatus } from '../../app/slices/projectsSlice';
import { usePersistentSelection } from '../../hooks/usePersistentSelection';
import './Selection.scss';

/**
 * SyncStatus Component: Displays the current synchronization state.
 */
const SyncStatus = memo(({ isSyncing }) => (
  <div className={`sync-status ${isSyncing ? 'syncing' : 'saved'}`}>
    {isSyncing ? (
      <><span className="sync-icon">🔄</span> Syncing...</>
    ) : (
      <><span className="sync-icon">✅</span> Saved</>
    )}
  </div>
));

/**
 * CollectionsPanel Component: Displays tabs for navigating through collections.
 */
const CollectionsPanel = memo(({ project, currentCollectionId, studioName }) => (
  <div className="collections-panel">
    {project.collections
      .filter(collection => collection.selectionGallery !== false)
      .map((collection) => (
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
));

export default function Selection() {
  const { studioName, projectId, collectionId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Persistence Layer
  const { 
    selectedIds, 
    toggleSelection, 
    lastProgress,
    saveProgress,
    isSyncing, 
    initialLoad 
  } = usePersistentSelection(studioName, projectId);

  // Core State
  const [project, setProject] = useState();
  const [images, setImages] = useState([]);
  const [page, setPage] = useState(1);
  const [hasInitializedProgress, setHasInitializedProgress] = useState(false);
  const [size] = useState(15); // Items per page
  const [selectionCompleted, setSelectionCompleted] = useState(false);
  const [showAllPhotos, setShowAllPhotos] = useState(true);

  // Configuration
  const lottieOptions = useMemo(() => ({
    loop: false,
    autoplay: true,
    animationData: animationData,
    rendererSettings: { preserveAspectRatio: 'xMidYMid slice' }
  }), []);

  // --- Derived State ---

  const currentCollectionId = useMemo(() => {
    return collectionId || project?.collections[0]?.id;
  }, [collectionId, project]);

  const currentCollectionIndex = useMemo(() => {
    if (!project) return 0;
    return project.collections.findIndex(c => c.id === currentCollectionId);
  }, [project, currentCollectionId]);

  const totalPages = useMemo(() => {
    return Math.ceil(images.length / size);
  }, [images, size]);

  const selectedImages = useMemo(() => {
    if (!project) return [];
    const allImages = project.collections.flatMap(c => c.uploadedFiles || []);
    return allImages.filter(img => selectedIds.includes(img.url));
  }, [project, selectedIds]);

  const paginatedImages = useMemo(() => {
    return images.slice((page - 1) * size, page * size);
  }, [images, page, size]);

  // --- Effects ---

  // Security & Global Style
  useEffect(() => {
    if (!isPinValid(projectId)) {
      navigate(`/${studioName}/selection/${projectId}/pin`);
    }
    
    const originalBg = document.body.style.backgroundColor;
    document.body.style.backgroundColor = 'white';
    
    return () => {
      document.body.style.backgroundColor = originalBg;
    };
  }, [studioName, projectId, navigate]);

  // Initial Data Fetch
  useEffect(() => {
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

    fetchProjectData();
  }, [projectId, studioName, collectionId, navigate]);

  // Handle Progress Resumption
  useEffect(() => {
    if (initialLoad || !project || hasInitializedProgress) return;

    let resumed = false;
    const activeCollId = collectionId || project.collections[0]?.id;

    // Resuming collection location
    if (!collectionId && lastProgress?.collectionId) {
      navigate(`/${studioName}/selection/${projectId}/${lastProgress.collectionId}`, { replace: true });
      resumed = true;
    }
    
    // Resuming page position
    if (lastProgress?.collectionId === activeCollId && lastProgress?.page > 1) {
      setPage(lastProgress.page);
      resumed = true;
    }

    if (resumed) {
      dispatch(showAlert({
        type: 'success',
        message: 'Resumed from where you left off!',
      }));
    }
    
    setHasInitializedProgress(true);
  }, [initialLoad, project, lastProgress, hasInitializedProgress, collectionId, studioName, projectId, navigate, dispatch]);

  // Update Images when collection changes
  useEffect(() => {
    if (!project) return;
    
    const currentColl = project.collections.find(c => c.id === currentCollectionId);

    // Skip non-selectable galleries
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

    document.title = `${project.name} | Selection`;
    setImages(currentColl?.uploadedFiles || []);
    
    // Reset page if we moved to a new collection manually
    if (hasInitializedProgress && lastProgress?.collectionId !== currentCollectionId) {
      setPage(1);
    }
  }, [project, currentCollectionId, studioName, projectId, navigate, hasInitializedProgress, lastProgress]);

  // Scroll to top on page change
  useEffect(() => {
    const galleryElement = document.querySelector('.gallery');
    if (galleryElement) {
      galleryElement.scrollIntoView({ behavior: 'auto', block: 'start' });
    }
  }, [page, currentCollectionId]);

  // --- Handlers ---

  const handleToggleSelection = useCallback((image) => {
    const isSelecting = !selectedIds.includes(image.url);
    toggleSelection(image.url);
    
    if (isSelecting) {
      saveProgress({ collectionId: currentCollectionId, page: page });
    }
  }, [toggleSelection, currentCollectionId, page, selectedIds, saveProgress]);

  const saveSelection = async () => {
    dispatch(showAlert({ type: 'success', message: 'Selection auto-saved!' }));
  };

  const completeCollection = async () => {
    try {
      dispatch(updateCollectionStatus({ 
        domain: studioName, 
        projectId, 
        collectionId: currentCollectionId, 
        status: 'visible', 
        selectionGallery: false 
      }));
    } catch (error) {
      console.error('Failed to update collection status:', error);
    }
  };

  const completeSelection = async () => {
    if (selectionCompleted) return;

    setSelectionCompleted(true); 
    try {
      dispatch(updateCollectionStatus({ 
        domain: studioName, 
        projectId, 
        collectionId: currentCollectionId, 
        status: 'visible', 
        selectionGallery: false 
      }));
      await updateProjectStatusInFirestore(studioName, projectId, 'selected');
    } catch (error) {
      console.error('Failed to update project status:', error);
    }
  };

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
          <SyncStatus isSyncing={isSyncing} />
        </div>
      </div>

      {!selectionCompleted ? (
        <>
          <CollectionsPanel 
            project={project} 
            currentCollectionId={currentCollectionId} 
            studioName={studioName} 
          />
          
          <div className="shared-collection">
            <div className="view-control">
              <div className="control-label label-all-photos">{project.uploadedFilesCount} Photos</div>
              <div className="control-wrap">
                <div className="controls">
                  <div className={`control ${showAllPhotos ? 'active' : ''}`} onClick={() => setShowAllPhotos(true)}>All</div>
                  <div className={`control ${!showAllPhotos ? 'active' : ''}`} onClick={() => setShowAllPhotos(false)}>
                    Selected {selectedImages.length > 0 && <div className='favorite selected'></div>}
                  </div>
                </div>
                <div className={`active`}></div>
              </div>
              <div className={`control-label label-selected-photos ${selectedImages.length > 0 ? ' active' : ''}`}>
                {selectedImages.length} Photos
              </div>
            </div>

            <div className="selection-completed-label">
              {project.status === 'selected' ? 'Selection Completed' : 'Click photos to select'}
            </div>

            {(showAllPhotos ? paginatedImages : selectedImages).length > 0 ? (
              <SelectionGallery 
                project={project} 
                images={showAllPhotos ? paginatedImages : selectedImages} 
                selectedImages={selectedImages} 
                setSelectedImages={handleToggleSelection} 
              />
            ) : (
              <div className="no-images-message">
                <p>{showAllPhotos ? "There are no photos in this collection" : "You haven't selected any photos yet"}</p>
              </div>
            )}

            {showAllPhotos && (
              <PaginationControl
                images={paginatedImages}
                currentCollectionIndex={currentCollectionIndex + 1}
                totalCollections={project.collections.length}
                currentPage={page}
                totalPages={totalPages}
                completeSelection={completeSelection}
                completeCollection={completeCollection}
                handlePageChange={(newPage) => setPage(newPage)}
                saveSelection={saveSelection}
                project={project}
              />
            )}
          </div> 
        </>
      ) : (
        <div className="selected-completed">
          <div className="completed-animation">
            <Lottie options={lottieOptions} height={160} width={160} />
            <h4>Congratulations!<br/> Your selections are complete</h4>
            <p className='selected-files-count'>
              You've chosen <b>{selectedImages.length}</b> beautiful moments out of <b>{project.uploadedFilesCount} </b>photos
            </p>
            <p className='button-label'>Need to make changes? </p>
            <div 
              className="button secondary light-mode text"
              onClick={() => {
                dispatch(requestSelectionReset({ domain: studioName, projectId: project.id, projectName: project.name }));
                dispatch(showAlert({ type: 'success', message: 'Request sent to photographer!' }));
              }}
            >
              Request to select again
            </div>
          </div>

            <Link to={`/${studioName}/smart-gallery/${project.id}`} className="button large primary ">
              Go to gallery
            </Link>
        </div>
      )}
    </div>
  );
}
