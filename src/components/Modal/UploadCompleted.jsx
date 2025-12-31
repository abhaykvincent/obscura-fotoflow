import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeModalWithAnimation, openModal, selectModal } from '../../app/slices/modalSlice';
import { useModalFocus } from '../../hooks/modalInputFocus';
import { selectUploadList } from '../../app/slices/uploadSlice';
import checkmark from '../../assets/img/icons/checkmark.svg';

import './UploadCompleted.scss';

function UploadCompletedModal({ project, collectionName }) {
  const dispatch = useDispatch();
  const visible = useSelector(selectModal);
  const uploadList = useSelector(selectUploadList);
  const [uploadedCount, setUploadedCount] = useState(0);

  useEffect(() => {
    if (visible.uploadCompleted) {
      const count = Object.values(uploadList).filter(file => file.status === 'uploaded').length;
      if (count > 0) {
        setUploadedCount(count);
      }
    } else {
      // Reset count when modal is fully closed/not visible
      setUploadedCount(0);
    }
  }, [visible.uploadCompleted, uploadList]);

  const onClose = () => dispatch(closeModalWithAnimation('uploadCompleted'));

  const handleShare = () => {
    onClose();
    setTimeout(() => {
      dispatch(openModal('shareGallery'));
    }, 500);
  };

  const modalRef = useModalFocus(visible.uploadCompleted);

  if (!visible.uploadCompleted) {
    return null;
  }

  return (
    <div className="modal-container" ref={modalRef}>
      <div className="modal island upload-completed">
        <div className="modal-header">
          <div className="modal-controls">
            <div className="control close" onClick={onClose}></div>
            <div className="control minimize"></div>
            <div className="control maximize"></div>
          </div>
          <div className="modal-title">
            Upload Completed
            {project && <p className="modal-subtitle">- {project.name}</p>}
          </div>
        </div>

        <div className="modal-body">
          <div className="success-content">
            <div className="success-icon">
                <img src={checkmark} alt="Success" />
            </div>
            <h2>Successfully Uploaded!</h2>
            <p>
              <b>{uploadedCount}</b> photos have been added to <b>{collectionName}</b>.
            </p>
          </div>
        </div>

        <div className="actions">
          <div className="button secondary" onClick={onClose}>
            Close
          </div>
          <div className="button primary" onClick={handleShare}>
            Share Gallery
          </div>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}

export default UploadCompletedModal;
