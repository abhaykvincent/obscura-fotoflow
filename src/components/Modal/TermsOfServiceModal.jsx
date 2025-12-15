import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeModalWithAnimation, selectModal } from '../../app/slices/modalSlice';
import { useModalFocus } from '../../hooks/modalInputFocus';

function TermsOfServiceModal() {
  const dispatch = useDispatch();
  const visible = useSelector(selectModal);
  
  const onClose = () => dispatch(closeModalWithAnimation('termsOfService'));
  
  const modalRef = useModalFocus(visible.termsOfService);
  
  if (!visible.termsOfService) {
    return null;
  }

  return (
    <div className="modal-container" ref={modalRef}>
        <div className="modal island">

          <div className="modal-header">
            <div className="modal-controls">
              <div className="control close" onClick={onClose}></div>
              <div className="control minimize"></div>
              <div className="control maximize"></div>
            </div>
            <div className="modal-title">
              Terms of Service
              <p className="modal-subtitle">- FotoFlow</p>
            </div>
          </div>
          
          <div className="modal-body">
            <div className="form-section">
                <div style={{
                    padding: '0 5px', 
                    lineHeight: '1.6', 
                    color: 'var(--secondary-text-color)',
                    maxHeight: '60vh',
                    overflowY: 'auto'
                }}>
                    <h3>1. Acceptance of Terms</h3>
                    <p>By accessing and using FotoFlow, you accept and agree to be bound by the terms and provision of this agreement.</p>
                    
                    <br/>
                    <h3>2. Description of Service</h3>
                    <p>FotoFlow provides a platform for photographers to manage projects, galleries, and client interactions.</p>

                    <br/>
                    <h3>3. User Conduct</h3>
                    <p>Users are responsible for all content posted and activity that occurs under their account.</p>

                    <br/>
                    <h3>4. Intellectual Property</h3>
                    <p>You retain your rights to any content you submit, post or display on or through the Services.</p>

                    {/* Placeholder for more detailed terms */}
                </div>
            </div>
          </div>

          <div className="actions">
            <div className="button primary" onClick={onClose}>
              Close
            </div>
          </div>

        </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}

export default TermsOfServiceModal;
