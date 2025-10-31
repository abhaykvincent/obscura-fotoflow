import React from 'react';

const UserContactForm = ({ user, formData, updateFormData, onNext, onPrevious, handleGoogleSignIn, errors, disabled, validateContactForm }) => {

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
            <p className={`section-intro small  highlight  
                ${ formData.studioContact !== '' ? ' selected-field ' : '  '}
                ${user?.email && formData.studioContact == '' ? 'highlight' : ''}`}>
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
                    {errors.studioContact && <p className={`message error 
                        ${errors.studioContact.includes('Perfect') ? 'perfect' : 'low'}
                        `}>{errors.studioContact}</p>}
                </div>

                {!user?.email ? (
                    <div className={`button google-login-button ${disabled ? 'disabled' : ''}`} onClick={handleGoogleSignInAndProceed}>
                        Continue with Google <div className="google-logo"></div>
                    </div>
                ) : (
                    <div
                        className={`button primary ${disabled ? 'disabled' : ''}`}
                        onClick={handleSubmit}
                    >
                        Next
                    </div>
                )}
            </form>
        </div>
    );
};

export default UserContactForm;