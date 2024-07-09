import React, { useState } from 'react';
import { closeModal } from '../../app/slices/modalSlice';
import { useDispatch } from 'react-redux';

function DeleteConfirmationModal({ onDeleteConfirm}) {
  const dispatch = useDispatch();
  const handleDelete = () => {
    // Call the delete function upon confirmation
    onDeleteConfirm();
  };

  return (
    <div className="modal-container">
      <div className="modal delete-project">
        <div className='modal-header'>
          <div className="modal-controls">
            <div className="control close" onClick={()=>dispatch(closeModal('confirmDeleteProject'))}></div>
          </div>
          <div className="modal-title">Confirm Deletion</div>
        </div>
        <div className='modal-body'>
          <h4 className='message'>Are you sure you want to delete this project?</h4>
          <p className='note'><strong>Note:</strong> This action is permanent and will result in the loss of all associated data.</p>
        </div>
        <div className="actions">
          <div className="button secondary" onClick={()=>dispatch(closeModal('confirmDeleteProject'))}>Cancel</div>
          <div className="button warnning" onClick={handleDelete}>Delete</div>
        </div>
      </div>
      <div className="modal-backdrop" onClick={()=>dispatch(closeModal('confirmDeleteProject'))}></div>
    </div>
  );
}

export default DeleteConfirmationModal;
