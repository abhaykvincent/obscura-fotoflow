import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import confetti from 'canvas-confetti';
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
  const confettiCanvasRef = useRef(null);
  const hasCelebratedRef = useRef(false);

  // Determine if this is the first upload in the project
  // If uploadedFilesCount is equal to current batch count, it's the first time files are in this project
  const isFirstUpload = project && project.uploadedFilesCount === uploadedCount && uploadedCount > 0;

  useEffect(() => {
    if (visible.uploadCompleted) {
      const count = Object.values(uploadList).filter(file => file.status === 'uploaded').length;
      if (count > 0) {
        setUploadedCount(count);
      }
    } else {
      // Reset count when modal is fully closed/not visible
      setUploadedCount(0);
      hasCelebratedRef.current = false;
    }
  }, [visible.uploadCompleted, uploadList]);

  useEffect(() => {
    if (visible.uploadCompleted && isFirstUpload && !hasCelebratedRef.current && confettiCanvasRef.current) {
      handleConfetti();
      hasCelebratedRef.current = true;
    }
  }, [visible.uploadCompleted, isFirstUpload]);

  const handleConfetti = () => {
    const myConfetti = confetti.create(confettiCanvasRef.current, {
      resize: true,
      useWorker: true
    });
    
    myConfetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#54a134', '#66b346', '#336c1b', '#ffffff']
    });
  };

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
      {isFirstUpload && (
        <canvas
          ref={confettiCanvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 20
          }}
        />
      )}
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
