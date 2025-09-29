
import { useState } from 'react';

export const useOnboardingForm = () => {
    const [formData, setFormData] = useState({
        studioName: '',
        studioDomain: '',
        professionType: '',
        professionDomain: '',
        clientsPerMonth: '',
        projectSize: '',
        studioContact: ''
    });

    const updateFormData = (data) => {
        setFormData(prev => ({ ...prev, ...data }));
    };

    return { formData, updateFormData };
};
