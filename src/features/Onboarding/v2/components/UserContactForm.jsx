
import React from 'react';
import { useDispatch } from 'react-redux';
import { openModal } from '../../../../app/slices/modalSlice';

const UserContactForm = ({ user, formData, updateFormData, onNext, onPrevious, handleGoogleSignIn, errors, disabled, validateContactForm }) => {
    const dispatch = useDispatch();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateContactForm()) {
            onNext();
        }
    };

    const handleGoogleSignInAndProceed = async () => {
        if (validateContactForm()) {
            await handleGoogleSignIn();
        }
    };

    return (
        <div className={`screen user-contact animate-reveal`}>
            <div className="screen-title">
                <div className="back-form" onClick={onPrevious}></div>
                <h2 className=''>Contact Number</h2>
            </div>
            <p className='section-intro'></p>
            <p className={`section-intro small  highlight ${user?.email && formData.studioContact == '' ? 'highlight' : ''}`}>
                { formData.studioContact !== '' ? 'Buisness number' : 'What\'s your Buisness Number?'}
            </p>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <input
                        type="tel"
                        id="contactNumber"
                        value={formData.studioContact}
                        onChange={(e) => updateFormData({ studioContact: e.target.value })}
                        placeholder='0000 000000'
                        required
                        disabled={disabled}
                    />
                    {errors.studioContact && <p className={`message error low`}>{errors.studioContact}</p>}
                </div>

                <div className="privacy-policy-statment">
                    <input type="checkbox" checked={formData.privacyPolicyAgreed} id="privacyPolicy" name="privacyPolicy" required onChange={() => updateFormData({ privacyPolicyAgreed: !formData.privacyPolicyAgreed })} disabled={disabled} />
                    <label>
                        I agree to the <span onClick={() => dispatch(openModal('privacyPolicy'))}>Terms of Service</span> and <span onClick={() => dispatch(openModal('privacyPolicy'))}>Privacy Policy</span>
                    </label>
                </div>
                {errors.privacyPolicyAgreed && <p className={`message error low`}>{errors.privacyPolicyAgreed}</p>}
                {!user?.email ? (
                    <div className={`button google-login-button ${disabled ? 'disabled' : ''}`} onClick={handleGoogleSignInAndProceed}>
                        Continue with Google <div className="google-logo"></div>
                    </div>
                ) : (
                    <div
                        className={`button primary ${disabled ? 'disabled' : ''}`}
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
