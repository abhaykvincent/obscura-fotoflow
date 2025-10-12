import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { signInWithPopup } from 'firebase/auth';
import { analytics, auth, provider } from '../../../firebase/app';
import { selectUser, setUser, logout } from '../../../app/slices/authSlice';
import { showAlert } from '../../../app/slices/alertSlice';
import { isDeveloper, trackEvent } from '../../../analytics/utils';
import { usePersonalizedGreeting } from './hooks/usePersonalizedGreeting';
import { useInvitation } from './hooks/useInvitation';
import { useOnboardingForm } from './hooks/useOnboardingForm';
import { completeOnboarding } from './slices/onboardingSlice';
import CreateStudioForm from './components/CreateStudioForm';
import '../Onboarding.scss';
import { generateReferral } from '../../../app/slices/referralsSlice';

function Onboarding() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [searchParams] = useSearchParams();
    const ref = searchParams.get('ref') || '0000';
    console.log('Referral Code:', ref);
    const user = useSelector(selectUser);
    const { status: onboardingStatus } = useSelector(state => state.onboarding);
    const greeting = usePersonalizedGreeting();
    const { invitation, isLoading: isInvitationLoading } = useInvitation(ref);
    console.log('Invitation Data:', invitation);
    const { formData, updateFormData, errors, isDomainAvailable, isCheckingDomain, validateStudioForm, validateContactForm, validateAllSetForm } = useOnboardingForm({ studioName: invitation?.studioName, studioContact: invitation?.studioContact }, user);

    useEffect(() => {
        const studioLocal = JSON.parse(localStorage.getItem('studio'));
        if (studioLocal) {
            navigate(`/${studioLocal?.domain}`);
        }
    }, [navigate]);

    useEffect(() => {
        trackEvent('onboarding_viewed', { referral_code: ref });
    }, [ref]);



    useEffect(() => {
        if(isDeveloper) {
            dispatch(generateReferral({
            name: "Abhay",
            studioName:"Monalisa",
            campainName: "Admin",
            campainPlatform: "whatsapp",
            type: "referral",
            email: "",
            studioContact: "",
            code: ['2744'],
            status: "active",
            quota: 3,
            used: 0,
            validity: 30,
            createdAt: new Date().toISOString(),
            }))

        }
    },[])

    const handleGoogleSignIn = async () => {
        try {
            const result = await signInWithPopup(auth, provider);
            const loginUser = result.user;
            trackEvent('google_auth_completed', { email: loginUser.email });

            const serializedUser = {
                userId: loginUser.email,
                email: loginUser.email,
                displayName: loginUser.displayName,
                photoURL: loginUser.photoURL,
                access: '',
                studio: [],
            };
            dispatch(setUser(serializedUser));
            analytics.setUserId(loginUser.email);
        } catch (error) {
            trackEvent('google_auth_failed');
            console.error(error);
        }
    };

    const handleCreateAccount = () => {
        if (!invitation) {
            dispatch(showAlert({ type: 'error', message: 'A valid referral code is required to create an account.' }));
            trackEvent('onboarding_attempt_invalid_referral', { referral_code: ref });
            return;
        }
        dispatch(completeOnboarding({ 
            userData: user, 
            studioData: formData, 
            invitationCode: ref, 
            navigate 
        }));
    };

    if (isInvitationLoading) {
        return <div>Loading...</div>; // Or a proper loading spinner
    }

    const isDisabled = !invitation;

    return (
        <main className="onboarding-container">
            <div className="logo animate-reveal" style={{ animationDelay: '0.2s' }}></div>
            <div className={`user-authentication animate-reveal ${!user?.email ? 'auth-screen' : ''}`} style={{ animationDelay: '0.4s' }}>
                {invitation?.name && !user?.email && (
                    <>
                        <p className='onboarding-greeting'>
                            <span className={`timeGreeting icon ${greeting.timeOfDay}`}>{greeting.timeGreeting}</span>
                            <span className='iconic-gradient-white'>{invitation.name}</span>
                        </p>
                        <p className='onboarding-message'>{greeting.personalizedMessage}</p>
                    </>
                )}

                {!invitation && (
                    <div className='activate-fotoflow-whatsapp'>
                        <p>{ref!=='0000' ? `Your Referral Code ${ref} is invalid` : ` Fotoflow is currently Invite only. `}<br />
                        {ref!=='0000' ? `Check link again or ` : 'Ckick to '}<a href="https://wa.me/+916235099329?text=Activate%20Fotoflow" target="_blank" rel="noopener noreferrer">Join Waitlist</a></p>
                        
                    </div>
                )}

                {user?.email ?
                    <div className={`logged-user 
                    ${!invitation && 'unavaillable-referral-code'}
                    
                    `}>
                        <div className='user-image'
                            style={
                            user?.photoURL ? {backgroundImage: `url(${user.photoURL})`} : {}
                            }
                        >
                        </div>
                        <div className="logged-user-info">
                            
                        <span> {user.email}</span></div>
                        <div className="logout-button"
                            onClick={()=>{ 
                            dispatch(logout())
                            }}
                        >Logout</div>
                    </div>
                :
                <div className={`button google-login-button ${isDisabled ? 'disabled' : ''}`} onClick={handleGoogleSignIn}>
                    Continue with Google <div className="google-logo"></div>
                </div>
                }
            </div>

            {user?.email &&
            <div className={`form-wrapper animate-reveal ${!invitation && 'unavaillable-referral-code'}`} style={{ animationDelay: '0.6s' }}>
                <CreateStudioForm
                    user={user}
                    formData={formData}
                    studioName={invitation?.studioName}
                    updateFormData={updateFormData}
                    onNext={handleCreateAccount}
                    errors={errors}
                    isDomainAvailable={isDomainAvailable}
                    isCheckingDomain={isCheckingDomain}
                    disabled={isDisabled}
                    validateStudioForm={validateStudioForm}
                    validateAllSetForm={validateAllSetForm}
                />
            </div>
            }
        </main>
    );
}

export default Onboarding;