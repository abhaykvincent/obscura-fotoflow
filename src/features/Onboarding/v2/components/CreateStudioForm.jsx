
import React, { useState, useEffect } from 'react';
import { checkStudioDomainAvailability } from '../../../../firebase/functions/studios';

const CreateStudioForm = ({ user, formData, updateFormData, onNext, errors }) => {
    const [studioName, setStudioName] = useState(formData.studioName);
    const [studioDomain, setStudioDomain] = useState(formData.studioDomain);
    const [isDomainAvailable, setIsDomainAvailable] = useState(false);
    const [suggestSubDomains, setSuggestSubDomains] = useState(['-studio', '-photography', '-weddings', '-media']);
    const [isSuggestionsAvailable, setIsSuggestionsAvailable] = useState(false);

    useEffect(() => {
        const handler = setTimeout(() => {
            if (studioName.length > 3) {
                setIsSuggestionsAvailable(false);
            }
        }, 2000);
        updateFormData({ studioName: studioName });

        return () => {
            clearTimeout(handler);
        };
    }, [studioName]);

    useEffect(() => {
        if (studioDomain.length > 3) {
            checkStudioDomainAvailability(studioDomain)
                .then((isAvailable) => {
                    setIsDomainAvailable(isAvailable);
                    updateFormData({ studioDomain: studioDomain });
                })
                .catch((error) => {
                    console.error(' Error checking domain availability:', error);
                });
        }
    }, [studioDomain]);

    const handleStudioNameChange = (e) => {
        const name = e.target.value;
        setStudioName(name);
        setStudioDomain(name.toLowerCase().replace(/\s+/g, '-'));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isDomainAvailable) {
            onNext();
        }
    };

    const url = window.location.href;
    let domain = url.split('/')[2];
    domain = domain.substring(domain.length - 10);

    return (
        <div className={`screen create-studio ${user?.email && 'active'}`}>
            <p className={`section-intro small  highlight ${user?.email && studioName.length <= 3 ? 'highlight' : ''}`}>
                {studioName.length > 3 ? 'Studio name' : 'Let\'s start with Studio\'s name.'}
            </p>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <input
                        type="text"
                        id="studioName"
                        value={studioName}
                        placeholder='Lorem Tales'
                        onChange={handleStudioNameChange}
                        autoComplete="off"
                        required
                    />
                    {errors.studioName && <div className="error-container">{errors.studioName}</div>}

                    <div className={`studio-domain-selector ${isDomainAvailable ? 'available' : 'taken'} ${studioDomain.length > 3 && 'active'}`}>
                        <div className="domain-input-container">
                            <div className="web-icon"></div>
                            <div className={`studio-domain `}>
                                <div className="url-prefix">..{domain}/</div>
                                <div>
                                    <span className={`sub-domain-input ${isDomainAvailable ? `available` : `taken`}`} contentEditable suppressContentEditableWarning={true}>
                                        {studioDomain}
                                    </span>
                                    {!isSuggestionsAvailable && studioDomain.length > 3 && (
                                        <span className={`suggestions ${isDomainAvailable && 'focus-out'}`}>
                                            {suggestSubDomains.map((subdomain, index) => (
                                                <span key={index} className='suggestion' onClick={() => {
                                                    setStudioDomain(studioDomain + subdomain);
                                                    setIsSuggestionsAvailable(true);
                                                }}>
                                                    {studioDomain}{subdomain}
                                                </span>
                                            ))}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        {studioDomain.length > 3 && (
                            isDomainAvailable ? (
                                <p className='input-reaction subdomain-available'>Available</p>
                            ) : (
                                <p className='input-reaction'>Sub-domain already taken.</p>
                            )
                        )}
                    </div>
                </div>
                <div className={`button primary large ${!isDomainAvailable ? 'disabled' : ''}`} onClick={handleSubmit}>
                    Create Studio
                </div>
            </form>
        </div>
    );
};

export default CreateStudioForm;
