
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { onboardingService } from '../../../../services/onboardingService';
import { showAlert } from '../../../../app/slices/alertSlice';
import { login } from '../../../../app/slices/authSlice';
import { createNotification } from '../../../../app/slices/notificationSlice';
import { trackEvent } from '../../../../analytics/utils';

export const completeOnboarding = createAsyncThunk(
    'onboarding/complete',
    async ({ userData, studioData, invitationCode, navigate }, { dispatch }) => {
        try {
            const { studio } = await onboardingService.createAccountAndStudio(userData, studioData, invitationCode);
            
            trackEvent('studio_created',{
                studio_name: studio.name,
                studio_domain: studio.domain
            });

            dispatch(
                createNotification({
                    studioId: studio.domain,
                    notificationData: {
                        title: studio.name,
                        message: `Studio Created`,
                        type: 'project',
                        actionLink: '/projects',
                        priority: 'normal',
                        isRead: false,
                        metadata: {
                            createdAt: new Date().toISOString(),
                            eventType: 'studio_created',
                            createdBy: 'system',
                        },
                    },
                })
            );

            dispatch(showAlert({ type: 'success', message: `New Studio created!` }));
            dispatch(login(userData));
            navigate(`/${studio.domain}`);
            trackEvent('redirected_to_studio_home');

            return studio;
        } catch (error) {
            console.error('Error creating Studio:', error);
            dispatch(showAlert({ type: 'error', message: `Error creating studio. Please try again.` }));
            throw error;
        }
    }
);

const onboardingSlice = createSlice({
    name: 'onboarding',
    initialState: {
        status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(completeOnboarding.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(completeOnboarding.fulfilled, (state) => {
                state.status = 'succeeded';
            })
            .addCase(completeOnboarding.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message;
            });
    },
});

export default onboardingSlice.reducer;
