import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { updateImageLikeCountInFirestore } from '../../firebase/functions/firestore';
import './LikeButton.scss';

const LikeButton = ({ image, projectId, collectionId, studioName, resetControlsTimeout }) => {
    const [likes, setLikes] = useState(image.likes || 0);
    const [isLiked, setIsLiked] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    // Get a unique ID for this image to track in localStorage
    const imageId = `${projectId}_${collectionId}_${image.name || image.url.split('/').pop()}`;

    useEffect(() => {
        // Sync with image prop when it changes (e.g., when navigating between images)
        setLikes(image.likes || 0);
        
        // Check localStorage for liked status
        const likedImages = JSON.parse(localStorage.getItem('likedImages') || '{}');
        setIsLiked(!!likedImages[imageId]);
    }, [image.url, imageId, image.likes]);

    const handleLike = async (e) => {
        e.stopPropagation();
        if (isUpdating) return;

        resetControlsTimeout?.();
        setIsUpdating(true);

        const newAction = isLiked ? 'decrement' : 'increment';
        const newIsLiked = !isLiked;

        // Optimistic UI update
        setIsLiked(newIsLiked);
        setLikes(prev => newAction === 'increment' ? prev + 1 : Math.max(0, prev - 1));

        try {
            const updatedLikes = await updateImageLikeCountInFirestore(studioName, projectId, collectionId, image.url, newAction);
            setLikes(updatedLikes);

            // Update localStorage
            const likedImages = JSON.parse(localStorage.getItem('likedImages') || '{}');
            if (newIsLiked) {
                likedImages[imageId] = true;
            } else {
                delete likedImages[imageId];
            }
            localStorage.setItem('likedImages', JSON.stringify(likedImages));
        } catch (error) {
            console.error('Error liking image:', error);
            // Revert on error
            setIsLiked(!newIsLiked);
            setLikes(prev => newAction === 'increment' ? Math.max(0, prev - 1) : prev + 1);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="like-button-container interactive" onClick={handleLike}>
            <motion.div 
                className={`heart-icon ${isLiked ? 'active' : ''} ${isUpdating ? 'updating' : ''}`}
                whileTap={{ scale: 0.8 }}
                animate={{ scale: isLiked ? [1, 1.2, 1] : 1 }}
                transition={{ duration: 0.3 }}
            />
            <AnimatePresence mode="wait">
                <motion.span 
                    key={likes}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="likes-count"
                >
                    {likes > 0 ? likes : '0'}
                </motion.span>
            </AnimatePresence>
        </div>
    );
};

export default LikeButton;
