
import { 
    acceptInvitationCode,
    createUser,
    validateInvitationCodeFromFirestore 
} from '../firebase/functions/firestore.js';
import { createStudio } from '../firebase/functions/studios.js';

export const onboardingService = {
    validateInvitation: async (invitationCode) => {
        return await validateInvitationCodeFromFirestore(invitationCode);
    },

    createAccountAndStudio: async (userData, studioData, invitationCode) => {
        const userResponse = await createUser({
            email: userData.email,
            displayName: userData.displayName,
            photoURL: userData.photoURL,
            studio: {
                name: studioData.studioName,
                domain: studioData.studioDomain,
                roles: ['Admin'],
            },
        });

        const studioResponse = await createStudio(userResponse.studio);
        
        if (invitationCode) {
            await acceptInvitationCode(invitationCode);
        }

        return {
            user: userResponse,
            studio: studioResponse,
        };
    }
};
