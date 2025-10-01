
import React from 'react';
import { useDispatch } from 'react-redux';
import { openModal } from '../../../../app/slices/modalSlice';

const UserContactForm = ({ user, formData, updateFormData, onNext, onPrevious, handleGoogleSignIn, errors }) => {
    const dispatch = useDispatch();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!errors.studioContact && formData.privacyPolicyAgreed) {
            onNext();
        }
    };

    const handleGoogleSignInAndProceed = async () => {
        if (!errors.studioContact && formData.privacyPolicyAgreed) {
            await handleGoogleSignIn();
        }
    };

    return (
        <div className={`screen user-contact`}>
            <div className="screen-title">
                <div className="back-form" onClick={onPrevious}></div>
                <h2 className=''>Contact Number</h2>
            </div>
            <p className='section-intro'>What's your Buisness Number?</p>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <input
                        type="tel"
                        id="contactNumber"
                        value={formData.studioContact}
                        onChange={(e) => updateFormData({ studioContact: e.target.value })}
                        placeholder='0000 000000'
                        required
                    />
                    {errors.studioContact && <p className={`message error low`}>{errors.studioContact}</p>}
                </div>

                <div className="privacy-policy-statment">
                    <input type="checkbox" checked={formData.privacyPolicyAgreed} id="privacyPolicy" name="privacyPolicy" required onChange={() => updateFormData({ privacyPolicyAgreed: !formData.privacyPolicyAgreed })} />
                    <label>
                        I agree to the <span onClick={() => dispatch(openModal('privacyPolicy'))}>Terms of Service</span> and <span onClick={() => dispatch(openModal('privacyPolicy'))}>Privacy Policy</span>
                    </label>
                </div>
                {!user?.email ? (
                    <div className={`button google-login-button ${errors.studioContact || !formData.privacyPolicyAgreed ? 'disabled' : ''}`} onClick={handleGoogleSignInAndProceed}>
                        Continue with Google <div className="google-logo"></div>
                    </div>
                ) : (
                    <div
                        className={`button primary ${errors.studioContact || !formData.privacyPolicyAgreed ? 'disabled' : ''}`}
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
