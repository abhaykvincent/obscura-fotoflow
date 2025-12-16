import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeModalWithAnimation, selectModal, openModal } from '../../app/slices/modalSlice';
import { useModalFocus } from '../../hooks/modalInputFocus';

function PrivacyPolicyModal() {
  const dispatch = useDispatch();
  const visible = useSelector(selectModal);
  const [hasReadBottom, setHasReadBottom] = useState(false);
  const contentRef = useRef(null);
  
  const onClose = () => dispatch(closeModalWithAnimation('privacyPolicy'));
  const onNext = () => {
    if (!hasReadBottom) return;
    dispatch(closeModalWithAnimation('privacyPolicy')).then(() => {
       dispatch(openModal('termsOfService'));
    });
  };

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    // Check if scrolled to bottom with a small buffer
    if (scrollHeight - scrollTop <= clientHeight + 20) {
      setHasReadBottom(true);
    }
  };

  const scrollToBottom = () => {
    if (contentRef.current) {
      contentRef.current.scrollTo({
        top: contentRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };
  
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
            <div className="form-section" style={{ position: 'relative' }}>
                <div 
                    ref={contentRef}
                    onScroll={handleScroll}
                    style={{
                        padding: '0 5px', 
                        lineHeight: '1.6', 
                        color: 'var(--secondary-text-color)',
                        maxHeight: '60vh',
                        overflowY: 'auto'
                    }}
                >
                    <p style={{ fontSize: '0.9em', marginBottom: '20px' }}>Last Updated: December 15, 2025</p>

                    <h3>1. Introduction</h3>
                    <p>FotoFlow ("we," "us," or "our") respects your privacy and is committed to protecting it. This Privacy Policy outlines how we collect, use, and protect your information when you use our B2B SaaS application for event photographers. We adhere to applicable Indian laws, including the Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023 (as applicable).</p>
                    
                    <br/>
                    <h3>2. Information We Collect</h3>
                    <p>We collect several types of information:</p>
                    <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
                        <li><strong>Account Information:</strong> Name, email address, phone number, and business details provided during registration.</li>
                        <li><strong>User Content:</strong> Photos, videos, and metadata uploaded to the platform.</li>
                        <li><strong>Client Data (CRM):</strong> Information you enter about your clients (end-users) for project management and invoicing (e.g., Names, Event Dates, Contact Info). You are the Data Fiduciary for this data.</li>
                        <li><strong>Financial Information:</strong> Bank account details, UPI IDs, or GST numbers you provide for invoicing or subscription payments.</li>
                        <li><strong>Usage Data:</strong> IP address, browser type, device info, and interaction logs.</li>
                    </ul>

                    <br/>
                    <h3>3. How We Use Your Information</h3>
                    <p>We use the collected data to:</p>
                    <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
                        <li>Provide, operate, and maintain the FotoFlow platform (Storage, Gallery, Website).</li>
                        <li>Process transactions and manage your subscription.</li>
                        <li>Enable CRM features (generating invoices, managing client timelines).</li>
                        <li>Send service updates, security alerts, and administrative messages.</li>
                    </ul>

                    <br/>
                    <h3>4. Data Storage and Security</h3>
                    <p>Your data is stored on secure cloud servers. We use industry-standard providers (such as Google Cloud Platform and Firebase). While we implement robust security measures, no method of transmission over the internet is 100% secure.</p>

                    <br/>
                    <h3>5. Sharing and Disclosure</h3>
                    <p>We do not sell your personal data. We may share information with:</p>
                    <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
                        <li><strong>Service Providers:</strong> Third-party vendors who help us operate (e.g., Payment Gateways like Razorpay/Stripe, Cloud Storage).</li>
                        <li><strong>Legal Compliance:</strong> To comply with Indian laws, court orders, or government requests.</li>
                    </ul>

                    <br/>
                    <h3>6. Your Rights & Grievance Redressal</h3>
                    <p>As a user in India, you have rights to access, correct, or erase your personal data. You may also withdraw consent for future processing.</p>
                    <p><strong>Grievance Officer:</strong> In accordance with the IT Act, 2000, if you have any complaints or concerns regarding your data, please contact our Grievance Officer:</p>
                    <p style={{ marginLeft: '20px', borderLeft: '3px solid #ddd', paddingLeft: '10px' }}>
                        Name: [Insert Name]<br/>
                        Email: grievance@fotoflow.app<br/>
                        Address: [Insert Registered Office Address]
                    </p>

                    <br/>
                    <h3>7. Changes to Policy</h3>
                    <p>We may update this policy to reflect changes in our practices or laws. We will notify you of significant changes.</p>

                    <br/>
                    <h3>8. Contact Us</h3>
                    <p>For general privacy inquiries, contact us at: privacy@fotoflow.app</p>
                </div>
                {!hasReadBottom && (
                  <div 
                    onClick={scrollToBottom}
                    style={{
                      position: 'absolute',
                      bottom: '10px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      cursor: 'pointer',
                      background: 'rgba(0, 0, 0, 0.6)',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 10,
                      backdropFilter: 'blur(4px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}
                    title="Scroll to bottom"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7 10L12 15L17 10" stroke="#54a134" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
            </div>
          </div>

          <div className="actions">
            <div className={`button primary ${!hasReadBottom ? 'disabled' : ''}`} onClick={onNext}>
              Next
            </div>
          </div>

        </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}

export default PrivacyPolicyModal;
