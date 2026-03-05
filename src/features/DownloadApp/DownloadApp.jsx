import React, { useEffect, useState } from 'react';
import { Apple, Monitor, Laptop, Smartphone, Check } from 'lucide-react';
import { FaWindows } from 'react-icons/fa';
import './DownloadApp.scss';
import logo from '../../assets/img/fotoflow-pro-logo.svg';

const DownloadApp = () => {
  const [os, setOs] = useState('macOS');
  const [isAppleSilicon, setIsAppleSilicon] = useState(false);

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (userAgent.indexOf('win') !== -1) setOs('Windows');
    else if (userAgent.indexOf('mac') !== -1) {
      setOs('macOS');
      // Simple detection for Apple Silicon (not 100% reliable in all browsers)
      if (window.navigator.maxTouchPoints > 0 || (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)) {
         // This might be an iPad, but for desktop we check other hints
      }
      // Usually we just show macOS and let user choose Intel/Silicon or default to Silicon
      setIsAppleSilicon(true); // Defaulting to Silicon as it's common now
    }
    else if (userAgent.indexOf('linux') !== -1) setOs('Linux');
    else if (userAgent.indexOf('iphone') !== -1 || userAgent.indexOf('ipad') !== -1) setOs('iOS');
    else if (userAgent.indexOf('android') !== -1) setOs('Android');
  }, []);

  const downloadLinks = {
    macOS_Silicon: '#',
    macOS_Intel: '#',
    windows_x64: '#',
    windows_arm: '#',
    ios: '#',
    android: '#',
    webapp: 'https://app.fotoflow.pro'
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
            <button className="main-download-btn">
              Download for {os} <span className="kbd-shortcut">D</span>
            </button>
            <div className="optimization-badge">
              <Check size={14} strokeWidth={3} />
              <span>Appx 100B</span>
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
            <button className="row-download-btn">Download</button>
          </div>

          <div className="download-row disabled">
            <div className="platform-info">
              <Apple size={18} />
              <span>macOS (Apple Silicon)</span>
            </div>
            <button className="row-download-btn">Download</button>
          </div>

          <div className="download-row  disabled">
            <div className="platform-info">
              <Apple size={18} />
              <span>macOS (Intel)</span>
            </div>
            <button className="row-download-btn">Download</button>
          </div>

          <div className="download-row">
            <div className="platform-info">
              <Monitor size={18} />
              <span>Web app</span>
            </div>
            <button className="row-download-btn open">Open</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DownloadApp;
