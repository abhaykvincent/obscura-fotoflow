import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { closeModalWithAnimation, selectModal } from '../../app/slices/modalSlice';
import { useModalFocus } from '../../hooks/modalInputFocus';
import './OpenInDesktop.scss';
import logo from '../../assets/img/fotoflow-pro-logo.svg';

function OpenInDesktop({ selectedCount = 0 }) {
  const dispatch = useDispatch();
  const visible = useSelector(selectModal);

  const onClose = () => dispatch(closeModalWithAnimation('openInDesktop'));
  const modalRef = useModalFocus(visible.openInDesktop);

  if (!visible.openInDesktop) {
    return null;
  }

  return (
    <div className="open-in-desktop modal-container">
      <div className="modal island" ref={modalRef}>
        <div className="modal-header">
          <div className="modal-controls">
            <div className="control close" onClick={onClose}></div>
            <div className="control minimize"></div>
            <div className="control maximize"></div>
          </div>
          <div className="modal-title">Open in Desktop</div>
        </div>
        <div className="modal-body">
          <div className="instruction-section">
            <div className="desktop-lite-logo">
               <div className="app-icon">
                  <img src={logo} alt="FotoFlow Icon" />
               </div>
            </div>
            <h3>Open FotoFlow Lite </h3>
            <p className="subtitle">Reveal {selectedCount} Original Files in the desktop app to find these files on your computer.</p>

            <div className="steps">
              <div className="step done">
                <div className="step-number">1</div>
                <div className="step-content">
                  <p><strong>Filenames Copied</strong></p>
                  <p className="step-desc">We've copied the names of your {selectedCount} selected images to your clipboard.</p>
                </div>
              </div>
              <div className="step highlight">
                <div className="step-number">2</div>
                <div className="step-content">
                  <p>
                    <strong>Open Desktop Lite</strong>
                    <Link to="/download-app" className="download-link">
                      <span className="highlight">Download</span> app
                    </Link>
                  </p>
                  <p className="step-desc">Launch FotoFlow Desktop Lite on your computer.</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <p><strong>Shoot Folder</strong></p>
                  <p className="step-desc">Simply select the shoot folder on the app  to reveal the files in Finder/Explorer.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="actions">
          <div className="button secondary" onClick={onClose}>Close</div>
          <div className="button primary" onClick={onClose}>Got it</div>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}

export default OpenInDesktop;

