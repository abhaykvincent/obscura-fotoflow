import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDispatch } from 'react-redux';
import { toggleFileFavorite } from '../../app/slices/projectsSlice';
import './SelectionButton.scss';

const SelectionButton = ({ image, projectId, collectionId, studioName, resetControlsTimeout }) => {
    const dispatch = useDispatch();
    const [isSelected, setIsSelected] = useState(image.status === 'selected');
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        setIsSelected(image.status === 'selected');
    }, [image.status, image.url]);

    const handleToggleSelection = async (e) => {
        e.stopPropagation();
        if (isUpdating) return;

        resetControlsTimeout?.();
        setIsUpdating(true);

        const newIsSelected = !isSelected;
        
        // Optimistic UI update
        setIsSelected(newIsSelected);

        try {
            await dispatch(toggleFileFavorite({ 
                studioName, 
                projectId, 
                collectionId, 
                imageUrl: image.url 
            })).unwrap();
        } catch (error) {
            console.error('Error toggling selection:', error);
            // Revert on error
            setIsSelected(!newIsSelected);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="selection-button-container interactive" onClick={handleToggleSelection}>
            <motion.div 
                className={`select-icon ${isSelected ? 'active' : ''} ${isUpdating ? 'updating' : ''}`}
                whileTap={{ scale: 0.8 }}
                animate={{ scale: isSelected ? [1, 1.2, 1] : 1 }}
                transition={{ duration: 0.3 }}
            />
            <span className={`selection-label ${isUpdating ? 'updating' : ''}`}>
                {isUpdating ? 'Updating...' : (isSelected ? 'Selected' : 'Select')}
            </span>
        </div>
    );
};

export default SelectionButton;
