import { useState, useEffect, useCallback, useRef } from 'react';
import { 
    updateProjectSelectedImageIdsInFirestore, 
    fetchProject, 
    updateProjectLastProgressInFirestore,
    updateProjectSelectionsIncremental 
} from '../firebase/functions/firestore';

/**
 * Custom hook to manage persistent image selections and user progress in Firestore.
 */
export const usePersistentSelection = (studioName, projectId) => {
    const [selectedIds, setSelectedIds] = useState([]);
    const [lastProgress, setLastProgress] = useState(null); // { collectionId: string, page: number }
    const [isSyncing, setIsSyncing] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);
    
    // Refs for debouncing and tracking changes
    const syncTimeoutRef = useRef(null);
    const progressTimeoutRef = useRef(null);
    const pendingChangesRef = useRef({ add: new Set(), remove: new Set() });

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

    /**
     * Incremental sync to Firestore.
     * Uses arrayUnion and arrayRemove to prevent overwriting other users' selections.
     */
    const syncIncrementalToFirestore = useCallback(async (toAdd, toRemove) => {
        if (!studioName || !projectId) return;
        setIsSyncing(true);
        try {
            await updateProjectSelectionsIncremental(studioName, projectId, toAdd, toRemove);
        } catch (error) {
            console.error('Incremental sync to Firestore failed:', error);
            // On failure, we might want to put them back in pending, 
            // but for simplicity and to avoid infinite loops, we'll let the next successful toggle fix it.
            // Or the user can refresh to get the server state.
        } finally {
            setIsSyncing(false);
        }
    }, [studioName, projectId]);

    /**
     * Debounced selection sync trigger.
     * Resets the 2-second timer on every user activity.
     */
    const debouncedSync = useCallback(() => {
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        
        setIsSyncing(true);
        syncTimeoutRef.current = setTimeout(async () => {
            const { add, remove } = pendingChangesRef.current;
            const toAdd = Array.from(add);
            const toRemove = Array.from(remove);
            
            // Reset pending changes BEFORE starting the sync call
            pendingChangesRef.current = { add: new Set(), remove: new Set() };

            if (toAdd.length > 0 || toRemove.length > 0) {
                await syncIncrementalToFirestore(toAdd, toRemove);
            } else {
                setIsSyncing(false);
            }
        }, 2000); // 2-second pause in activity
    }, [syncIncrementalToFirestore]);

    // Save progress function with 2-second debounce
    const saveProgress = useCallback((progress) => {
        setLastProgress(progress);
        
        if (progressTimeoutRef.current) clearTimeout(progressTimeoutRef.current);
        progressTimeoutRef.current = setTimeout(async () => {
            if (!studioName || !projectId || !progress) return;
            try {
                await updateProjectLastProgressInFirestore(studioName, projectId, progress);
            } catch (error) {
                console.error('Sync progress failed:', error);
            }
        }, 2000); // 2-second debounce for progress too
    }, [studioName, projectId]);

    /**
     * Toggles an image selection locally and queues it for incremental sync.
     */
    const toggleSelection = useCallback((imageUrl) => {
        setSelectedIds(prev => {
            const isCurrentlySelected = prev.includes(imageUrl);
            
            // Update Change Log (Queue)
            if (isCurrentlySelected) {
                // Moving from Selected -> Unselected
                if (pendingChangesRef.current.add.has(imageUrl)) {
                    // It was added in this batch, just undo the add
                    pendingChangesRef.current.add.delete(imageUrl);
                } else {
                    // It was already on the server, mark for removal
                    pendingChangesRef.current.remove.add(imageUrl);
                }
            } else {
                // Moving from Unselected -> Selected
                if (pendingChangesRef.current.remove.has(imageUrl)) {
                    // It was removed in this batch, just undo the removal
                    pendingChangesRef.current.remove.delete(imageUrl);
                } else {
                    // It was not on the server, mark for addition
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
        lastProgress,
        saveProgress,
        isSyncing,
        initialLoad
    };
};

