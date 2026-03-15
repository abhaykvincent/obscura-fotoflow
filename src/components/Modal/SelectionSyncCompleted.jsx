import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeModalWithAnimation, selectModal } from '../../app/slices/modalSlice';
import { useModalFocus } from '../../hooks/modalInputFocus';
import checkmark from '../../assets/img/icons/checkmark.svg';
import { Link } from 'react-router-dom';

import './SelectionSyncCompleted.scss';

function SelectionSyncCompleted({ studioName, projectId, projectName }) {
  const dispatch = useDispatch();
  const visible = useSelector(selectModal);

  const onClose = () => dispatch(closeModalWithAnimation('selectionSyncCompleted'));

  const modalRef = useModalFocus(visible.selectionSyncCompleted);

  if (!visible.selectionSyncCompleted) {
    return null;
  }

  return (
    <div className="modal-container" ref={modalRef}>
      <div className="modal island selection-sync-completed">
        <div className="modal-header">
          <div className="modal-controls">
            <div className="control close" onClick={onClose}></div>
            <div className="control minimize"></div>
            <div className="control maximize"></div>
          </div>
          <div className="modal-title">
            Changes Saved
            {projectName && <p className="modal-subtitle">- {projectName}</p>}
          </div>
        </div>

        <div className="modal-body">
          <div className="success-content">
            <div className="success-icon">
                <img src={checkmark} alt="Success" />
            </div>
            <h2>All Changes Secured!</h2>
            <p>
              Your selections have been successfully synchronized. It is now <b>safe to close</b> this window or continue to the gallery.
            </p>
          </div>
        </div>

        <div className="actions">
          <Link 
            to={`/${studioName}/smart-gallery/${projectId}`} 
            className="button primary outline" 
            onClick={onClose}
          >
            Back to Gallery
          </Link>
          <div className="button primary" onClick={onClose}>
            Stay Here
          </div>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}

export default SelectionSyncCompleted;
