import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import confetti from 'canvas-confetti';
import { closeModalWithAnimation, openModal, selectModal } from '../../app/slices/modalSlice';
import { useModalFocus } from '../../hooks/modalInputFocus';
import { selectUploadList } from '../../app/slices/uploadSlice';
import { selectProjects } from '../../app/slices/projectsSlice';
import checkmark from '../../assets/img/icons/checkmark.svg';

import './UploadCompleted.scss';

function UploadCompletedModal({ project, collectionName }) {
  const dispatch = useDispatch();
  const visible = useSelector(selectModal);
  const uploadList = useSelector(selectUploadList);
  const projects = useSelector(selectProjects);
  const [uploadedCount, setUploadedCount] = useState(0);
  const confettiCanvasRef = useRef(null);
  const hasCelebratedRef = useRef(false);

  // Determine if this is the first project overall AND the first upload in this project
  const isFirstProjectOverall = projects.length === 1;
  const isFirstUploadInThisProject = project && project.uploadedFilesCount === uploadedCount && uploadedCount > 0;
  
  const shouldShowConfetti = isFirstProjectOverall && isFirstUploadInThisProject;

  useEffect(() => {
    if (visible.uploadCompleted) {
      const count = Object.values(uploadList).filter(file => file.status === 'uploaded' || file.state === 'completed').length;
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
    if (visible.uploadCompleted && shouldShowConfetti && !hasCelebratedRef.current && confettiCanvasRef.current) {
      handleConfetti();
      hasCelebratedRef.current = true;
    }
  }, [visible.uploadCompleted, shouldShowConfetti]);

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
      {shouldShowConfetti && (
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
          <label htmlFor="fileInput" className="button primary outline icon upload" onClick={onClose}>
            Upload 
          </label>
          <div className="button primary " onClick={handleShare}>
            Share 
          </div>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}

export default UploadCompletedModal;
