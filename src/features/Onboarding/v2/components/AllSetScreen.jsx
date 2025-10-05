import React from 'react';
import { useDispatch } from 'react-redux';
import { openModal } from '../../../../app/slices/modalSlice';

const AllSetScreen = ({ onNext, onPrevious, formData, updateFormData, disabled, errors, validateAllSetForm }) => {
    const dispatch = useDispatch();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateAllSetForm()) {
            onNext();
        }
    };

    return (
        <div className={`screen all-set animate-reveal`}>
            <div className="screen-title">
                <div className="back-form" onClick={onPrevious}></div>
                <h2 className=''>You are all set!</h2>
            </div>
            <p className='section-intro'>Click "Open App" to complete your studio setup and start exploring FotoFlow.</p>
            
            <form onSubmit={handleSubmit}>
                <div className="privacy-policy-statment">
                    <input type="checkbox" checked={formData.privacyPolicyAgreed} id="privacyPolicy" name="privacyPolicy" required onChange={() => updateFormData({ privacyPolicyAgreed: !formData.privacyPolicyAgreed })} disabled={disabled} />
                    <label>
                        I agree to the <span onClick={() => dispatch(openModal('privacyPolicy'))}>Terms of Service</span> and <span onClick={() => dispatch(openModal('privacyPolicy'))}>Privacy Policy</span>
                    </label>
                </div>
                {errors.privacyPolicyAgreed && <p className={`message error low`}>{errors.privacyPolicyAgreed}</p>}

                <div
                    className={`button primary ${disabled ? 'disabled' : ''}`}
                    onClick={handleSubmit}
                >
                    Open App
                </div>
            </form>
        </div>
    );
};

export default AllSetScreen;