// Controls.jsx
import React from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
import { shortenFileName } from '../../utils/stringUtils';
import { setCoverPhotoInFirestore, setGalleryCoverPhotoInFirestore } from '../../firebase/functions/firestore';
import DownloadImage from '../../components/ImageDownload/ImageDownload';

function PreviewControls({ showControls, image, closePreview, handleDelete, projectId, collectionId, studioName }) {
    // check if its a photographer by looing the url of the page
    // shared gallery contains /gallery/
    const isPhotographer = window.location.pathname.includes('/gallery/')
    return (
    <div className={`controls top ${showControls ? 'show' : 'hide'}`}>
        <div className='left-controls'>
            <div className="back" onClick={closePreview}></div>
            <span className="file-name">{shortenFileName(image.name)}</span>
      </div>
      <div className="right-controls">
        <DownloadImage url={image.url} fileName={image.name} />
        {isPhotographer && <DropdownMenu>
            <DropdownMenuTrigger>
            <div className="options-menu-button">
                <div className="options-button icon options"></div>
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                {isPhotographer && <DropdownMenuItem onSelect={() => setCoverPhotoInFirestore(studioName, projectId, image.url)}>Set Project Cover</DropdownMenuItem>}
                {isPhotographer && <DropdownMenuItem onSelect={() => setGalleryCoverPhotoInFirestore(studioName, projectId, collectionId, image.url)}>Set Gallery Cover</DropdownMenuItem>}
                {isPhotographer && <DropdownMenuItem onSelect={handleDelete}>Delete Photo</DropdownMenuItem>}
            </DropdownMenuContent>
        </DropdownMenu>}
      </div>
    </div>
  );
}

export default PreviewControls;
