import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeModalWithAnimation, selectModal } from '../../app/slices/modalSlice';
import { useModalFocus } from '../../hooks/modalInputFocus';

function TermsOfServiceModal() {
  const dispatch = useDispatch();
  const visible = useSelector(selectModal);
  
  const onClose = () => dispatch(closeModalWithAnimation('termsOfService'));
  const onAgree = () => {
    const checkbox = document.getElementById('privacyPolicy');
    if (checkbox && !checkbox.checked) {
        checkbox.click();
    }
    dispatch(closeModalWithAnimation('termsOfService'));
  };
  
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
                    <p><strong>B2B Service:</strong> This Service is intended for professional use by photographers, studios, and businesses ("Customers"). By using the Service, you represent that you are using it for business or professional purposes.</p>

                    <br/>
                    <h3>2. Account Registration and Security</h3>
                    <p>To use certain features of the Service (Storage, CRM, Invoicing, etc.), you must register for an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.</p>
                    <p>You are responsible for safeguarding your password and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.</p>

                    <br/>
                    <h3>3. User Content and Client Data</h3>
                    <p><strong>3.1 Your Ownership:</strong> You retain full ownership and intellectual property rights to the photos, images, and other content you upload to FotoFlow ("User Content"). We do not claim ownership over your User Content.</p>
                    <p><strong>3.2 Client Data (CRM):</strong> In using our CRM and Invoicing features, you may submit personal data of your clients (e.g., names, addresses, phone numbers). You represent that you have obtained all necessary consents and permissions from your clients to store and process their data using our Service.</p>
                    <p><strong>3.3 License to FotoFlow:</strong> By uploading User Content, you grant FotoFlow a worldwide, non-exclusive, royalty-free license to use, host, store, reproduce, modify, create derivative works (such as thumbnails or optimized versions), and display your User Content solely for the purpose of operating, promoting, and improving our Service and providing it to you and your designated viewers.</p>

                    <br/>
                    <h3>4. Fees, Payments and Taxes</h3>
                    <p><strong>4.1 Subscription Fees:</strong> Access to premium features is subject to subscription fees. All fees are non-refundable except as required by law.</p>
                    <p><strong>4.2 Taxes:</strong> You are responsible for all applicable taxes, including GST (Goods and Services Tax) or other duties associated with your use of the Service.</p>
                    <p><strong>4.3 Invoicing:</strong> We use third-party payment processors. By using our financial/invoicing tools, you agree to comply with their terms and conditions.</p>

                    <br/>
                    <h3>5. Acceptable Use</h3>
                    <p>You agree not to use the Service to:</p>
                    <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
                        <li>Upload content that is illegal, harmful, threatening, abusive, harassing, defamatory, obscene, or invasive of another's privacy.</li>
                        <li>Violate any applicable local, state, national, or international law, including Indian laws.</li>
                        <li>Infringe upon the intellectual property rights of others.</li>
                        <li>Transmit any viruses, malware, or other malicious code.</li>
                    </ul>

                    <br/>
                    <h3>6. Service Availability, Storage and Termination</h3>
                    <p><strong>6.1 Availability:</strong> We strive to keep the Service available 24/7 but do not guarantee uninterrupted access.</p>
                    <p><strong>6.2 Storage Limits:</strong> Your account is subject to storage limits associated with your subscription plan. We reserve the right to delete content that exceeds these limits.</p>
                    <p><strong>6.3 Termination:</strong> We reserve the right to suspend or terminate your account at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.</p>

                    <br/>
                    <h3>7. Limitation of Liability</h3>
                    <p>To the maximum extent permitted by law, FotoFlow shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses. Our total liability shall not exceed the amount paid by you, if any, for accessing the Service during the 12 months immediately preceding the event.</p>

                    <br/>
                    <h3>8. Governing Law and Jurisdiction</h3>
                    <p>These Terms shall be governed by and construed in accordance with the laws of India. You agree to submit to the exclusive jurisdiction of the courts located in Cochin, Kerala (or your registered city) for the resolution of any disputes.</p>

                    <br/>
                    <h3>9. Contact Us</h3>
                    <p>If you have any questions about these Terms, please contact us at support@fotoflow.app.</p>
                </div>
            </div>
          </div>

          <div className="actions">
            <div className="button primary" onClick={onAgree}>
              I Agree
            </div>
          </div>

        </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}

export default TermsOfServiceModal;
