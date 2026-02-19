import React, { useState } from 'react';
import { ref, listAll, getDownloadURL } from 'firebase/storage';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { trackEvent } from '../../analytics/utils';
import { getStorageForDomain } from '../../utils/uploadOperations';
import { getOriginalUrl } from '../../utils/urlUtils';
import { useDispatch } from 'react-redux';
import { showAlert } from '../../app/slices/alertSlice';

const DownloadFiles = ({ folderPath ,className, project,collection, files, buttonText}) => {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const downloadAllFiles = async () => {
    if (project.storage?.status === 'archive') {
      dispatch(showAlert({ type: 'error', message: 'This project is archived. Please restore it to Active Storage to download original files.' }));
      return;
    }

    setLoading(true);
    const zip = new JSZip();

    try {
      let fileList = [];

      if (files && files.length > 0) {
        // Use provided files
        fileList = files.map(file => ({
          url: getOriginalUrl(file.url),
          name: file.name
        }));
      } else if (folderPath) {
        // List all files in the folder
        const storage = await getStorageForDomain(project.domain);
        const folderRef = ref(storage, folderPath);
        const res = await listAll(folderRef);
        
        fileList = await Promise.all(res.items.map(async (itemRef) => ({
          url: getOriginalUrl(await getDownloadURL(itemRef)),
          name: itemRef.name
        })));
      }

      if (fileList.length === 0) {
        dispatch(showAlert({ type: 'error', message: 'No files found to download.' }));
        setLoading(false);
        return;
      }

      // Iterate over each file and add it to the zip
      const filePromises = fileList.map(async (file) => {
        try {
          // Fetch the file data as a blob
          const response = await fetch(file.url);
          const blob = await response.blob();

          // Add the blob to the zip with the corresponding file name
          zip.file(file.name, blob);
        } catch (err) {
          console.error(`Failed to download ${file.name}:`, err);
        }
      });

      // Wait for all files to be added to the zip
      await Promise.all(filePromises);
      trackEvent('gallery_downloaded', {
        project_id: project.id,
        collection_id: collection.id,
        count: fileList.length
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
      <button className={'  lr button secondary  icon download'} onClick={downloadAllFiles} disabled={loading}>
        {loading ? 'Downloading...' : (buttonText || '')}
      </button>
    </div>
  );
};

export default DownloadFiles;
