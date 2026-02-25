import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LikeButton from './LikeButton';
import './PreviewBottomControls.scss';

function PreviewBottomControls({ showControls, image, projectId, collectionId, studioName, resetControlsTimeout }) {
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
