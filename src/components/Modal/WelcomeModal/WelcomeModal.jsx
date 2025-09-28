import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeModalWithAnimation, openModal, selectModal } from '../../../app/slices/modalSlice';
import { useModalFocus } from '../../../hooks/modalInputFocus';
import './WelcomeModal.scss';
import { selectUser } from '../../../app/slices/authSlice';
import { updateUser } from '../../../firebase/functions/firestore';
import WelcomeScreen from './WelcomeScreen';
import { welcomeScreens } from './WelcomeModalContent';

const WelcomeModal = () => {
  const dispatch = useDispatch();
  const visible = useSelector(selectModal);
  const modalRef = useModalFocus(visible.welcome);
  const user = useSelector(selectUser);
  const [currentStep, setCurrentStep] = useState(0);

  const handleClose = async (openCreateProject = false) => {
    if (user && user.email) {
        try {
            await updateUser(user.email, { hasSeenWelcomeModal: true });
        } catch (error) {
            console.error("Failed to update user's hasSeenWelcomeModal status:", error);
        }
    }
    dispatch(closeModalWithAnimation('welcome'));
    if (openCreateProject) {
        dispatch(openModal('createProject'));
    }
  };

  const handleNext = () => {
    if (currentStep < welcomeScreens.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!visible.welcome) {
    return null;
  }

  const isLastStep = currentStep === welcomeScreens.length - 1;

  return (
    <div className="modal-container welcome-modal" ref={modalRef}>
      <div className="modal island">
        <div className="modal-header">
          <div className="modal-controls">
            <div className="control close" onClick={() => handleClose(false)}></div>
            <div className="control minimize"></div>
            <div className="control maximize"></div>
          </div>
        </div>
        
        <div className="modal-body">
            <div className="screens-slider" style={{ transform: `translateX(-${currentStep * 100}%)` }}>
                {welcomeScreens.map((screen, index) => (
                    <div className="screen-content" key={index}>
                        <WelcomeScreen title={screen.title} body={screen.body} />
                    </div>
                ))}
            </div>
        </div>

        <div className="modal-footer">
            <div className="step-indicator">
                {welcomeScreens.map((_, index) => (
                    <div key={index} className={`dot ${currentStep === index ? 'active' : ''}`}></div>
                ))}
            </div>
            <div className="actions">
            {currentStep > 0 ? (
                <div className="button secondary" onClick={handleBack}>
                    Back
                </div>
            )
            :(
                <div className="button secondary disabled" onClick={handleBack}>
                    Back
                </div>
            )
          }
            {isLastStep ? (
                <>
                    <div className="button primary" onClick={() => handleClose(true)}>
                        Create Project
                    </div>
                </>
            ) : (
                <div className="button primary" onClick={handleNext}>
                    Next
                </div>
            )}
            </div>
        </div>
      </div>
      <div className="modal-backdrop" onClick={() => handleClose(false)}></div>
    </div>
  );
};

export default WelcomeModal;