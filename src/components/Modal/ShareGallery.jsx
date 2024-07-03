import React, { useEffect, useState } from 'react';

function ShareGallery({project,visible, onClose }) {
  if (!visible) {
    return null;
  }

  return (
    <div className="modal-container">
      <div className="modal create-project">
        <div className='modal-header'>
          <div className="modal-controls">
            <div className="control close" onClick={()=>onClose('shareGallery')}></div>
            <div className="control minimize"></div>
            <div className="control maximize"></div>
          </div>
          <div className="modal-title">Share {project.name} Galleries</div>
        </div>
        <div className='modal-body'>
          <div className="form-section">
          </div>
        </div>
        <div className="actions">
          <div className="button secondary" onClick={()=>onClose('shareGallery')}>Cancel</div>
          <div className="button primary" /* Photos */>Create</div>
        </div>
      </div>
      <div className="modal-backdrop" onClick={()=>onClose('shareGallery')}></div>
    </div>
  );
}

export default ShareGallery