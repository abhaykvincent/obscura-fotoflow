import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeModalWithAnimation, selectModal } from '../../app/slices/modalSlice';
import { useModalFocus } from '../../hooks/modalInputFocus';

function PrivacyPolicyModal() {
  const dispatch = useDispatch();
  const visible = useSelector(selectModal);
  
  const onClose = () => dispatch(closeModalWithAnimation('privacyPolicy'));
  
  const modalRef = useModalFocus(visible.privacyPolicy);
  
  if (!visible.privacyPolicy) {
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
              Privacy Policy
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
                    <h3>1. Information Collection</h3>
                    <p>We collect information to provide better services to all our users. This includes information you provide to us directly and information we get from your use of our services.</p>
                    
                    <br/>
                    <h3>2. Use of Data</h3>
                    <p>We use the data we collect to operate our business and to provide you with the products we offer.</p>

                    <br/>
                    <h3>3. Data Security</h3>
                    <p>We work hard to protect FotoFlow and our users from unauthorized access to or unauthorized alteration, disclosure or destruction of information we hold.</p>

                    {/* Placeholder for more detailed policy */}
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

export default PrivacyPolicyModal;
