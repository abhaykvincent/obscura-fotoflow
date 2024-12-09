import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeModal, closeModalWithAnimation, selectModal } from '../../app/slices/modalSlice';
import { useModalFocus } from '../../hooks/modalInputFocus';

function PrivacyPolicy({agreePolicy}) {
  const dispatch = useDispatch()
  const visible = useSelector(selectModal)
  const onClose = () => dispatch(closeModalWithAnimation('privacyPolicy'))

const modalRef = useModalFocus(visible.shareGallery);
  if (!visible.privacyPolicy) {
    return null;
  }
  else{
  }

  return (
    <div className=" modal-container " ref={modalRef}>
      <div className="modal privacy-policy-modal island">
        <div className='modal-header'>
          <div className="modal-controls">
            <div className="control close" onClick={onClose}></div>
            <div className="control minimize"></div>
            <div className="control maximize"></div>
          </div>
          <div className="modal-title">Privacy and Policy Agreement</div>
        </div>
        <div className='modal-body'>
            <div className="logo"></div>
        <div className="privacy-policy">

        <section>
            <h2>1. Introduction</h2>
            <p>
            Welcome to <strong>Fotoflow</strong>! By using our platform, you
            agree to the terms outlined in this Privacy and Policy Agreement. Please
            read this document carefully before signing up.
            </p>
        </section>

        <section>
            <h2>2. Consent and Account Registration</h2>
            <ul>
            <li>
                By clicking <strong>"Accept"</strong> during sign-up, users consent to
                this Privacy and Policy Agreement.
            </li>
            <li>
                Users are required to consent again whenever significant updates are
                made to the policy.
            </li>
            <li>
                Each account is for <strong>one photographer/studio only</strong>.
                Sharing accounts across multiple studios is prohibited. Each studio
                must create a separate account (a free account option is available).
            </li>
            </ul>
        </section>

        <section>
            <h2>3. Data Collection</h2>
            <p>We collect and process the following types of data:</p>
            <ul>
            <li>
                <strong>Personal Information:</strong> Name, email, phone number,
                billing information (credit card, address).
            </li>
            <li>
                <strong>Project Data:</strong> Uploaded images, project details, and
                image selections.
            </li>
            </ul>
        </section>

        <section>
            <h2>4. Data Usage</h2>
            <p>The collected data is used for:</p>
            <ul>
            <li>
                <strong>Improving user experience:</strong> Workflow assistance,
                project management, and image selection tools.
            </li>
            <li>
                <strong>Analytics and personalization:</strong> Optimizing features
                based on user behavior (via Google Analytics).
            </li>
            <li>
                <strong>Communication:</strong> Monthly updates about product
                improvements and offers (no third-party marketing tools used).
            </li>
            </ul>
        </section>

        <section>
            <h2>5. Data Sharing</h2>
            <p>We may share your data with:</p>
            <ul>
            <li>
                <strong>Payment Providers:</strong> Razorpay for secure transactions.
            </li>
            <li>
                <strong>Cloud Services:</strong> Firebase and Google Cloud for data
                storage and workflow assistance.
            </li>
            <li>
                <strong>AI Personalization:</strong> Our AI services (e.g., workflow
                suggestions) do not use or analyze any images uploaded by
                photographers.
            </li>
            </ul>
        </section>

        <section>
            <h2>6. Data Storage and Retention</h2>
            <ul>
            <li>
                <strong>Storage Location:</strong> Your data is securely stored on
                Firebase and Google Cloud servers in the United States, with plans to
                migrate to Indian servers in the future.
            </li>
            <li>
                <strong>Retention Policy:</strong>
                <ul>
                <li>
                    Projects will be archived 3 months after creation and accessible
                    only to the photographer.
                </li>
                <li>
                    Photos become unavailable to clients, photographers, and guests
                    365 days after the first upload unless moved to hot storage during
                    the 30-day buffer period.
                </li>
                <li>
                    Archived projects can be moved to hot storage but must remain
                    there for at least 3 months.
                </li>
                <li>Photographers can delete projects at any time.</li>
                </ul>
            </li>
            </ul>
        </section>

        <section>
            <h2>7. Security Measures</h2>
            <p>
            We prioritize your data security through regular monitoring of the
            platform and implementation of advanced encryption methods in future
            updates.
            </p>
        </section>

        <section>
            <h2>8. User Rights</h2>
            <p>You have the right to:</p>
            <ul>
            <li>Access, correct, or delete your data at any time.</li>
            <li>Opt-out of marketing emails by updating your preferences.</li>
            </ul>
        </section>

        <section>
            <h2>9. Guest and Client Access</h2>
            <ul>
            <li>
                Guests with links shared by photographers can view galleries for up
                to 7 days after the upload.
            </li>
            <li>
                Clients can securely select images for final albums using a
                password-protected link for 7 days after upload.
            </li>
            </ul>
        </section>

        <section>
            <h2>10. Data Breach Response</h2>
            <ul>
            <li>
                In the event of a data breach, we will notify affected users via
                email within a reasonable timeframe.
            </li>
            <li>For widespread breaches, a public notification will also be issued.</li>
            </ul>
        </section>

        <section>
            <h2>11. Legal Compliance</h2>
            <p>We comply with the <strong>Indian IT Act</strong> and other relevant data protection laws.</p>
        </section>

        <section>
            <h2>12. Dispute Resolution</h2>
            <p>
            For complaints or disputes, email us at{" "}
            <a href="mailto:abhaykvincent@gmail.com">abhaykvincent@gmail.com</a>. All
            legal matters will be subject to the jurisdiction of Indian courts.
            </p>
        </section>

        <section>
            <h2>13. Fair Use Policy</h2>
            <ul>
            <li>One account is intended for use by a single studio or photographer.</li>
            <li>
                Multiple studios cannot share one account. Separate accounts must be
                created for each studio.
            </li>
            </ul>
        </section>

        <section>
            <h2>14. Updates to this Policy</h2>
            <p>
            We may update this Privacy and Policy Agreement periodically. Users
            will be notified of any changes and required to provide consent again
            to continue using the service.
            </p>
        </section>
        </div>

        </div>
        <div className="actions">
          <div className="button secondary" onClick={onClose}>Do not Accept</div>
          <div className="button primary " /* Photos */
          onClick={()=>{
            onClose();
            agreePolicy();
          }}
          >Accept</div>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}

export default PrivacyPolicy