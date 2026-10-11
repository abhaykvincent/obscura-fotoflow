import React, { useEffect, useMemo, useState, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Lottie from 'react-lottie';
import animationData from '../../assets/animations/CompletedAnimation.json';
import { fetchProject, updateProjectStatusInFirestore } from '../../firebase/functions/firestore';
import {
  fetchSelectionGalleries,
  fetchSelectionGallery,
  completeSelectionGallery,
} from '../../firebase/functions/selection-gallery-firestore';
import SelectionGallery from '../../components/ImageGallery/SelectionGallery';
import SelectionSyncCompleted from '../../components/Modal/SelectionSyncCompleted';
import SelectionProgress from './components/SelectionProgress';
import SelectionCategoryTabs from './components/SelectionCategoryTabs';
import SelectionLimitNotice from './components/SelectionLimitNotice';
import SelectionReview from './components/SelectionReview';
import { useDispatch } from 'react-redux';
import { toTitleCase } from '../../utils/stringUtils';
import { isPinValid } from '../../utils/pinUtils';
import { showAlert } from '../../app/slices/alertSlice';
import { openModal } from '../../app/slices/modalSlice';
import Alert from '../../components/Alert/Alert';
import { requestSelectionReset } from '../../app/slices/selectionRequestSlice';
import { updateCollectionStatus } from '../../app/slices/projectsSlice';
import { usePersistentSelection } from '../../hooks/usePersistentSelection';
import { getCoverUrl } from '../../utils/urlUtils';
import {
  normalizeGallery,
  getPhotoKey,
  getPhotoId,
  isPhotoEligible,
  canSelectPhoto,
  selectionLimitMessage,
  canCompleteGallery,
} from '../../utils/selectionGalleryUtils';
import './Selection.scss';

/**
 * SyncStatus Component: Displays the current synchronization state.
 */
const SyncStatus = memo(({ isSyncing, saveError }) => (
  <div className={`sync-status ${isSyncing ? 'syncing' : 'saved'} ${saveError ? 'error' : ''}`}>
    {saveError ? (
      <>Couldn&apos;t save selection — Try again</>
    ) : isSyncing ? (
      <>
        <span className="sync-icon syncing" />
        Syncing...
      </>
    ) : (
      <>
        <span className="sync-icon saved" />
        Saved
      </>
    )}
  </div>
));

/**
 * CollectionsPanel Component: Displays tabs for navigating through collections.
 * In gallery mode an "All Photos" aggregate tab is offered first so clients
 * don't need to enter each public collection independently.
 */
const CollectionsPanel = memo(({ project, currentCollectionId, studioName, galleryMode, galleryId, showAll }) => {
  const base = galleryMode && galleryId
    ? `/${studioName}/selection/${project.id}/gallery/${galleryId}`
    : `/${studioName}/selection/${project.id}`;
  const eligible = (project.collections || []).filter((c) => (c.uploadedFiles || []).length > 0 || c.selectionGallery !== false);
  return (
    <div className="collections-panel">
      {galleryMode && (
        <div className={`collection-tab ${showAll ? 'active' : ''}`}>
          <Link to={base}>All Photos</Link>
        </div>
      )}
      {(galleryMode ? eligible : project.collections.filter((collection) => collection.selectionGallery !== false)).map(
        (collection) => (
          <div
            key={collection.id}
            className={`
              collection-tab
              ${collection.id === currentCollectionId ? 'active' : ''}
              ${collection.uploadedFiles === undefined ? 'disabled' : ''}
            `}
          >
            <Link to={collection.uploadedFiles !== undefined ? `${base}/${collection.id}` : '#'}>
              {collection.name}
              <span className="photo-count-label">{` ${collection.uploadedFiles?.length || 0}`}</span>
            </Link>
          </div>
        ),
      )}
    </div>
  );
});

export default function Selection() {
  const { studioName, projectId, collectionId, selectionGalleryId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // The gallery route uses :selectionGalleryId; legacy route may carry a
  // gallery id in :collectionId position (old links stay working).
  const routeGalleryId = selectionGalleryId || null;

  const [project, setProject] = useState();
  const [galleries, setGalleries] = useState([]);
  const [gallery, setGallery] = useState(null);
  const [galleryMode, setGalleryMode] = useState(false);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [limitNotice, setLimitNotice] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [finishing, setFinishing] = useState(false);

  // Legacy compat note: /selection/:projectId/:collectionId may carry a gallery id
  // in :collectionId position; resolution happens in the gallery-resolution effect below.
  void galleries;

  // Persistence Layer — gallery-isolated when galleryMode
  const effectiveGalleryId = galleryMode && gallery ? gallery.id : null;
  const {
    selectedIds,
    toggleSelection,
    lastProgress,
    saveProgress,
    isSyncing,
    initialLoad,
    saveError,
    categoryByPhoto,
  } = usePersistentSelection(studioName, projectId, effectiveGalleryId, gallery);

  // Core State (legacy-compatible)
  const [images, setImages] = useState([]);
  const [page, setPage] = useState(1);
  const [hasInitializedProgress, setHasInitializedProgress] = useState(false);
  const [size] = useState(30);
  const [selectionCompleted, setSelectionCompleted] = useState(false);
  const [showAllPhotos, setShowAllPhotos] = useState(true);
  const [showAllCollections, setShowAllCollections] = useState(true);
  const [attemptedToLeaveDuringSync, setAttemptedToLeaveDuringSync] = useState(false);

  // Configuration
  const lottieOptions = useMemo(() => ({
    loop: false,
    autoplay: true,
    animationData,
    rendererSettings: { preserveAspectRatio: 'xMidYMid slice' }
  }), []);

  // --- Gallery resolution ---
  useEffect(() => {
    let cancelled = false;
    const resolve = async () => {
      setGalleryLoading(true);
      try {
        const list = await fetchSelectionGalleries(studioName, projectId).catch(() => []);
        if (cancelled) return;
        setGalleries(list || []);

        if (routeGalleryId) {
          const g = (list || []).find((x) => x.id === routeGalleryId)
            || await fetchSelectionGallery(studioName, projectId, routeGalleryId).catch(() => null);
          if (cancelled) return;
          if (g) {
            setGallery(normalizeGallery(g));
            setGalleryMode(true);
          } else {
            // Unknown gallery id → fall back to legacy so old links never break
            setGalleryMode(false);
          }
        } else if (collectionId && (list || []).some((g) => g.id === collectionId)) {
          const g = list.find((x) => x.id === collectionId);
          if (cancelled) return;
          setGallery(normalizeGallery(g));
          setGalleryMode(true);
        } else if ((list || []).length > 0) {
          // Backward compat: legacy URL opens the active (or first) gallery
          const active = list.find((g) => g.status === 'active') || list[0];
          if (active && (active.status === 'active' || active.status === 'completed' || active.status === 'locked')) {
            if (cancelled) return;
            setGallery(normalizeGallery(active));
            setGalleryMode(true);
          } else if (active && active.status === 'draft' && list.some((g) => g.status === 'active')) {
            const a = list.find((g) => g.status === 'active');
            if (cancelled) return;
            setGallery(normalizeGallery(a));
            setGalleryMode(true);
          } else {
            // All galleries are drafts → stay in legacy workflow until photographer activates
            if (cancelled) return;
            setGalleryMode(false);
          }
        } else {
          if (cancelled) return;
          setGalleryMode(false);
        }
      } catch (e) {
        console.error('Gallery resolution failed, using legacy mode:', e);
        if (!cancelled) setGalleryMode(false);
      } finally {
        if (!cancelled) setGalleryLoading(false);
      }
    };
    if (studioName && projectId) resolve();
    return () => { cancelled = true; };
  }, [studioName, projectId, routeGalleryId, collectionId]);

  // Keep gallery doc fresh (aggregates are denormalized; selections subcollection is truth)
  const refreshGallery = useCallback(async () => {
    if (!studioName || !projectId || !gallery?.id) return;
    try {
      const g = await fetchSelectionGallery(studioName, projectId, gallery.id);
      if (g) setGallery(normalizeGallery(g));
    } catch { /* ignore */ }
  }, [studioName, projectId, gallery?.id]);

  // Active category default: resume progress → first category
  useEffect(() => {
    if (!galleryMode || !gallery) return;
    if (activeCategoryId) return;
    const fromProgress = lastProgress?.categoryId;
    if (fromProgress && gallery.categories.some((c) => c.id === fromProgress)) {
      setActiveCategoryId(fromProgress);
    } else if (gallery.categories.length > 0) {
      setActiveCategoryId(gallery.categories[0].id);
    }
  }, [galleryMode, gallery, lastProgress, activeCategoryId]);

  // --- Derived State ---

  const currentCollectionId = useMemo(() => {
    if (galleryMode) {
      // In gallery mode, collectionId param may be a gallery id (legacy compat) → treat as "all"
      if (!collectionId) return null;
      if (galleries.some((g) => g.id === collectionId)) return null;
      return collectionId;
    }
    return collectionId || project?.collections.find((c) => c.selectionGallery !== false)?.id;
  }, [collectionId, project, galleryMode, galleries]);

  useEffect(() => {
    setShowAllCollections(!currentCollectionId);
  }, [currentCollectionId]);

  const eligiblePhotos = useMemo(() => {
    if (!project) return [];
    const all = [];
    (project.collections || []).forEach((c) => {
      (c.uploadedFiles || []).forEach((f) => {
        const photo = { ...f, collectionId: c.id, collectionName: c.name };
        if (isPhotoEligible(photo)) all.push(photo);
      });
    });
    return all;
  }, [project]);

  const filteredByCollection = useMemo(() => {
    if (!galleryMode) return null;
    if (!currentCollectionId) return eligiblePhotos;
    return eligiblePhotos.filter((p) => p.collectionId === currentCollectionId);
  }, [galleryMode, eligiblePhotos, currentCollectionId]);

  const currentCollectionIndex = useMemo(() => {
    if (!project) return 0;
    return project.collections.findIndex((c) => c.id === currentCollectionId);
  }, [project, currentCollectionId]);

  const selectedIdsSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const selectedImages = useMemo(() => {
    if (!project) return [];
    const allImages = galleryMode
      ? eligiblePhotos
      : project.collections.flatMap((c) => c.uploadedFiles || []);
    return allImages.filter((img) => selectedIdsSet.has(img.url) || selectedIdsSet.has(getPhotoKey(img)));
  }, [project, selectedIdsSet, galleryMode, eligiblePhotos]);

  // Local per-category counts (client truth; server aggregates refresh via gallery doc)
  const localCategoryCounts = useMemo(() => {
    const counts = {};
    selectedIds.forEach((id) => {
      const cat = categoryByPhoto[id];
      if (cat) counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [selectedIds, categoryByPhoto]);

  // Gallery view model merges server aggregates with local optimistic counts
  const viewGallery = useMemo(() => {
    if (!galleryMode || !gallery) return gallery;
    const g = normalizeGallery(gallery);
    const mergedCats = g.categories.map((c) => ({
      ...c,
      selectedCount: localCategoryCounts[c.id] !== undefined
        ? Math.max(Number(c.selectedCount || 0), 0) && (Object.keys(localCategoryCounts).length > 0 ? localCategoryCounts[c.id] || 0 : Number(c.selectedCount || 0))
        : Number(c.selectedCount || 0),
    }));
    // When local state is loaded, prefer local counts (they include optimistic updates)
    const useLocal = selectedIds.length > 0 || Object.keys(categoryByPhoto).length > 0 || !initialLoad;
    return {
      ...g,
      categories: useLocal ? mergedCats.map((c) => ({ ...c, selectedCount: localCategoryCounts[c.id] ?? 0 })) : mergedCats,
      selectedCount: useLocal ? selectedIds.length : g.selectedCount,
      progressPercent: g.selectionMode === 'unlimited' || !g.selectionLimit ? 0
        : Math.min(100, Math.round((((useLocal ? selectedIds.length : g.selectedCount) || 0) / Number(g.selectionLimit)) * 100)),
    };
  }, [galleryMode, gallery, localCategoryCounts, selectedIds, categoryByPhoto, initialLoad]);

  const paginatedImages = useMemo(() => {
    const source = galleryMode ? (filteredByCollection || []) : images;
    if (!showAllPhotos) return selectedImages;
    return source.slice(0, page * size);
  }, [images, page, size, showAllPhotos, selectedImages, galleryMode, filteredByCollection]);

  const sourceLength = galleryMode ? (filteredByCollection || []).length : images.length;
  const hasMore = useMemo(() => {
    return showAllPhotos && paginatedImages.length < sourceLength;
  }, [showAllPhotos, paginatedImages.length, sourceLength]);

  const nextSelectableCollection = useMemo(() => {
    if (!project || galleryMode) return null;
    return project.collections
      .slice(currentCollectionIndex + 1)
      .find((c) => c.selectionGallery !== false);
  }, [project, currentCollectionIndex, galleryMode]);

  const isLastCollection = galleryMode ? true : !nextSelectableCollection;
  const isSelectionCompletedStatus = galleryMode
    ? (gallery?.status === 'completed' || gallery?.status === 'locked' || gallery?.status === 'archived' || selectionCompleted)
    : (project?.status === 'selected' || selectionCompleted);

  // Prevent accidental navigation during sync
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isSyncing) {
        setAttemptedToLeaveDuringSync(true);
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isSyncing]);

  // Handle showing "Safe to Close" modal after sync finishes if user tried to leave
  useEffect(() => {
    if (!isSyncing && attemptedToLeaveDuringSync) {
      dispatch(openModal('selectionSyncCompleted'));
      setAttemptedToLeaveDuringSync(false);
    }
  }, [isSyncing, attemptedToLeaveDuringSync, dispatch]);

  // Security & Global Style
  useEffect(() => {
    if (!isPinValid(projectId)) {
      const pinPath = routeGalleryId
        ? `/${studioName}/selection/${projectId}/gallery/${routeGalleryId}/pin`
        : `/${studioName}/selection/${projectId}/pin`;
      navigate(pinPath);
    }
    const originalBg = document.body.style.backgroundColor;
    document.body.style.backgroundColor = 'white';
    return () => {
      document.body.style.backgroundColor = originalBg;
    };
  }, [studioName, projectId, navigate, routeGalleryId]);

  // Initial Data Fetch
  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        const projectData = await fetchProject(studioName, projectId);
        setProject(projectData);
        if (!galleryMode) {
          const hasSelectableCollections = projectData?.collections?.some((c) => c.selectionGallery !== false);
          if (projectData?.status === 'selected' || !hasSelectableCollections) {
            setSelectionCompleted(true);
          }
        }
      } catch (error) {
        console.error('Failed to fetch project:', error);
      }
    };
    fetchProjectData();
  }, [projectId, studioName, galleryMode]);

  // Gallery completion state
  useEffect(() => {
    if (galleryMode && gallery) {
      if (gallery.status === 'completed' || gallery.status === 'locked' || gallery.status === 'archived') {
        setSelectionCompleted(true);
      } else {
        setSelectionCompleted(false);
      }
    }
  }, [galleryMode, gallery]);

  // Handle Progress Resumption
  useEffect(() => {
    if (initialLoad || galleryLoading || !project || hasInitializedProgress) return;
    let resumed = false;
    if (galleryMode) {
      const targetCat = lastProgress?.categoryId;
      if (targetCat && gallery?.categories?.some((c) => c.id === targetCat)) {
        setActiveCategoryId(targetCat);
        resumed = true;
      }
      if (lastProgress?.page > 1) {
        setPage(lastProgress.page);
        resumed = true;
        setTimeout(() => {
          const scrollPos = (lastProgress.page - 1) * window.innerHeight * 0.8;
          window.scrollTo({ top: scrollPos, behavior: 'smooth' });
        }, 1000);
      }
    } else {
      const activeCollId = collectionId;
      if (!activeCollId) {
        const targetCollId = lastProgress?.collectionId || project.collections.find((c) => c.selectionGallery !== false)?.id;
        if (targetCollId) {
          navigate(`/${studioName}/selection/${projectId}/${targetCollId}`, { replace: true });
          if (lastProgress?.collectionId) resumed = true;
        }
      } else if (lastProgress?.collectionId === activeCollId && lastProgress?.page > 1) {
        setPage(lastProgress.page);
        resumed = true;
        setTimeout(() => {
          const scrollPos = (lastProgress.page - 1) * window.innerHeight * 0.8;
          window.scrollTo({ top: scrollPos, behavior: 'smooth' });
        }, 1000);
      }
    }
    if (resumed) {
      dispatch(showAlert({ type: 'success', message: 'Resumed from where you left off!' }));
    }
    setHasInitializedProgress(true);
  }, [initialLoad, galleryLoading, project, lastProgress, hasInitializedProgress, collectionId, studioName, projectId, navigate, dispatch, galleryMode, gallery]);

  // Update Images when collection changes
  useEffect(() => {
    if (!project) return;
    if (galleryMode) {
      document.title = `${project.name} | ${gallery?.name || 'Selection'}`;
      if (hasInitializedProgress && lastProgress?.collectionId !== (currentCollectionId || null)) {
        setPage(1);
      }
      return;
    }
    const currentColl = project.collections.find((c) => c.id === currentCollectionId);
    if (currentColl && currentColl.selectionGallery === false) {
      const currentIndex = project.collections.findIndex((c) => c.id === currentColl.id);
      const nextColl = project.collections.slice(currentIndex + 1).find((c) => c.selectionGallery !== false);
      if (nextColl) {
        navigate(`/${studioName}/selection/${projectId}/${nextColl.id}`);
        return;
      }
      setSelectionCompleted(true);
      return;
    }
    document.title = `${project.name} | Selection`;
    setImages(currentColl?.uploadedFiles || []);
    if (hasInitializedProgress && lastProgress?.collectionId !== currentCollectionId) {
      setPage(1);
    }
  }, [project, currentCollectionId, studioName, projectId, navigate, hasInitializedProgress, lastProgress, galleryMode, gallery]);

  // Scroll to top on collection change (legacy)
  useEffect(() => {
    if (galleryMode) return;
    if (hasInitializedProgress && (!lastProgress || lastProgress.collectionId !== currentCollectionId)) {
      const galleryElement = document.querySelector('.gallery');
      if (galleryElement) {
        galleryElement.scrollIntoView({ behavior: 'auto', block: 'start' });
      }
    }
  }, [currentCollectionId, hasInitializedProgress, lastProgress, galleryMode]);

  // --- Handlers ---

  const handleLoadMore = useCallback(() => {
    setPage((prev) => {
      const nextPage = prev + 1;
      saveProgress({
        selectionGalleryId: effectiveGalleryId,
        collectionId: currentCollectionId,
        page: nextPage,
        categoryId: activeCategoryId,
      });
      return nextPage;
    });
  }, [currentCollectionId, saveProgress, effectiveGalleryId, activeCategoryId]);

  const handleToggleSelection = useCallback(async (image) => {
    setLimitNotice(null);
    if (galleryMode && viewGallery) {
      const key = getPhotoKey(image);
      const isCurrentlySelected = selectedIds.includes(key) || selectedIds.includes(image.url);
      if (!isCurrentlySelected) {
        // Client-side pre-check for instant UX (server transaction is the real rule)
        const pre = canSelectPhoto({
          gallery: { ...viewGallery, selectedCount: selectedIds.length, categories: viewGallery.categories.map((c) => ({ ...c, selectedCount: localCategoryCounts[c.id] ?? c.selectedCount })) },
          categoryId: activeCategoryId,
          selectedPhotoIds: selectedIds,
          photo: image,
          isAlreadySelected: false,
        });
        if (!pre.allowed) {
          const cat = (viewGallery.categories || []).find((c) => c.id === (pre.categoryId || activeCategoryId));
          setLimitNotice(selectionLimitMessage(pre.reason, {
            overallLimit: viewGallery.selectionLimit,
            categoryName: cat?.name,
            categoryLimit: cat?.maximumSelections ?? cat?.limit,
          }));
          if (pre.reason === 'overall-limit' || pre.reason === 'category-limit') {
            dispatch(showAlert({ type: 'info', message: selectionLimitMessage(pre.reason, { overallLimit: viewGallery.selectionLimit, categoryName: cat?.name, categoryLimit: cat?.maximumSelections ?? cat?.limit }) }));
          }
          return;
        }
      }
      const result = await toggleSelection({ ...image, photoId: getPhotoId(image), photoKey: key }, { categoryId: activeCategoryId });
      if (result && !result.ok) {
        const cat = (viewGallery.categories || []).find((c) => c.id === (result.categoryId || activeCategoryId));
        const msg = selectionLimitMessage(result.reason, {
          overallLimit: viewGallery.selectionLimit,
          categoryName: cat?.name,
          categoryLimit: cat?.maximumSelections ?? cat?.limit,
        });
        setLimitNotice(msg);
        dispatch(showAlert({ type: 'info', message: msg }));
      } else {
        saveProgress({ selectionGalleryId: effectiveGalleryId, collectionId: currentCollectionId, page, categoryId: activeCategoryId });
        refreshGallery();
        // Limit-reached analytics hint
        const after = selectedIds.length + (isCurrentlySelected ? -1 : 1);
        if (viewGallery.selectionLimit && after >= viewGallery.selectionLimit) {
          dispatch(showAlert({ type: 'success', message: `You've selected all ${viewGallery.selectionLimit} photos. Review and finish!` }));
        }
      }
      return;
    }
    // Legacy path
    const isSelecting = !selectedIds.includes(image.url);
    toggleSelection(image.url);
    if (isSelecting) {
      saveProgress({ collectionId: currentCollectionId, page });
    }
  }, [galleryMode, viewGallery, selectedIds, toggleSelection, activeCategoryId, dispatch, saveProgress, effectiveGalleryId, currentCollectionId, page, refreshGallery, localCategoryCounts]);

  const handleCategoryChange = useCallback((catId) => {
    setActiveCategoryId(catId);
    setLimitNotice(null);
    saveProgress({ selectionGalleryId: effectiveGalleryId, collectionId: currentCollectionId, page, categoryId: catId });
  }, [saveProgress, effectiveGalleryId, currentCollectionId, page]);

  const handleNotifyCompleted = useCallback(() => {
    dispatch(showAlert({ type: 'info', message: 'Selection is already completed for this project.' }));
  }, [dispatch]);

  const updateCollectionStatusFinished = useCallback(() => {
    return dispatch(updateCollectionStatus({
      domain: studioName,
      projectId,
      collectionId: currentCollectionId,
      status: 'visible',
      selectionGallery: false
    }));
  }, [dispatch, studioName, projectId, currentCollectionId]);

  const handleFinishCollection = async () => {
    await updateCollectionStatusFinished();
    if (nextSelectableCollection) {
      navigate(`/${studioName}/selection/${projectId}/${nextSelectableCollection.id}`);
    }
  };

  const handleFinishSelection = async () => {
    if (galleryMode && viewGallery) {
      const gate = canCompleteGallery({ ...viewGallery, selectedCount: selectedIds.length, categories: viewGallery.categories.map((c) => ({ ...c, selectedCount: localCategoryCounts[c.id] ?? c.selectedCount })) });
      if (!gate.canComplete) {
        setShowReview(true);
        return;
      }
      setFinishing(true);
      try {
        await completeSelectionGallery(studioName, projectId, viewGallery.id, { completedBy: 'client' });
        // Preserve legacy project-level completion for the default gallery
        if (viewGallery.id === 'default') {
          await updateProjectStatusInFirestore(studioName, projectId, 'selected');
        }
        setSelectionCompleted(true);
        setShowReview(false);
        refreshGallery();
      } catch (error) {
        console.error('Failed to complete selection:', error);
        dispatch(showAlert({ type: 'error', message: 'Could not finish selection. Try again.' }));
      } finally {
        setFinishing(false);
      }
      return;
    }
    if (selectionCompleted) return;
    setSelectionCompleted(true);
    try {
      await updateCollectionStatusFinished();
      await updateProjectStatusInFirestore(studioName, projectId, 'selected');
    } catch (error) {
      console.error('Failed to update project status:', error);
    }
  };

  if (!project || initialLoad || galleryLoading) return null;

  const showGalleryProgress = galleryMode && viewGallery;
  const totalCount = project.uploadedFilesCount || eligiblePhotos.length;

  return (
    <div className="select-project">
      <Alert />
      <SelectionSyncCompleted
        studioName={studioName}
        projectId={projectId}
        projectName={project?.name}
      />

      <div className="project-header">
        <Link to={`/${studioName}/smart-gallery/${project.id}`} className="button back-btn icon back">
          Back to Gallery
        </Link>
        <img className="banner" src={getCoverUrl(project?.projectCover) || ''} alt="Banner" />
        <div className="gallery-info">
          <h1 className="projet-name">{toTitleCase(project.name)}</h1>
          {galleryMode && viewGallery && <p className="gallery-subtitle">{viewGallery.name}</p>}
          <SyncStatus isSyncing={isSyncing} saveError={saveError} />
        </div>
      </div>

      {!selectionCompleted ? (
        <>
          {galleryMode && galleries.length > 1 && (
            <div className="selection-gallery-switcher">
              {galleries.filter((g) => g.status === 'active' || g.status === 'completed').map((g) => (
                <Link
                  key={g.id}
                  to={`/${studioName}/selection/${projectId}/gallery/${g.id}`}
                  className={`gallery-switch-tab ${g.id === viewGallery?.id ? 'active' : ''}`}
                >
                  {g.name}
                </Link>
              ))}
            </div>
          )}

          <CollectionsPanel
            project={project}
            currentCollectionId={currentCollectionId}
            studioName={studioName}
            galleryMode={galleryMode}
            galleryId={viewGallery?.id}
            showAll={showAllCollections}
          />

          {showGalleryProgress && (
            <div className="selection-gallery-status-block">
              <SelectionProgress gallery={viewGallery} count={selectedIds.length} />
              <SelectionCategoryTabs
                gallery={viewGallery}
                activeCategoryId={activeCategoryId}
                onChange={handleCategoryChange}
                countsOverride={localCategoryCounts}
              />
              <SelectionLimitNotice message={limitNotice} onDismiss={() => setLimitNotice(null)} />
              <div className="selection-save-hint">Progress saves automatically — you can leave and resume anytime.</div>
            </div>
          )}

          <div className="shared-collection">
            <div className="view-control">
              <div className="control-label label-all-photos">{galleryMode ? (filteredByCollection || []).length : project.uploadedFilesCount} Photos</div>
              <div className="control-wrap">
                <div className="controls">
                  <div className={`control ${showAllPhotos ? 'active' : ''}`} onClick={() => setShowAllPhotos(true)}>All</div>
                  <div className={`control ${!showAllPhotos ? 'active' : ''}`} onClick={() => setShowAllPhotos(false)}>
                    Selected {selectedImages.length > 0 && <div className="favorite selected"></div>}
                  </div>
                </div>
                <div className="active"></div>
              </div>
              <div className={`control-label label-selected-photos ${selectedImages.length > 0 ? ' active' : ''}`}>
                {selectedImages.length} Photos
              </div>
            </div>

            <div className="selection-completed-label">
              {isSelectionCompletedStatus ? 'Selection Completed' : galleryMode && activeCategoryId
                ? `Selecting for ${(viewGallery?.categories || []).find((c) => c.id === activeCategoryId)?.name || ''} — Click photos to select`
                : 'Click photos to select'}
            </div>

            {paginatedImages.length > 0 ? (
              <SelectionGallery
                isSelectionCompleted={isSelectionCompletedStatus}
                images={paginatedImages}
                selectedIdsSet={selectedIdsSet}
                onToggleSelection={handleToggleSelection}
                onLoadMore={handleLoadMore}
                hasMore={hasMore}
                onNotifyCompleted={handleNotifyCompleted}
                categoryByPhoto={categoryByPhoto}
                categories={viewGallery?.categories || []}
              />
            ) : (
              <div className="no-images-message">
                <p>{showAllPhotos ? 'There are no photos in this collection' : "You haven't selected any photos yet"}</p>
              </div>
            )}

            {showAllPhotos && !hasMore && (galleryMode ? (filteredByCollection || []).length > 0 : images.length > 0) && (
              <div className="collection-actions-footer">
                {galleryMode ? (
                  <>
                    <button className="button primary large" onClick={() => setShowReview(true)}>
                      Review Selection ({selectedIds.length}{viewGallery?.selectionLimit ? ` / ${viewGallery.selectionLimit}` : ''})
                    </button>
                    {viewGallery?.selectionLimit && selectedIds.length >= viewGallery.selectionLimit && (
                      <button className="button primary large" onClick={handleFinishSelection} disabled={finishing}>
                        {finishing ? 'Finishing…' : 'Finish Selection'}
                      </button>
                    )}
                  </>
                ) : isLastCollection ? (
                  <button
                    className="button primary large"
                    onClick={handleFinishSelection}
                  >
                    Finish Selection
                  </button>
                ) : (
                  <button
                    className="button primary large"
                    onClick={handleFinishCollection}
                  >
                    Next Collection: {nextSelectableCollection.name}
                  </button>
                )}
              </div>
            )}
          </div>

          {showReview && viewGallery && createPortal(
            <div className="selection-review-modal modal-container">
              <div className="modal island">
                <SelectionReview
                  gallery={{ ...viewGallery, selectedCount: selectedIds.length, categories: viewGallery.categories.map((c) => ({ ...c, selectedCount: localCategoryCounts[c.id] ?? c.selectedCount })) }}
                  onBack={() => setShowReview(false)}
                  onFinish={handleFinishSelection}
                  finishing={finishing}
                />
              </div>
              <div className="modal-backdrop" onClick={() => setShowReview(false)} />
            </div>,
            document.body,
          )}
        </>
      ) : (
        <div className="selected-completed">
          <div className="completed-animation">
            <Lottie options={lottieOptions} height={160} width={160} />
            <h4>Congratulations!<br /> Your selections are complete</h4>
            {galleryMode && viewGallery ? (
              <p className="selected-files-count">
                You&apos;ve chosen <b>{selectedIds.length}</b> beautiful moments
                {viewGallery.selectionLimit ? <> out of <b>{viewGallery.selectionLimit}</b> required</> : <> out of <b>{totalCount} </b>photos</>}
              </p>
            ) : (
              <p className="selected-files-count">
                You&apos;ve chosen <b>{selectedImages.length}</b> beautiful moments out of <b>{project.uploadedFilesCount} </b>photos
              </p>
            )}
            <p className="button-label">Need to make changes? </p>
            <div
              className="button secondary light-mode text"
              onClick={() => {
                dispatch(requestSelectionReset({
                  domain: studioName,
                  projectId: project.id,
                  projectName: project.name,
                  selectionGalleryId: effectiveGalleryId,
                  galleryName: viewGallery?.name || '',
                }));
                dispatch(showAlert({ type: 'success', message: 'Request sent to photographer!' }));
              }}
            >
              Request to select again
            </div>
          </div>

          <Link to={`/${studioName}/smart-gallery/${project.id}`} className="button  primary ">
            Go to gallery
          </Link>
        </div>
      )}
    </div>
  );
}
