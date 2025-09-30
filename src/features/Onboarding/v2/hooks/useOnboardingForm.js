
import { useState, useEffect } from 'react';
import { checkStudioDomainAvailability } from '../../../../firebase/functions/studios';
import { useDebounce } from '../../../../hooks/useDebounce';

export const useOnboardingForm = () => {
    const [formData, setFormData] = useState({
        studioName: '',
        studioDomain: '',
        studioContact: '',
        privacyPolicyAgreed: true,
    });

    const [errors, setErrors] = useState({});
    const [isDomainAvailable, setIsDomainAvailable] = useState(false);
    const debouncedStudioDomain = useDebounce(formData.studioDomain, 500);

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
            if (phoneNumber.length < 10) {
                return 'Hmm, your phone number seems a bit short';
            }
        }
        return null;
    };

    useEffect(() => {
        const errorMessage = validatePhoneNumber(formData.studioContact);
        setErrors(prev => ({ ...prev, studioContact: errorMessage }));
    }, [formData.studioContact]);

    return { formData, updateFormData, errors, isDomainAvailable };
};
