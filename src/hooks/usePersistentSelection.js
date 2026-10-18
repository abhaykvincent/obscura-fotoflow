import { useState, useEffect, useCallback, useRef } from 'react';
import {
    fetchProject,
    updateProjectLastProgressInFirestore,
    updateProjectSelectionsIncremental
} from '../firebase/functions/firestore';
import {
    fetchGallerySelections,
    addPhotoToSelection as apiAddPhoto,
    removePhotoFromSelection as apiRemovePhoto,
} from '../firebase/functions/selection-gallery-firestore';
import { getPhotoKey, getPhotoId } from '../utils/selectionGalleryUtils';

const gallerySelKey = (studioName, projectId, galleryId) =>
    `ff_sel_${studioName}_${projectId}_${galleryId || 'legacy'}`;
const galleryProgressKey = (studioName, projectId, galleryId) =>
    `ff_sel_progress_${studioName}_${projectId}_${galleryId || 'legacy'}`;

const readLocal = (key, fallback) => {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        return JSON.parse(raw);
    } catch { return fallback; }
};
const writeLocal = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
};

/**
 * Persistent selection hook — gallery-isolated.
 *
 * - Legacy mode (no galleryId): preserves existing project-level behaviour
 *   (project.selectedImageIds + project.lastProgress).
 * - Gallery mode (galleryId set): isolates state per gallery, persists
 *   selections to `selectionGalleries/{galleryId}/selections/{photoKey}`
 *   via transactional writes, with localStorage as offline/optimistic cache.
 *   Progress shape: { selectionGalleryId, collectionId, page, categoryId, updatedAt }
 */
