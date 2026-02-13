import React, { useState } from 'react';
import { ref, listAll, getDownloadURL } from 'firebase/storage';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { trackEvent } from '../../analytics/utils';
import { getStorageForDomain } from '../../utils/uploadOperations';
import { useDispatch } from 'react-redux';
import { showAlert } from '../../app/slices/alertSlice';

const DownloadFiles = ({ folderPath ,className, project,collection}) => {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const downloadAllFiles = async () => {
    if (project.storage?.status === 'archive') {
      dispatch(showAlert({ type: 'error', message: 'This project is archived. Please restore it to Active Storage to download original files.' }));
      return;
    }

    setLoading(true);
    const storage = await getStorageForDomain(project.domain);
    const folderRef = ref(storage, folderPath);
    const zip = new JSZip();

    try {
      // List all files in the folder
      const res = await listAll(folderRef);
      
      // Iterate over each file and add it to the zip
      const filePromises = res.items.map(async (itemRef) => {
        const fileURL = await getDownloadURL(itemRef);
        const fileName = itemRef.name;

        // Fetch the file data as a blob
        const response = await fetch(fileURL);
        const blob = await response.blob();

        // Add the blob to the zip with the corresponding file name
        zip.file(fileName, blob);
      });

      // Wait for all files to be added to the zip
      await Promise.all(filePromises);
      trackEvent('gallery_downloaded', {
        project_id: project.id,
        collection_id: collection.id
    });
      // Generate the zip and download it
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `${project.name} | ${collection.name}.zip`);
    } catch (error) {
      console.error('Error downloading files:', error);
      dispatch(showAlert({ type: 'error', message: 'Failed to download files. Please try again.' }));
    } finally {
      setLoading(false);

    }
  };

  return (
    <div className={className }>
      <button className={' button secondary icon download'} onClick={downloadAllFiles} disabled={loading}>
        {loading ? 'Downloading...' : ''}
      </button>
    </div>
  );
};

export default DownloadFiles;
