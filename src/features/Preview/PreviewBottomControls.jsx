import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import LikeButton from './LikeButton';
import SelectionButton from './SelectionButton';
import { isPinValid } from '../../utils/pinUtils';
import { selectIsAuthenticated, selectUser } from '../../app/slices/authSlice';
import './PreviewBottomControls.scss';

function PreviewBottomControls({ showControls, image, projectId, collectionId, studioName, resetControlsTimeout }) {
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const user = useSelector(selectUser);
    const projects = useSelector((state) => state.projects.data);

    const collection = projects.find(p => p.id === projectId)?.collections.find(c => c.id === collectionId);

    const isPhotographer = isAuthenticated && user?.studio?.domain === studioName;
    const isClientWithPIN = isPinValid(projectId);
    
    // Photographer can always select, clients only if selectionGallery is active
    const canSelect = isPhotographer || (isClientWithPIN && collection?.selectionGallery === true);

    const controlVariants = {
        visible: { y: 0, opacity: 1, transition: { duration: 0.3, ease: "easeOut" } },
        hidden: { y: 50, opacity: 0, transition: { duration: 0.3, ease: "easeIn" } }
    };

    return (
        <AnimatePresence>
            {showControls && (
                <motion.div
                    className="controls bottom glass-panel interactive"
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={controlVariants}
                    onMouseEnter={resetControlsTimeout}
                    onTouchStart={resetControlsTimeout}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="bottom-controls-content">
                        {canSelect && (
                            <SelectionButton 
                                image={image} 
                                projectId={projectId} 
                                collectionId={collectionId} 
                                studioName={studioName} 
                                resetControlsTimeout={resetControlsTimeout}
                            />
                        )}
                        <LikeButton 
                            image={image} 
                            projectId={projectId} 
                            collectionId={collectionId} 
                            studioName={studioName} 
                            resetControlsTimeout={resetControlsTimeout}
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default PreviewBottomControls;