export const usePersistentSelection = (studioName, projectId, galleryId = null, gallery = null) => {
    const [selectedIds, setSelectedIds] = useState([]);
    // categoryByPhotoKey: { [photoKey]: categoryId }
    const [categoryByPhoto, setCategoryByPhoto] = useState({});
    const [lastProgress, setLastProgress] = useState(null); // { selectionGalleryId, collectionId, page, categoryId, updatedAt }
    const [isSyncing, setIsSyncing] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);
    const [saveError, setSaveError] = useState(null);

    // Refs for debouncing and tracking changes (legacy path)
    const syncTimeoutRef = useRef(null);
    const progressTimeoutRef = useRef(null);
    const pendingChangesRef = useRef({ add: new Set(), remove: new Set() });
    const galleryIdRef = useRef(galleryId);
    galleryIdRef.current = galleryId;

    const storageKey = gallerySelKey(studioName, projectId, galleryId);
    const progressKey = galleryProgressKey(studioName, projectId, galleryId);

    // Initial Fetch
    useEffect(() => {
        let cancelled = false;
        const loadInitialData = async () => {
            if (!studioName || !projectId) return;
            setInitialLoad(true);
            try {
                // Restore progress (local first, then server)
                const localProgress = readLocal(progressKey, null);
                if (localProgress && !cancelled) setLastProgress(localProgress);

                if (galleryIdRef.current) {
                    // Gallery mode: local cache first for instant UI, then server truth
                    const localSel = readLocal(storageKey, null);
                    if (localSel && Array.isArray(localSel.ids) && !cancelled) {
                        setSelectedIds(localSel.ids);
                        setCategoryByPhoto(localSel.categoryByPhoto || {});
                    }
                    try {
                        const serverSelections = await fetchGallerySelections(studioName, projectId, galleryIdRef.current);
                        if (cancelled) return;
                        const ids = serverSelections.map((s) => s.photoKey || s.photoId || s.url).filter(Boolean);
                        const catMap = {};
                        serverSelections.forEach((s) => {
                            const k = s.photoKey || s.photoId || s.url;
                            if (k && s.categoryId) catMap[k] = s.categoryId;
                        });
                        // Merge: server is truth; keep local-only optimistic adds that aren't on server yet?
                        // For simplicity server wins after load (optimistic adds re-applied via pending queue is out of scope).
                        setSelectedIds(ids);
                        setCategoryByPhoto(catMap);
                        writeLocal(storageKey, { ids, categoryByPhoto: catMap, updatedAt: Date.now() });
                    } catch (e) {
                        console.error('Error fetching gallery selections:', e);
                        // keep local cache
                    }
                    // Server progress lives on the project doc (legacy field) — keep local as primary for galleries
                    try {
                        const projectData = await fetchProject(studioName, projectId);
                        if (!cancelled && projectData?.lastProgress && !localProgress) {
                            setLastProgress({ ...projectData.lastProgress, selectionGalleryId: galleryIdRef.current });
                        }
                    } catch { /* ignore */ }
                } else {
                    // Legacy project-level path (unchanged behaviour)
                    const projectData = await fetchProject(studioName, projectId);
                    if (cancelled) return;
                    if (projectData && projectData.selectedImageIds) {
                        setSelectedIds(projectData.selectedImageIds);
                    } else {
                        const extractedIds = [];
                        (projectData.collections || []).forEach(collection => {
                            collection.uploadedFiles?.forEach(image => {
                                if (image.status === 'selected') {
                                    extractedIds.push(image.url);
                                }
                            });
                        });
                        setSelectedIds(extractedIds);
                    }
                    if (projectData && projectData.lastProgress) {
                        setLastProgress(projectData.lastProgress);
                    } else if (localProgress) {
                        setLastProgress(localProgress);
                    }
                }
            } catch (error) {
                console.error('Error fetching initial data:', error);
            } finally {
                if (!cancelled) setInitialLoad(false);
            }
        };
        loadInitialData();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [studioName, projectId, galleryId]);

    /**
     * Incremental sync to Firestore (legacy path).
     */
    const syncIncrementalToFirestore = useCallback(async (toAdd, toRemove) => {
        if (!studioName || !projectId) return;
        setIsSyncing(true);
        setSaveError(null);
        try {
            await updateProjectSelectionsIncremental(studioName, projectId, toAdd, toRemove);
        } catch (error) {
            console.error('Incremental sync to Firestore failed:', error);
            setSaveError(error);
        } finally {
            setIsSyncing(false);
        }
    }, [studioName, projectId]);

    const debouncedSync = useCallback(() => {
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        setIsSyncing(true);
        syncTimeoutRef.current = setTimeout(async () => {
            const { add, remove } = pendingChangesRef.current;
            const toAdd = Array.from(add);
            const toRemove = Array.from(remove);
            pendingChangesRef.current = { add: new Set(), remove: new Set() };
            if (toAdd.length > 0 || toRemove.length > 0) {
                await syncIncrementalToFirestore(toAdd, toRemove);
            } else {
                setIsSyncing(false);
            }
        }, 2000);
    }, [syncIncrementalToFirestore]);

    // Save progress with debounce; gallery-aware shape
    const saveProgress = useCallback((progress) => {
        const shaped = {
            selectionGalleryId: galleryIdRef.current || progress?.selectionGalleryId || null,
            collectionId: progress?.collectionId || null,
            page: progress?.page || 1,
            categoryId: progress?.categoryId || null,
            updatedAt: Date.now(),
        };
        setLastProgress(shaped);
        writeLocal(progressKey, shaped);
        if (progressTimeoutRef.current) clearTimeout(progressTimeoutRef.current);
        progressTimeoutRef.current = setTimeout(async () => {
            if (!studioName || !projectId) return;
            try {
                // Preserve legacy server field for backward-compat resumption
                await updateProjectLastProgressInFirestore(studioName, projectId, {
                    collectionId: shaped.collectionId,
                    page: shaped.page,
                });
            } catch (error) {
                console.error('Sync progress failed:', error);
            }
        }, 2000);
    }, [studioName, projectId, progressKey]);

    /**
     * Gallery-mode transactional toggle. Returns { ok, reason? }.
     */
    const toggleGallerySelection = useCallback(async (photo, categoryId = null, selectedBy = 'client') => {
        const key = typeof photo === 'string' ? photo : getPhotoKey(photo);
        if (!key) return { ok: false, reason: 'photo-ineligible' };
        const isCurrentlySelected = selectedIds.includes(key);
        // Optimistic UI
        let nextIds;
        let nextCatMap = { ...categoryByPhoto };
        if (isCurrentlySelected) {
            nextIds = selectedIds.filter((id) => id !== key);
            delete nextCatMap[key];
        } else {
            nextIds = [...selectedIds, key];
            if (categoryId) nextCatMap[key] = categoryId;
        }
        setSelectedIds(nextIds);
        setCategoryByPhoto(nextCatMap);
        writeLocal(storageKey, { ids: nextIds, categoryByPhoto: nextCatMap, updatedAt: Date.now() });
        setIsSyncing(true);
        setSaveError(null);
        try {
            let result;
            if (isCurrentlySelected) {
                result = await apiRemovePhoto(studioName, projectId, galleryIdRef.current, { photoKey: key, url: key, photoId: key });
            } else {
                const photoObj = typeof photo === 'string'
                    ? { url: photo, photoId: photo }
                    : { ...photo, photoId: getPhotoId(photo), photoKey: key };
                result = await apiAddPhoto(studioName, projectId, galleryIdRef.current, photoObj, { categoryId, selectedBy });
            }
            if (!result?.ok) {
                // Roll back optimistic update on rejection (limit hit, completed, etc.)
                setSelectedIds(selectedIds);
                setCategoryByPhoto(categoryByPhoto);
                writeLocal(storageKey, { ids: selectedIds, categoryByPhoto, updatedAt: Date.now() });
                return result;
            }
            return result;
        } catch (error) {
            console.error('Gallery selection sync failed:', error);
            // Keep optimistic local state (offline-safe); surface error so UI shows "Couldn't save"
            setSaveError(error);
            return { ok: false, reason: 'network-error', error };
        } finally {
            setIsSyncing(false);
        }
    }, [selectedIds, categoryByPhoto, studioName, projectId, storageKey]);

    /**
     * Legacy toggle (url-based, debounced incremental sync). Preserved verbatim behaviour.
     */
    const toggleLegacySelection = useCallback((imageUrl) => {
        setSelectedIds(prev => {
            const isCurrentlySelected = prev.includes(imageUrl);
            if (isCurrentlySelected) {
                if (pendingChangesRef.current.add.has(imageUrl)) {
                    pendingChangesRef.current.add.delete(imageUrl);
                } else {
                    pendingChangesRef.current.remove.add(imageUrl);
                }
            } else {
                if (pendingChangesRef.current.remove.has(imageUrl)) {
                    pendingChangesRef.current.remove.delete(imageUrl);
                } else {
                    pendingChangesRef.current.add.add(imageUrl);
                }
            }
            const newSelection = isCurrentlySelected
                ? prev.filter(id => id !== imageUrl)
                : [...prev, imageUrl];
            debouncedSync();
            return newSelection;
        });
    }, [debouncedSync]);

    const toggleSelection = useCallback((imageOrUrl, options = {}) => {
        if (galleryIdRef.current) {
            const photo = typeof imageOrUrl === 'string' ? { url: imageOrUrl, photoId: imageOrUrl } : imageOrUrl;
            const categoryId = options.categoryId ?? gallery?.categories?.[0]?.id ?? null;
            // Fire-and-forget with promise return for limit messaging
            return toggleGallerySelection(photo, categoryId, options.selectedBy || 'client');
        }
        const url = typeof imageOrUrl === 'string' ? imageOrUrl : imageOrUrl?.url;
        toggleLegacySelection(url);
        return Promise.resolve({ ok: true });
    }, [toggleGallerySelection, toggleLegacySelection, gallery]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
            if (progressTimeoutRef.current) clearTimeout(progressTimeoutRef.current);
        };
    }, []);

    return {
        selectedIds,
        setSelectedIds,
        toggleSelection,
        toggleGallerySelection,
        lastProgress,
        saveProgress,
        isSyncing,
        initialLoad,
        saveError,
        categoryByPhoto,
        setCategoryByPhoto,
        storageKey,
    };
};
