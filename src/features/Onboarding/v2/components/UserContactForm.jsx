
import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { openModal } from '../../../../app/slices/modalSlice';

const UserContactForm = ({ user, formData, updateFormData, onNext, onPrevious, handleGoogleSignIn }) => {
    const dispatch = useDispatch();
    const [contactNumber, setContactNumber] = useState(formData.studioContact || '');
    const [inputMessage, setInputMessage] = useState({});
    const [privacyPolicyAgreed, setPrivacyPolicyAgreed] = useState(true);

    useEffect(() => {
        const phoneRegex = /^\d{10}$/;
        if (!contactNumber) {
            setInputMessage({});
            return;
        }
        if (!phoneRegex.test(contactNumber)) {
            if (contactNumber.length > 10) {
                setInputMessage({ message: 'Oops! Looks like your phone number is a bit long', type: 'error', value: 'medium' });
            } else if (contactNumber.length < 10) {
                setInputMessage({ message: 'Hmm, your phone number seems a bit short', type: 'error', value: 'low' });
            }
        } else {
            setInputMessage({ message: 'Perfect!', type: 'success', value: 'medium' });
        }
        updateFormData({ studioContact: contactNumber });
    }, [contactNumber]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!contactNumber) {
            setInputMessage({ message: 'Please enter your phone number', type: 'error', value: 'low' });
            return;
        }
        if (inputMessage.type === 'success' && privacyPolicyAgreed) {
            onNext();
        }
    };

    useEffect(() => {
        if (user?.email && inputMessage.type === 'success' && privacyPolicyAgreed) {
            onNext();
        }
    }, [user?.email, inputMessage.type, privacyPolicyAgreed]);

    const handleGoogleSignInAndProceed = async () => {
        await handleGoogleSignIn();
    };

    return (
        <div className={`screen user-contact`}>
            <div className="screen-title">
                <div className="back-form" onClick={onPrevious}></div>
                <h2 className=''>Contact Number</h2>
            </div>
            <p className='section-intro'>What's your WhatsApp Number?</p>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <input
                        type="tel"
                        id="contactNumber"
                        value={contactNumber}
                        onChange={(e) => setContactNumber(e.target.value)}
                        placeholder='0000 000000'
                        required
                    />
                    {inputMessage.message && <p className={`message ${inputMessage.type} ${inputMessage.value}`}>{inputMessage.message}</p>}
                </div>

                <div className="privacy-policy-statment">
                    <input type="checkbox" checked={privacyPolicyAgreed} id="privacyPolicy" name="privacyPolicy" required onChange={() => setPrivacyPolicyAgreed(!privacyPolicyAgreed)} />
                    <label>
                        I agree to the <span onClick={() => dispatch(openModal('privacyPolicy'))}>Terms of Service</span> and <span onClick={() => dispatch(openModal('privacyPolicy'))}>Privacy Policy</span>
                    </label>
                </div>
                {!user?.email ? (
                    <div className={`button google-login-button large ${inputMessage.type !== 'success' || !privacyPolicyAgreed ? 'disabled' : ''}`} onClick={handleGoogleSignInAndProceed}>
                        Google <div className="google-logo"></div>
                    </div>
                ) : (
                    <div
                        className={`button primary large ${inputMessage.type !== 'success' || !privacyPolicyAgreed ? 'disabled' : ''}`}
                        onClick={handleSubmit}
                    >
                        Open App
                    </div>
                )}
            </form>
        </div>
    );
};

export default UserContactForm;
