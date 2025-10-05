
import { useState, useEffect, useRef } from 'react';
import { checkStudioDomainAvailability } from '../../../../firebase/functions/studios';
import { useDebounce } from '../../../../hooks/useDebounce';

export const useOnboardingForm = (defaultValues = {}) => {
    const [formData, setFormData] = useState({
        studioName: defaultValues.studioName || '',
        studioDomain: defaultValues.studioDomain || '',
        studioContact: defaultValues.studioContact || '',
        privacyPolicyAgreed: true,
    });

    const [errors, setErrors] = useState({});
    const [isDomainAvailable, setIsDomainAvailable] = useState(false);
    const debouncedStudioDomain = useDebounce(formData.studioDomain, 1000);

    useEffect(() => {
        if (debouncedStudioDomain.length > 3) {
            checkStudioDomainAvailability(debouncedStudioDomain)
                .then((isAvailable) => {
                    setIsDomainAvailable(isAvailable);
                    if (!isAvailable) {
                        setErrors(prev => ({ ...prev, studioDomain: 'Sub-domain already taken.' }));
                    } else {
                        setErrors(prev => ({ ...prev, studioDomain: null }));
                    }
                })
                .catch((error) => {
                    console.error(' Error checking domain availability:', error);
                });
        }
    }, [debouncedStudioDomain]);

    const updateFormData = (data) => {
        setFormData(prev => ({ ...prev, ...data }));
    };

    const validatePhoneNumber = (phoneNumber) => {
        const phoneRegex = /^\d{10}$/;
        if (!phoneNumber) {
            return 'Please enter your phone number';
        }
        if (!phoneRegex.test(phoneNumber)) {
            if (phoneNumber.length > 10) {
                return 'Oops! Looks like your phone number is a bit long';
            }
            if (phoneNumber.length < 5) {
                return 'Hmm, too short for a phone number';
            }
            if (phoneNumber.length < 10) {
                return 'Hmm, your phone number seems a bit short';
            }
        }
        return null;
    };

    const validateStudioForm = () => {
        const newErrors = {};
        if (formData.studioName.length <= 3) {
            newErrors.studioName = "Studio name must be longer than 3 characters.";
        }
        if (formData.studioDomain.length <= 3) {
            newErrors.studioDomain = "Sub-domain must be longer than 3 characters.";
        } else if (!isDomainAvailable) {
            newErrors.studioDomain = errors.studioDomain || 'Sub-domain already taken.';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateContactForm = () => {
        const newErrors = {};
        const phoneError = validatePhoneNumber(formData.studioContact);
        if (phoneError) {
            newErrors.studioContact = phoneError;
        }
        if (!formData.privacyPolicyAgreed) {
            newErrors.privacyPolicyAgreed = "You must agree to the terms and privacy policy.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    useEffect(() => {
        if (defaultValues.studioContact) {
            const timer = setTimeout(() => {
                setFormData(prev => ({ 
                    ...prev, 
                    studioContact: defaultValues.studioContact,
                }));
            }, 1200);
            return () => clearTimeout(timer);
        }
    }, [defaultValues.studioContact]);


// Inside your useOnboardingForm hook
const timerIdRef = useRef(null);

useEffect(() => {
    // Stop any previous animations when the default value changes
    if (timerIdRef.current) {
        clearTimeout(timerIdRef.current);
    }

    if (defaultValues.studioName) {
        setFormData(prev => ({
            ...prev,
            studioName: '',
            studioDomain: '',
        }));

        let currentLength = 0;
        const fullText = defaultValues.studioName;

        const typeChunk = () => {
    // Change is on this next line
    currentLength += Math.floor(Math.random() * 4) + 1; // Randomly adds 1, 2, 3, or 4
    
    // Ensure we don't go past the end of the string
    const displayText = fullText.slice(0, Math.min(currentLength, fullText.length));
    
    setFormData(prev => ({
        ...prev,
        studioName: displayText,
        studioDomain: displayText.toLowerCase().replace(/\s+/g, '-')
    }));

    if (currentLength < fullText.length) {
        timerIdRef.current = setTimeout(typeChunk, 220);
    }
};

        // Schedule the FIRST chunk after the long 1000ms delay
        timerIdRef.current = setTimeout(typeChunk, 1600);
    }

    // Cleanup function to clear the scheduled timeout
    return () => clearTimeout(timerIdRef.current);
}, [defaultValues.studioName]);
    return { formData, updateFormData, errors, isDomainAvailable, validateStudioForm, validateContactForm };
};
