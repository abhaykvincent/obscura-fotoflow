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
                    <p style={{ fontSize: '0.9em', marginBottom: '20px' }}>Last Updated: December 15, 2025</p>

                    <h3>1. Introduction</h3>
                    <p>FotoFlow ("we," "us," or "our") respects your privacy and is committed to protecting it through our compliance with this policy. This Privacy Policy describes the types of information we may collect from you or that you may provide when you visit the FotoFlow application (our "Service") and our practices for collecting, using, maintaining, protecting, and disclosing that information.</p>
                    
                    <br/>
                    <h3>2. Information We Collect</h3>
                    <p>We collect several types of information from and about users of our Service, including:</p>
                    <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
                        <li><strong>Personal Information:</strong> Name, email address, and profile picture provided during account creation (including via Google/Apple Sign-In).</li>
                        <li><strong>User Content:</strong> Photos, images, and metadata (e.g., EXIF data) that you upload to the Service.</li>
                        <li><strong>Usage Data:</strong> Information about how you access and use the Service, such as your IP address, browser type, device information, and pages visited.</li>
                    </ul>

                    <br/>
                    <h3>3. How We Use Your Information</h3>
                    <p>We use information that we collect about you or that you provide to us, including any personal information:</p>
                    <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
                        <li>To provide and maintain our Service.</li>
                        <li>To allow you to participate in interactive features of our Service (e.g., sharing galleries).</li>
                        <li>To notify you about changes to our Service or any products or services we offer or provide through it.</li>
                        <li>To monitor the usage of the Service and detect, prevent, and address technical issues.</li>
                    </ul>

                    <br/>
                    <h3>4. Data Storage and Security</h3>
                    <p>We use industry-standard cloud providers (such as Google Cloud Platform and Firebase) to store and process your data. We implement appropriate technical and organizational measures to secure your personal information from accidental loss and from unauthorized access, use, alteration, and disclosure. However, the transmission of information via the internet is not completely secure, and we cannot guarantee the absolute security of your personal information transmitted to our Service.</p>

                    <br/>
                    <h3>5. Data Sharing and Disclosure</h3>
                    <p>We do not sell your personal information. We may disclose aggregated information about our users without restriction. We may disclose personal information that we collect or you provide as described in this privacy policy:</p>
                    <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
                        <li>To our subsidiaries and affiliates.</li>
                        <li>To contractors, service providers, and other third parties we use to support our business (e.g., analytics providers, payment processors).</li>
                        <li>To comply with any court order, law, or legal process, including to respond to any government or regulatory request.</li>
                    </ul>

                    <br/>
                    <h3>6. Your Data Rights</h3>
                    <p>Depending on your location, you may have rights to access, correct, delete, or restrict use of your personal information. You can access and update most of your personal data directly through your account settings. To request deletion of your account and data, please contact us.</p>

                    <br/>
                    <h3>7. Changes to Our Privacy Policy</h3>
                    <p>It is our policy to post any changes we make to our privacy policy on this page. If we make material changes to how we treat our users' personal information, we will notify you through the Service or by email.</p>

                    <br/>
                    <h3>8. Contact Information</h3>
                    <p>To ask questions or comment about this privacy policy and our privacy practices, contact us at: privacy@fotoflow.app</p>
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