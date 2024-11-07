// DownloadImage.jsx
import React from 'react';

async function downloadImage(url, fileName) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Download failed!');
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
