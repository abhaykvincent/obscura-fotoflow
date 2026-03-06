import React, { useEffect, useState } from 'react';
import { Apple, Monitor, Check } from 'lucide-react';
import { FaWindows } from 'react-icons/fa';
import './DownloadApp.scss';
import logo from '../../assets/img/fotoflow-pro-logo.svg';

const DownloadApp = () => {
  const [os, setOs] = useState('macOS');
  const [isAppleSilicon, setIsAppleSilicon] = useState(false);
  const [badgeText, setBadgeText] = useState('Appx 70MB');

  useEffect(() => {
    // Get size from URL parameter if available
    const urlParams = new URLSearchParams(window.location.search);
    const sizeParam = urlParams.get('size');
    if (sizeParam) {
      setBadgeText(sizeParam);
    }

    const userAgent = window.navigator.userAgent.toLowerCase();
    if (userAgent.indexOf('win') !== -1) setOs('Windows');
    else if (userAgent.indexOf('mac') !== -1) {
      setOs('macOS');
      // Simple detection for Apple Silicon
      if (window.navigator.maxTouchPoints > 0 || (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)) {
         // This might be an iPad, but for desktop we check other hints
      }
      setIsAppleSilicon(true); // Defaulting to Silicon as it's common now
    }
    else if (userAgent.indexOf('linux') !== -1) setOs('Linux');
    else if (userAgent.indexOf('iphone') !== -1 || userAgent.indexOf('ipad') !== -1) setOs('iOS');
    else if (userAgent.indexOf('android') !== -1) setOs('Android');
  }, []);

  const downloadLinks = {
    macOS_Silicon: 'https://github.com/abhaykvincent/fotoflow-desktop-lite/releases/download/0.0.1/FotoFlow.Desktop.Lite-0.0.1.dmg',
    macOS_Intel: 'https://github.com/abhaykvincent/fotoflow-desktop-lite/releases/download/0.0.1/FotoFlow.Desktop.Lite-0.0.1.dmg',
    windows_x64: 'https://github.com/abhaykvincent/fotoflow-desktop-lite/releases/download/0.0.1/FotoFlow.Desktop.Lite.Setup.0.0.1.exe',
    windows_arm: 'https://github.com/abhaykvincent/fotoflow-desktop-lite/releases/download/0.0.1/FotoFlow.Desktop.Lite.Setup.0.0.1.exe',
    ios: '#',
    android: '#',
    webapp: 'https://app.fotoflow.pro'
  };

  const handleDownload = (link) => {
    if (link && link !== '#') {
      window.location.href = link;
    }
  };

  const getPrimaryDownloadLink = () => {
    if (os === 'Windows') return downloadLinks.windows_x64;
    if (os === 'macOS') return isAppleSilicon ? downloadLinks.macOS_Silicon : downloadLinks.macOS_Intel;
    return downloadLinks.webapp;
  };

  return (
    <div className="download-app-page">
      <nav className="download-nav">
        <div className="nav-container">
          <div className="nav-left">
            <div className="nav-logo">
              <img src={logo} alt="FotoFlow" />
              <span>FotoFlow</span>
            </div>
            <div className="nav-links">
              <a href="#">Product</a>
              <a href="#">Resources</a>
              <a href="#">Customers</a>
              <a href="#">Pricing</a>
              <a href="#">Now</a>
              <a href="#">Contact</a>
            </div>
          </div>
          <div className="nav-right">
            <a href="/login" className="nav-login">Log in</a>
            <button className="nav-signup">Sign up</button>
          </div>
        </div>
      </nav>

      <main className="download-content">
        <div className="hero-section">
          <div className="app-icon-wrapper">
             <div className="app-icon">
                <img src={logo} alt="FotoFlow Icon" />
             </div>
          </div>
          
          <h1 className="hero-title">Download FotoFlow</h1>
          <p className="hero-subtitle">Available for macOS, Windows and Web</p>

          <div className="primary-action">
            <button className="main-download-btn" onClick={() => handleDownload(getPrimaryDownloadLink())}>
              Download for {os} <span className="kbd-shortcut">D</span>
            </button>
            <div className="optimization-badge">
              <Check size={14} strokeWidth={3} />
              <span>{badgeText}</span>
            </div>
          </div>
        </div>

        <div className="downloads-divider"></div>

        <div className="downloads-list">

          <div className="download-row">
            <div className="platform-info">
              <FaWindows size={18} />
              <span>Windows </span>
            </div>
            <button className="row-download-btn" onClick={() => handleDownload(downloadLinks.windows_x64)}>Download</button>
          </div>

          <div className="download-row">
            <div className="platform-info">
              <Apple size={18} />
              <span>macOS (Apple Silicon)</span>
            </div>
            <button className="row-download-btn" onClick={() => handleDownload(downloadLinks.macOS_Silicon)}>Download</button>
          </div>

          <div className="download-row">
            <div className="platform-info">
              <Apple size={18} />
              <span>macOS (Intel)</span>
            </div>
            <button className="row-download-btn" onClick={() => handleDownload(downloadLinks.macOS_Intel)}>Download</button>
          </div>

          <div className="download-row">
            <div className="platform-info">
              <Monitor size={18} />
              <span>Web app</span>
            </div>
            <button className="row-download-btn open" onClick={() => window.open(downloadLinks.webapp, '_blank')}>Open</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DownloadApp;
