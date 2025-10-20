
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { openModal } from '../../../../app/slices/modalSlice';

const CreateStudioForm = ({ user, formData, studioName,updateFormData, onNext, errors, isDomainAvailable, isCheckingDomain, disabled, validateStudioForm, validateAllSetForm }) => {
    const [suggestSubDomains, setSuggestSubDomains] = useState(['-studio', '-photography', '-weddings']);
    const [isSuggestionsAvailable, setIsSuggestionsAvailable] = useState(false);
    const dispatch = useDispatch();

    console.log(studioName)
    console.log(isCheckingDomain)
    console.log(isDomainAvailable)
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

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateStudioForm() && validateAllSetForm()) {
            onNext();
        }
    };

    const url = window.location.href;
    let domain = url.split('/')[2];
    domain = domain.substring(domain.length - 10);

    return (
        <div className={`screen create-studio ${user?.email && 'active'} animate-reveal`}>

                
            <p className={`studio-name-label section-intro small  highlight 
                ${ formData.studioName.length > 0 ? ' selected-field ' : '  '}
                ${user?.email && formData.studioName.length <= 3 ? 'highlight' : ''}`}>
                {formData.studioName.length > 0 ? 'Studio name' : 'Let\'s start with Studio\'s name.'}
            </p>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <input
                        type="text"
                        id="studioName"
                        value={formData.studioName}
                        placeholder={studioName ? studioName : 'Lorem Tales'}
                        onChange={handleStudioNameChange}
                        autoComplete="off"
                        required
                        disabled={disabled}
                    />
                    {errors.studioName && <div className="error-container">{errors.studioName}</div>}

                    <div className={`studio-domain-selector ${isDomainAvailable ? 'available': isCheckingDomain ? 'checking'  : 'taken'} ${formData.studioDomain.length > 3 && 'active'}`}>
                        <div className="domain-input-container">
                            <div className="web-icon"></div>
                            <div className={`studio-domain `}>
                                <div className="url-prefix">..{domain}/</div>
                                <div>
                                    <input
                                        type="text"
                                        className={`sub-domain-input ${isDomainAvailable ? 'available' : 'taken'}`}
                                        value={formData.studioDomain}
                                        onChange={(e) => {
                                        // sanitize to lowercase and replace spaces with hyphens
                                        const v = e.target.value.toLowerCase().replace(/\s+/g, '-');
                                        updateFormData({ studioDomain: v });
                                        }}
                                        disabled={disabled}
                                        aria-label="Studio domain"
                                    />
                                    {!isSuggestionsAvailable && formData.studioDomain.length > 3 && (
                                        <span className={`suggestions ${isDomainAvailable && 'focus-out'}`}>
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
                <div className={`privacy-policy-statment ${isDomainAvailable && !errors.studioName ? 'active' : ''} ${formData.studioDomain.length > 3 ? 'active' : ''}`}>
                    <input type="checkbox" checked={formData.privacyPolicyAgreed} id="privacyPolicy" className={`${errors.privacyPolicyAgreed && 'privacyPolicy-error-input'}`} name="privacyPolicy" required onChange={() => updateFormData({ privacyPolicyAgreed: !formData.privacyPolicyAgreed })} disabled={disabled} />
                    <label>
                        I agree to the <span onClick={() => dispatch(openModal('privacyPolicy'))}>Terms of Service</span> and <span onClick={() => dispatch(openModal('privacyPolicy'))}>Privacy Policy</span>
                    </label>
                </div>
                {(errors.privacyPolicyAgreed ) && <div className={`error-container privacyPolicy-error ${formData.privacyPolicyAgreed  && 'hide-error'}`}>{errors.privacyPolicyAgreed}</div>}
                

                <div className={`button primary large create-studio-button ${disabled ? 'disabled' : ''} ${isDomainAvailable && !errors.studioName  ? 'active' : ''} `} onClick={handleSubmit}>
                    Create Studio
                </div>
            </form>
        </div>
    );
};

export default CreateStudioForm;