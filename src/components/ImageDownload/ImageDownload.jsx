import React, { useState, useEffect, useCallback } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Download, Zap, ChevronDown } from 'lucide-react';
import { trackEvent } from '../../analytics/utils';
import { getImageUrlByQuality } from '../../utils/urlUtils';
import { useDispatch } from 'react-redux';
import { showAlert } from '../../app/slices/alertSlice';
import './DownloadImage.scss';

// Smart Download Logic
const SMART_KEY = 'ff_download_history';
const PREFERENCE_KEY = 'ff_download_preference';
const HISTORY_LIMIT = 3;

const getDownloadPreference = () => {
  return localStorage.getItem(PREFERENCE_KEY);
};

const recordDownloadChoice = (choice) => {
  localStorage.setItem(PREFERENCE_KEY, choice);
  
  let history = JSON.parse(localStorage.getItem(SMART_KEY) || '[]');
  history.push(choice);
  if (history.length > HISTORY_LIMIT) {
    history = history.slice(-HISTORY_LIMIT);
  }
  localStorage.setItem(SMART_KEY, JSON.stringify(history));
};

export async function downloadImage(url, fileName, quality = 'original') {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Download failed');
    const blob = await response.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    
    trackEvent('image_download', {
      quality,
      fileName
    });
  } catch (error) {
    console.error("Error downloading image:", error);
    throw error;
  }
}

// Main Component
function DownloadImage({ url, fileName, isArchived }) {
  const [isOpen, setIsOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const dispatch = useDispatch();
  
  const preference = getDownloadPreference();

  const handleDownload = useCallback(async (quality) => {
    if (quality === 'original' && isArchived) {
      dispatch(showAlert({ 
        type: 'error', 
        message: 'Original files are archived. Please restore the project to download.' 
      }));
      return;
    }

    setDownloading(true);
    // Swap prefix from /web to /original or /thumb
    const targetUrl = getImageUrlByQuality(url, quality);
    const targetName = quality !== 'original' ? `${quality}_${fileName}` : fileName;

    try {
      await downloadImage(targetUrl, targetName, quality);
      recordDownloadChoice(quality);
    } catch (error) {
      dispatch(showAlert({ type: 'error', message: 'Download failed. Please try again.' }));
    } finally {
      setDownloading(false);
      setIsOpen(false);
    }
  }, [url, fileName, isArchived, dispatch]);

  const onMainClick = (e) => {
    e.stopPropagation();
    // Default to 'original' if no preference exists yet
    handleDownload(preference || 'original');
  };

  return (
    <div className="download-image-container interactive" onClick={(e) => e.stopPropagation()}>
      <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
        <div className={`download-button-group ${preference ? 'has-preference' : ''}`}>
          <button 
            className={`main-download-btn ${downloading ? 'loading' : ''}`}
            onClick={onMainClick}
            title={preference ? `Download ${preference}` : 'Download Original'}
            disabled={downloading}
          >
            {<Download size={16} />}
            {downloading && <div className="spinner" />}
          </button>
          
          <DropdownMenu.Trigger asChild>
            <button className="dropdown-trigger-btn" aria-label="Download options">
              <ChevronDown size={14} />
            </button>
          </DropdownMenu.Trigger>
        </div>

        <DropdownMenu.Portal>
          <DropdownMenu.Content className="download-dropdown-content" sideOffset={5} align="end">
            <DropdownMenu.Item 
              className={`dropdown-item ${isArchived ? 'disabled' : ''}`}
              onSelect={() => handleDownload('original')}
              disabled={isArchived}
            >
              <div className="item-icon"><Download size={16} /></div>
              <div className="item-text">
                <span className="label">Original Quality</span>
                <span className="desc">{isArchived ? 'Locked (Archived)' : 'Best for printing'}</span>
              </div>
              {preference === 'original' && <Zap size={14} className="pref-indicator" />}
            </DropdownMenu.Item>

            <DropdownMenu.Item 
              className="dropdown-item"
              onSelect={() => handleDownload('compressed')}
            >
              <div className="item-icon"><Zap size={16} /></div>
              <div className="item-text">
                <span className="label">Compressed</span>
                <span className="desc">Best for social media</span>
              </div>
              {preference === 'compressed' && <Zap size={14} className="pref-indicator" />}
            </DropdownMenu.Item>

            {preference && (
              <>
                <DropdownMenu.Separator className="dropdown-separator" />
                <DropdownMenu.Item 
                  className="dropdown-item reset-item"
                  onSelect={() => {
                    localStorage.removeItem(PREFERENCE_KEY);
                    localStorage.removeItem(SMART_KEY);
                    dispatch(showAlert({ type: 'success', message: 'Download preference reset' }));
                  }}
                >
                  <span className="label">Reset preference</span>
                </DropdownMenu.Item>
              </>
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}

export default DownloadImage;