import React from 'react';
import './WelcomeModal.scss';

const WelcomeModal = ({ onPrimaryAction, onClose }) => {
  return (
    <div className="welcome-modal-backdrop">
      <div className="welcome-modal-container">
        <button className="close-button" onClick={onClose}>X</button>
        <div className="welcome-modal-content">
          <h2>Welcome to Fotoflow!</h2>
          <p>
            We built Fotoflow to help you streamline your event workflow and get back to what you love: capturing incredible moments. Let's get you started!
          </p>
          {/* Placeholder for a visual element */}
          <div className="modal-visual">
            <svg /* Friendly icon or graphic */ />
          </div>
          <button className="cta-primary" onClick={onPrimaryAction}>
            Upload Your First Album
          </button>
          <button className="cta-secondary" onClick={onClose}>
            Explore the Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;
