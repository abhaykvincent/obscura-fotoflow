import { useState, useEffect, useCallback, useRef } from 'react';
import { updateProjectSelectedImageIdsInFirestore, fetchProject } from '../firebase/functions/firestore';

/**
 * Custom hook to manage persistent image selections in Firestore.
 * Handles fetching existing selections, local state management, and debounced syncing.
 */
export const usePersistentSelection = (studioName, projectId) => {
    const [selectedIds, setSelectedIds] = useState([]);
    const [isSyncing, setIsSyncing] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);
    const syncTimeoutRef = useRef(null);

    // Initial Fetch: Load existing selections from Firestore
    useEffect(() => {
        const loadInitialSelections = async () => {
            if (!studioName || !projectId) return;
            try {
                const projectData = await fetchProject(studioName, projectId);
                if (projectData && projectData.selectedImageIds) {
                    setSelectedIds(projectData.selectedImageIds);
                } else {
                    // Migration: if selectedImageIds doesn't exist, extract from current status-based system
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
            } catch (error) {
                console.error('Error fetching initial selections:', error);
            } finally {
                setInitialLoad(false);
            }
        };
        loadInitialSelections();
    }, [studioName, projectId]);

    // Sync function: Writes the selection array to Firestore
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

    // Debounced sync to avoid excessive API calls
    const debouncedSync = useCallback((ids) => {
        if (syncTimeoutRef.current) {
            clearTimeout(syncTimeoutRef.current);
        }
        
        // We set isSyncing to true immediately to show feedback
        setIsSyncing(true);
        
        syncTimeoutRef.current = setTimeout(() => {
            syncToFirestore(ids);
        }, 2500); // 2.5 seconds debounce
    }, [syncToFirestore]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (syncTimeoutRef.current) {
                clearTimeout(syncTimeoutRef.current);
            }
        };
    }, []);

    // Helper to toggle selection
    const toggleSelection = useCallback((imageUrl) => {
        setSelectedIds(prev => {
            const isAlreadySelected = prev.includes(imageUrl);
            const newSelection = isAlreadySelected
                ? prev.filter(id => id !== imageUrl)
                : [...prev, imageUrl];
            
            // Trigger debounced sync with the new selection
            debouncedSync(newSelection);
            return newSelection;
        });
    }, [debouncedSync]);

    return {
        selectedIds,
        setSelectedIds,
        toggleSelection,
        isSyncing,
        initialLoad
    };
};
