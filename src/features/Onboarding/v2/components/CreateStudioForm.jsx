import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { openModal } from '../../../../app/slices/modalSlice';
import { showLoading } from '../../../../app/slices/loadingSlice';

const CreateStudioForm = ({ user, formData, studioName, updateFormData, onNext, errors, isDomainAvailable, isCheckingDomain, disabled, validateStudioForm, validateAllSetForm }) => {
    const [suggestSubDomains, setSuggestSubDomains] = useState(['-studio', '-photography', '-weddings']);
    const [isSuggestionsAvailable, setIsSuggestionsAvailable] = useState(false);
    const dispatch = useDispatch();

    useEffect(() => {
        if(formData.studioDomain.length > 3){
            validateStudioForm()
        }
    }, [formData.studioName, formData.studioDomain]) // eslint-disable-line react-hooks/exhaustive-deps

    const handleStudioNameChange = (e) => {
        const name = e.target.value;
        updateFormData({ 
            studioName: name,
            studioDomain: name.toLowerCase().replace(/\s+/g, '-')
        });
    };

    const isStudioFormValid = formData.studioName.length > 3 && formData.studioDomain.length > 3 && isDomainAvailable;
    const isAllSetFormValid = formData.privacyPolicyAgreed;
    const isCreateDisabled = disabled || !isStudioFormValid || !isAllSetFormValid;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isCreateDisabled) return;
        if (validateStudioForm() && validateAllSetForm()) {
            dispatch(showLoading({context:'Creating your studio...', subcontext:''}));
            onNext();
        }
    };

    const url = window.location.href;
    let domain = url.split('/')[2];
    domain = domain.substring(domain.length - 10);

    // ==========================================
    // EFFICIENT CLASS MANAGEMENT (COMPUTED VALUES)
    // ==========================================
    const containerClass = `screen create-studio ${user?.email ? 'active' : ''} animate-reveal`;
    
    const labelClass = [
        "studio-name-label section-intro small highlight",
        formData.studioName.length > 0 ? "selected-field" : "",
        (user?.email && formData.studioName.length <= 3) ? "highlight" : ""
    ].filter(Boolean).join(" ");

    const domainSelectorClass = [
        "studio-domain-selector",
        isCheckingDomain ? "checking" : isDomainAvailable ? "available" : "taken",
        formData.studioDomain.length > 3 ? "active" : ""
    ].filter(Boolean).join(" ");

    // Change the existing privacyStatementClass definition to this:
const privacyStatementClass = [
    "privacy-policy-statment",
    ((isDomainAvailable && !errors.studioName) || formData.studioDomain.length > 3) ? "active" : "",
    (isDomainAvailable && formData.studioDomain.length > 3) ? "available-highlight" : ""
].filter(Boolean).join(" ");

    const submitBtnClass = `button primary large create-studio-button ${isCreateDisabled ? 'disabled' : 'active'}`;

    return (
        <div className={containerClass}>
            <p className={labelClass}>
                {formData.studioName.length > 0 ? 'Studio name' : 'Let\'s start with Studio\'s name.'}
            </p>
            
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <input
                        type="text"
                        id="studioName"
                        value={formData.studioName}
                        placeholder={studioName || 'Lorem Tales'}
                        onChange={handleStudioNameChange}
                        autoComplete="off"
                        required
                        disabled={disabled}
                    />
                    {errors.studioName && <div className="error-container">{errors.studioName}</div>}

                    <div className={domainSelectorClass}>
                        <div className="domain-input-container">
                            <div className="web-icon"></div>
                            <div className="studio-domain">
                                <div className="url-prefix">..{domain}/</div>
                                <div>
                                    <input
                                        type="text"
                                        className={`sub-domain-input ${isDomainAvailable ? 'available' : 'taken'}`}
                                        value={formData.studioDomain}
                                        onChange={(e) => {
                                            const v = e.target.value.toLowerCase().replace(/\s+/g, '-');
                                            updateFormData({ studioDomain: v });
                                        }}
                                        disabled={disabled}
                                        aria-label="Studio domain"
                                    />
                                    {!isSuggestionsAvailable && formData.studioDomain.length > 3 && (
                                        <span className={`suggestions ${isDomainAvailable ? 'focus-out' : ''}`}>
                                            {suggestSubDomains.map((subdomain, index) => (
                                                <span
                                                    key={index}
                                                    className="suggestion"
                                                    onClick={() => {
                                                        updateFormData({ studioDomain: formData.studioDomain + subdomain });
                                                        setIsSuggestionsAvailable(true);
                                                    }}
                                                >
                                                    {formData.studioDomain}{subdomain}
                                                </span>
                                            ))}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        {formData.studioDomain.length > 3 && (
                            isCheckingDomain ? (
                                <p className='input-reaction checking'>Checking availability...</p>
                            ) : isDomainAvailable ? (
                                <p className='input-reaction subdomain-available'>Available</p>
                            ) : errors.studioDomain ? (
                                <p className='input-reaction auto-checking'>{errors.studioDomain}</p>
                            ) : null
                        )}
                    </div>
                </div>

                <div className={privacyStatementClass}>
                  
                <input 
                    type="checkbox" 
                    checked={formData.privacyPolicyAgreed} 
                    id="privacyPolicy" 
                    className={`${errors.privacyPolicyAgreed ? 'privacyPolicy-error-input' : ''} ${isDomainAvailable && formData.studioDomain.length > 3 ? 'domain-success-highlight' : ''}`} 
                    name="privacyPolicy" 
                    required 
                    onChange={() => updateFormData({ privacyPolicyAgreed: !formData.privacyPolicyAgreed })} 
                    disabled={disabled} 
                />
                    <label>
                        I agree to the <span onClick={() => dispatch(openModal('privacyPolicy'))}>Privacy Policy</span> and <span onClick={() => dispatch(openModal('termsOfService'))}>Terms of Service</span>
                    </label>
                </div>
                {errors.privacyPolicyAgreed && (
                    <div className={`error-container privacyPolicy-error ${formData.privacyPolicyAgreed ? 'hide-error' : ''}`}>
                        {errors.privacyPolicyAgreed}
                    </div>
                )}
                
                <button 
                    type="submit" 
                    className={submitBtnClass} 
                    disabled={isCreateDisabled}
                >
                    Create Studio
                </button>
            </form>
        </div>
    );
};

export default CreateStudioForm;