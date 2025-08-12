import React, { useEffect, useState } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
import { shortenFileName } from '../../utils/stringUtils';
import { setCoverPhotoInFirestore, setGalleryCoverPhotoInFirestore } from '../../firebase/functions/firestore';
import DownloadImage from '../../components/ImageDownload/ImageDownload';
import { AnimatePresence, motion } from 'framer-motion';

function PreviewControls({ showControls, image, closePreview, handleDelete, projectId, collectionId, studioName }) {
  const isPhotographer = window.location.pathname.includes('/gallery/');

  const [displayedName, setDisplayedName] = useState(image.name);
  const [transitionKey, setTransitionKey] = useState(Date.now());

  useEffect(() => {
    if (image.name !== displayedName) {
      setTransitionKey(Date.now());
      setTimeout(() => setDisplayedName(image.name), 100);
    }
  }, [image.name]);

  return (
    <div className={`controls top ${showControls ? 'show' : 'hide'}`}>
      <div className='left-controls'>
        <div className="back" onClick={closePreview}></div>

        <span className="file-name" style={{ position: "relative", display: "inline-block", minWidth: "120px" }}>
          <AnimatePresence mode="wait">
            <motion.span
              key={transitionKey}
              initial={{ opacity: 0, x: 5 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -5 }}
              transition={{ duration: 0.3 }}
              style={{ position: "absolute", left: 0 }}
            >
              {shortenFileName(displayedName)}
            </motion.span>
          </AnimatePresence>
        </span>

      </div>

      <div className="right-controls">
        <DownloadImage url={image.url} fileName={image.name} />
        {isPhotographer && (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <div className="options-menu-button">
                <div className="options-button icon options"></div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => setCoverPhotoInFirestore(studioName, projectId, image.url)}>Set Project Cover</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setGalleryCoverPhotoInFirestore(studioName, projectId, collectionId, image.url)}>Set Gallery Cover</DropdownMenuItem>
              <DropdownMenuItem onSelect={handleDelete}>Delete Photo</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

export default PreviewControls;
