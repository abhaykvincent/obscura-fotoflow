import React from 'react';
import PropTypes from 'prop-types';
import './EmptyGalleriesState.scss';

export default function EmptyGalleriesState({ disabled = false, onCreate }) {
  return (
    <div className={`empty-galleries-state ${disabled ? 'disabled' : ''}`}>
      <div className="empty-galleries-visual" aria-hidden="true">
        <div className="card-stack">
          <div className="stack-card card-back-2" />
          <div className="stack-card card-back-1" />
          <div className="stack-card card-main">
            <div className="card-inner">
              <div className="photo-placeholder">
                <svg
                  className="photo-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
              <div className="card-badge">
                <span className="badge-dot" />
                <span className="badge-line" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="empty-galleries-content">
        <h3 className="empty-galleries-heading">No galleries yet</h3>
        <p className="empty-galleries-description">
          Create your first gallery to start organising and sharing photos with your client.
        </p>
        <div className="empty-galleries-cta-wrapper">
          <button
            type="button"
            className="button primary empty-galleries-btn"
            disabled={disabled}
            onClick={onCreate}
          >
            + Create Gallery
          </button>
          <span className="empty-galleries-supporting-text">
            You can add photos after creating it.
          </span>
        </div>
      </div>
    </div>
  );
}

EmptyGalleriesState.propTypes = {
  disabled: PropTypes.bool,
  onCreate: PropTypes.func.isRequired,
};
