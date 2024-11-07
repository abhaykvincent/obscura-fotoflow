// Controls.jsx
import React from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
import { shortenFileName } from '../../utils/stringUtils';
import { setCoverPhotoInFirestore, setGalleryCoverPhotoInFirestore } from '../../firebase/functions/firestore';
import DownloadImage from '../../components/ImageDownload/ImageDownload';


function PreviewControls({ image, closePreview, handleDelete, projectId, collectionId, studioName }) {
  return (
    <div className="controls">
      <div className="top-controls">
        <button className="back-button" onClick={closePreview}>Back</button>
        <span className="file-name">{shortenFileName(image.name)}</span>
      </div>
      <div className="bottom-controls">
        <button className={`selection-button ${image.status === "selected" ? 'selected' : ''}`}>
          {image.status === "selected" ? "Selected" : "Approve"}
        </button>
        <DownloadImage url={image.url} fileName={image.name} />
        <DropdownMenu>
          <DropdownMenuTrigger>
            <button className="options-button">Options</button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => setCoverPhotoInFirestore(studioName, projectId, image.url)}>Set Project Cover</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setGalleryCoverPhotoInFirestore(studioName, projectId, collectionId, image.url)}>Set Gallery Cover</DropdownMenuItem>
            <DropdownMenuItem onSelect={handleDelete}>Delete Photo</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default PreviewControls;
