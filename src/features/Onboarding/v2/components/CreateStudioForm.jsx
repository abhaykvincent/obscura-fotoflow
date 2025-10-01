
import React, { useState } from 'react';

const CreateStudioForm = ({ user, formData, updateFormData, onNext, errors, isDomainAvailable,disabled, validateStudioForm }) => {
    const [suggestSubDomains, setSuggestSubDomains] = useState(['-studio', '-photography', '-weddings', '-media']);
    const [isSuggestionsAvailable, setIsSuggestionsAvailable] = useState(false);

    const handleStudioNameChange = (e) => {
        const name = e.target.value;
        updateFormData({ 
            studioName: name,
            studioDomain: name.toLowerCase().replace(/\s+/g, '-')
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateStudioForm()) {
            onNext();
        }
    };

    const url = window.location.href;
    let domain = url.split('/')[2];
    domain = domain.substring(domain.length - 10);

    return (
        <div className={`screen create-studio ${user?.email && 'active'}`}>
            <p className={`section-intro small  highlight ${user?.email && formData.studioName.length <= 3 ? 'highlight' : ''}`}>
                {formData.studioName.length > 3 ? 'Studio name' : 'Let\'s start with Studio\'s name.'}
            </p>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <input
                        type="text"
                        id="studioName"
                        value={formData.studioName}
                        placeholder={formData.studioName || 'Lorem Tales'}
                        onChange={handleStudioNameChange}
                        autoComplete="off"
                        required
                        disabled={disabled}
                    />
                    {errors.studioName && <div className="error-container">{errors.studioName}</div>}

                    <div className={`studio-domain-selector ${isDomainAvailable ? 'available' : 'taken'} ${formData.studioDomain.length > 3 && 'active'}`}>
                        <div className="domain-input-container">
                            <div className="web-icon"></div>
                            <div className={`studio-domain `}>
                                <div className="url-prefix">..{domain}/</div>
                                <div>
                                    <span className={`sub-domain-input ${isDomainAvailable ? `available` : `taken`}`} contentEditable suppressContentEditableWarning={true}>
                                        {formData.studioDomain}
                                    </span>
                                    {!isSuggestionsAvailable && formData.studioDomain.length > 3 && (
                                        <span className={`suggestions ${isDomainAvailable && 'focus-out'}`}>
                                            {suggestSubDomains.map((subdomain, index) => (
                                                <span key={index} className='suggestion' onClick={() => {
                                                    updateFormData({ studioDomain: formData.studioDomain + subdomain });
                                                    setIsSuggestionsAvailable(true);
                                                }}>
                                                    {formData.studioDomain}{subdomain}
                                                </span>
                                            ))}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        {formData.studioDomain.length > 3 && (
                            isDomainAvailable ? (
                                <p className='input-reaction subdomain-available'>Available</p>
                            ) : (
                                <p className='input-reaction'>{errors.studioDomain || 'Sub-domain already taken.'}</p>
                            )
                        )}
                    </div>
                </div>
                <div className={`button primary large ${disabled ? 'disabled' : ''}`} onClick={handleSubmit}>
                    Create Studio
                </div>
            </form>
        </div>
    );
};

export default CreateStudioForm;
