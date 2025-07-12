// DownloadImage.jsx
import React from 'react';
import { trackEvent } from '../../analytics/utils';

export async function downloadImage(url, fileName) {
  try {
    trackEvent('image_download', {
      project_id: url
    });
    console.log("Fetching URL:", url); // Log the URL being fetched
    const response = await fetch(url);
    if (!response.ok) {
      console.error("Response not OK. Status:", response.status, response.statusText);
      throw new Error('Download failed!');
    }
    const blob = await response.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error("Error downloading image:", error);
  }
}

function DownloadImage({ url, fileName }) {
  return (
    <div className="icon download" onClick={() => downloadImage(url, fileName)}></div>
  );
}

export default DownloadImage;
