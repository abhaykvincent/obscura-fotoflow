import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeModalWithAnimation, openModal, selectModal } from '../../../app/slices/modalSlice';
import { useModalFocus } from '../../../hooks/modalInputFocus';
import './WelcomeModal.scss';
import { selectUser } from '../../../app/slices/authSlice';
import { updateUser } from '../../../firebase/functions/firestore';

const WelcomeModal = () => {
  const dispatch = useDispatch();
  const visible = useSelector(selectModal);
  const modalRef = useModalFocus(visible.welcome);
  const user = useSelector(selectUser);

  const handleClose = async (openCreateProject = false) => {
    // Mark that the user has seen the modal
    if (user && user.email) {
        try {
            await updateUser(user.email, { hasSeenWelcomeModal: true });
        } catch (error) {
            console.error("Failed to update user's hasSeenWelcomeModal status:", error);
        }
    }

    // Close this modal
    dispatch(closeModalWithAnimation('welcome'));

    // Optionally, open the create project modal
    if (openCreateProject) {
        dispatch(openModal('createProject'));
    }
  };

  if (visible.welcome) {
    return null;
  }

  return (
    <div className="modal-container welcome-modal" ref={modalRef}>
      <div className="modal island">
        <div className="modal-header">
          <div className="modal-controls">
            <div className="control close" onClick={() => handleClose(false)}></div>
            <div className="control minimize"></div>
            <div className="control maximize"></div>
          </div>
          <div className="modal-title">
            Welcome to Fotoflow!
          </div>
        </div>
        
        <div className="modal-body">
          <h2>Create your <span className='iconic-gradient'>First Project</span> </h2>
            <p>
                <span className='mid-highlight'>Simplify</span> your <span className='highlight'>Workflow.</span> <span className='mid-highlight'>Elevate</span> the <span className='highlight'>Client experience</span>. <br/>

            </p>
            {/* Placeholder for a visual element */}
            <div className="visual-placeholder">
                {/* You can replace this div with an actual image or illustration */}
            </div>
            <p>
                <span className='highlight'> Let's  get started . </span> 🎉  
            </p>
        </div>

        <div className="actions">
          <div className="button secondary" onClick={() => handleClose(false)}>
            Dashboard
          </div>
          <div className="button primary" onClick={() => handleClose(true)}>
            Create Project
          </div>
        </div>
      </div>
      <div className="modal-backdrop" onClick={() => handleClose(false)}></div>
    </div>
  );
};

export default WelcomeModal;