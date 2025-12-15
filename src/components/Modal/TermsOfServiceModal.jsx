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
                    <p style={{ fontSize: '0.9em', marginBottom: '20px' }}>Last Updated: December 15, 2025</p>

                    <h3>1. Acceptance of Terms</h3>
                    <p>Welcome to FotoFlow ("Company", "we", "our", "us"). By registering for, accessing, or using our photo management and gallery sharing services (the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you must not access or use the Service.</p>
                    
                    <br/>
                    <h3>2. Account Registration and Security</h3>
                    <p>To use certain features of the Service, you must register for an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.</p>
                    <p>You are responsible for safeguarding your password and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.</p>

                    <br/>
                    <h3>3. User Content and Proprietary Rights</h3>
                    <p><strong>3.1 Your Ownership:</strong> You retain full ownership and intellectual property rights to the photos, images, and other content you upload to FotoFlow ("User Content"). We do not claim ownership over your User Content.</p>
                    <p><strong>3.2 License to FotoFlow:</strong> By uploading User Content, you grant FotoFlow a worldwide, non-exclusive, royalty-free license to use, host, store, reproduce, modify, create derivative works (such as thumbnails or optimized versions), and display your User Content solely for the purpose of operating, promoting, and improving our Service and providing it to you and your designated viewers.</p>
                    <p><strong>3.3 Representations:</strong> You represent and warrant that you own or have the necessary licenses, rights, consents, and permissions to publish the User Content you submit.</p>

                    <br/>
                    <h3>4. Acceptable Use</h3>
                    <p>You agree not to use the Service to:</p>
                    <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
                        <li>Upload content that is illegal, harmful, threatening, abusive, harassing, defamatory, obscene, or invasive of another's privacy.</li>
                        <li>Violate any applicable local, state, national, or international law.</li>
                        <li>Infringe upon the intellectual property rights of others.</li>
                        <li>Transmit any viruses, malware, or other malicious code.</li>
                    </ul>

                    <br/>
                    <h3>5. Service Availability and Termination</h3>
                    <p>We strive to keep the Service available 24/7 but do not guarantee uninterrupted access. We reserve the right to suspend or terminate your account at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties, or for any other reason.</p>

                    <br/>
                    <h3>6. Limitation of Liability</h3>
                    <p>To the maximum extent permitted by law, FotoFlow shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses, resulting from (a) your access to or use of or inability to access or use the Service; (b) any conduct or content of any third party on the Service; or (c) unauthorized access, use, or alteration of your transmissions or content.</p>

                    <br/>
                    <h3>7. Changes to Terms</h3>
                    <p>We reserve the right to modify these Terms at any time. We will provide notice of significant changes by posting the new Terms on the Service or by sending you an email. Your continued use of the Service after the effective date of the revised Terms constitutes your acceptance of the terms.</p>

                    <br/>
                    <h3>8. Contact Us</h3>
                    <p>If you have any questions about these Terms, please contact us at support@fotoflow.app.</p>
                </div>
            </div>
          </div>

          <div className="actions">
            <div className="button primary" onClick={onClose}>
              I Agree
            </div>
          </div>

        </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}

export default TermsOfServiceModal;