import { useState, useEffect, useCallback, useRef } from 'react';
import { updateProjectSelectedImageIdsInFirestore, fetchProject, updateProjectLastProgressInFirestore } from '../firebase/functions/firestore';

/**
 * Custom hook to manage persistent image selections and user progress in Firestore.
 */
export const usePersistentSelection = (studioName, projectId) => {
    const [selectedIds, setSelectedIds] = useState([]);
    const [lastProgress, setLastProgress] = useState(null); // { collectionId: string, page: number }
    const [isSyncing, setIsSyncing] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);
    const syncTimeoutRef = useRef(null);
    const progressTimeoutRef = useRef(null);

    // Initial Fetch: Load existing selections and progress
    useEffect(() => {
        const loadInitialData = async () => {
            if (!studioName || !projectId) return;
            try {
                const projectData = await fetchProject(studioName, projectId);
                
                // Set selections
                if (projectData && projectData.selectedImageIds) {
                    setSelectedIds(projectData.selectedImageIds);
                } else {
                    const extractedIds = [];
                    projectData.collections.forEach(collection => {
                        collection.uploadedFiles?.forEach(image => {
                            if (image.status === 'selected') {
                                extractedIds.push(image.url);
                            }
                        });
                    });
                    setSelectedIds(extractedIds);
                }

                // Set last progress
                if (projectData && projectData.lastProgress) {
                    setLastProgress(projectData.lastProgress);
                }
            } catch (error) {
                console.error('Error fetching initial data:', error);
            } finally {
                setInitialLoad(false);
            }
        };
        loadInitialData();
    }, [studioName, projectId]);

    // Sync selections function
    const syncToFirestore = useCallback(async (ids) => {
        if (!studioName || !projectId) return;
        setIsSyncing(true);
        try {
            await updateProjectSelectedImageIdsInFirestore(studioName, projectId, ids);
        } catch (error) {
            console.error('Sync to Firestore failed:', error);
        } finally {
            setIsSyncing(false);
        }
    }, [studioName, projectId]);

    // Save progress function
    const syncProgressToFirestore = useCallback(async (progress) => {
        if (!studioName || !projectId || !progress) return;
        try {
            await updateProjectLastProgressInFirestore(studioName, projectId, progress);
        } catch (error) {
            console.error('Sync progress failed:', error);
        }
    }, [studioName, projectId]);

    // Debounced selection sync
    const debouncedSync = useCallback((ids) => {
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        setIsSyncing(true);
        syncTimeoutRef.current = setTimeout(() => {
            syncToFirestore(ids);
        }, 2500);
    }, [syncToFirestore]);

    // Debounced progress sync
    const saveProgress = useCallback((progress) => {
        // Update local state immediately
        setLastProgress(progress);
        
        if (progressTimeoutRef.current) clearTimeout(progressTimeoutRef.current);
        progressTimeoutRef.current = setTimeout(() => {
            syncProgressToFirestore(progress);
        }, 3000); // 3 seconds debounce for progress
    }, [syncProgressToFirestore]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
            if (progressTimeoutRef.current) clearTimeout(progressTimeoutRef.current);
        };
    }, []);

    const toggleSelection = useCallback((imageUrl) => {
        setSelectedIds(prev => {
            const isAlreadySelected = prev.includes(imageUrl);
            const newSelection = isAlreadySelected
                ? prev.filter(id => id !== imageUrl)
                : [...prev, imageUrl];
            debouncedSync(newSelection);
            return newSelection;
        });
    }, [debouncedSync]);

    return {
        selectedIds,
        setSelectedIds,
        toggleSelection,
        lastProgress,
        saveProgress,
        isSyncing,
        initialLoad
    };
};
