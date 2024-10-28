import React from 'react';
import { closeModal, closeModalWithAnimation, selectModal } from '../../app/slices/modalSlice';
import { useDispatch, useSelector } from 'react-redux';
import { useModalFocus } from '../../hooks/modalInputFocus';

function DeleteConfirmationModal({ itemType, itemName, onDeleteConfirm }) {
  console.log({ itemType, itemName, onDeleteConfirm })
  const dispatch = useDispatch();
  
  const visible = useSelector(selectModal);
  const handleDelete = () => {
    // Call the delete function upon confirmation
    onDeleteConfirm();
    dispatch(closeModalWithAnimation(`confirmDelete${itemType}`));
  };


  
  if (!visible.confirmDeleteproject && !visible.confirmDeletecollection) return null;
  return (
    <div className="modal-container"  >
      <div className="modal island delete-item">
        <div className="modal-header">
          <div className="modal-controls">
            <div 
              className="control close" 
              onClick={() => dispatch(closeModalWithAnimation(`confirmDelete${itemType}`))}
            ></div>
          </div>
          <div className="modal-title">Confirm Deletion</div>
        </div>
        <div className="modal-body">
          <h4 className="message">
            Are you sure you want to delete this {itemType.toLowerCase() } <strong className='caution'>{itemName}</strong>?
          </h4>
          <p className="note">
            <strong>Note:</strong> This action is permanent and will result in the loss of all associated data related to this {itemType.toLowerCase()}.
          </p>
          <br />
          <p className="note">Refresh after Deleting</p>
        </div>
        <div className="actions">
          <div 
            className="button secondary" 
            onClick={() => dispatch(closeModalWithAnimation(`confirmDelete${itemType}`))}
          >
            Cancel
          </div>
          <div className="button warnning" onClick={handleDelete}>Delete</div>
        </div>
      </div>
      <div 
        className="modal-backdrop" 
        onClick={() => dispatch(closeModalWithAnimation(`confirmDelete${itemType}`))}
      ></div>
    </div>
  );
}

export default DeleteConfirmationModal;
