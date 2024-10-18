import React, { useState } from 'react';
import { getStorage, ref, listAll, getDownloadURL } from 'firebase/storage';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { trackEvent } from '../../analytics/utils';

const DownloadFiles = ({ folderPath ,className, project,collection}) => {
  const [loading, setLoading] = useState(false);
  const storage = getStorage();

  const downloadAllFiles = async () => {
    setLoading(true);
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
        const response = await fetch(fileURL, { mode: 'no-cors' });
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
