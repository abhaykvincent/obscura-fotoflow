import React, { useEffect, useState } from 'react';
import { Root as DropdownMenu, Content as DropdownMenuContent, Item as DropdownMenuItem, Trigger as DropdownMenuTrigger, Portal as DropdownMenuPortal } from '@radix-ui/react-dropdown-menu';
import { shortenFileName } from '../../utils/stringUtils';
import { setCoverPhotoInFirestore, setGalleryCoverPhotoInFirestore } from '../../firebase/functions/firestore';
import DownloadImage from '../../components/ImageDownload/ImageDownload';
import { AnimatePresence, motion } from 'framer-motion';

function PreviewControls({ showControls, image, closePreview, handleDelete, projectId, collectionId, studioName, resetControlsTimeout, isArchived }) {
  const isPhotographer = window.location.pathname.includes('/gallery/');

  const [displayedName, setDisplayedName] = useState(image.name);
  const [transitionKey, setTransitionKey] = useState(Date.now());

  useEffect(() => {
    if (image.name !== displayedName) {
      setTransitionKey(Date.now());
      setTimeout(() => setDisplayedName(image.name), 100);
    }
  }, [image.name, displayedName]);

  const controlVariants = {
    visible: { y: 0, opacity: 1, transition: { duration: 0.3, ease: "easeOut" } },
    hidden: { y: -50, opacity: 0, transition: { duration: 0.3, ease: "easeIn" } }
  };

  return (
    <AnimatePresence>
      {showControls && (
        <motion.div
          className="controls top glass-panel interactive"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={controlVariants}
          onMouseEnter={resetControlsTimeout}
          onTouchStart={resetControlsTimeout}
          onClick={(e) => e.stopPropagation()} // Prevent closing/toggling when clicking controls
        >
          <div className='left-controls'>
            <div className="back interactive" onClick={closePreview}></div>

            <div className="file-name">
              <AnimatePresence mode="wait">
                <motion.div
                  key={transitionKey}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3 }}
                  className="name-wrapper"
                >
                  {shortenFileName(displayedName)}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <div className="right-controls">
            <div className="interactive">
                <DownloadImage url={image.url} fileName={image.name} isArchived={isArchived} />
            </div>
            
            {isPhotographer && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="options-menu-button interactive">
                    <div className="options-button icon options"></div>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuContent className="glass-dropdown-content" sideOffset={5}>
                    <DropdownMenuItem className="dropdown-item" onSelect={() => setCoverPhotoInFirestore(studioName, projectId, image.url)}>Set Project Cover</DropdownMenuItem>
                    <DropdownMenuItem className="dropdown-item" onSelect={() => setGalleryCoverPhotoInFirestore(studioName, projectId, collectionId, image.url)}>Set Gallery Cover</DropdownMenuItem>
                    <DropdownMenuItem className="dropdown-item delete-item" onSelect={handleDelete}>Delete Photo</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenuPortal>
              </DropdownMenu>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default PreviewControls;
