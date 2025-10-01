
import { useState, useEffect } from 'react';
import { onboardingService } from '../../../../services/onboardingService';
import { trackEvent } from '../../../../analytics/utils';

export const useInvitation = (invitationCode) => {
    const [invitation, setInvitation] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!invitationCode) {
            setIsLoading(false);
            return;
        }

        const validate = async () => {
            try {
                setIsLoading(true);
                const response = await onboardingService.validateInvitation(invitationCode);
                setInvitation(response);
                if (response) {
                    trackEvent('referral_code_validated', {
                        referral_code: invitationCode,
                        isReferralValid: true,
                    });
                } else {
                    trackEvent('onboarding_referral', {
                        referral_code: invitationCode,
                        isReferralValid: false,
                    });
                }
            } catch (err) {
                setError(err);
                trackEvent('onboarding_referral', {
                    referral_code: invitationCode,
                    isReferralValid: false,
                });
            } finally {
                setIsLoading(false);
            }
        };

        validate();
    }, [invitationCode]);

    return { invitation, isLoading, error };
};
