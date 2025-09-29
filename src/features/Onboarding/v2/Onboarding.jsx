
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { analytics, auth, provider } from '../../../firebase/app';
import { selectUser, setUser, logout } from '../../../app/slices/authSlice';
import { trackEvent } from '../../../analytics/utils';
import { usePersonalizedGreeting } from './hooks/usePersonalizedGreeting';
import { useInvitation } from './hooks/useInvitation';
import { useOnboardingForm } from './hooks/useOnboardingForm';
import { completeOnboarding } from './slices/onboardingSlice';
import CreateStudioForm from './components/CreateStudioForm';
import UserContactForm from './components/UserContactForm';
import '../Onboarding.scss';
import { generateReferral } from '../../../app/slices/referralsSlice';

function Onboarding() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [searchParams] = useSearchParams();
    const ref = searchParams.get('ref') || '0000';

    const user = useSelector(selectUser);
    const { status: onboardingStatus } = useSelector(state => state.onboarding);
    const greeting = usePersonalizedGreeting();
    const { invitation, isLoading: isInvitationLoading } = useInvitation(ref);
    const { formData, updateFormData } = useOnboardingForm();

    const [currentScreen, setCurrentScreen] = useState('create-studio');
    const [errors, setErrors] = useState({ studioName: '', email: '' });

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
        dispatch(generateReferral({
          name: "Abhay",
          campainName: "Admin",
          campainPlatform: "whatsapp",
          type: "referral",
          email: "",
          phoneNumber: "",
          code: ['2744'],
          status: "active",
          quota: 3,
          used: 0,
          validity: 30,
          createdAt: new Date().toISOString(),
        }))
        trackEvent('onboarding_viewed', {
          referral_code: ref
        });
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

    return (
        <main className="onboarding-container">
            <div className="logo"></div>
            <div className={`user-authentication ${currentScreen === 'user-contact' || user?.email ? 'user-contact-screen' : ''}`}>
                {invitation?.name && (
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
                        <p>Referral code is not active. You need to</p>
                        <a href="https://wa.me/+916235099329?text=Activate%20Fotoflow" target="_blank" rel="noopener noreferrer">Activate Fotoflow</a>
                    </div>
                )}

                {user?.email && (
                    <div className={`logged-user ${currentScreen !== 'create-studio' ? 'minimize-gmail-user' : ''}`}>
                        <div className='user-image' style={user.photoURL ? { backgroundImage: `url(${user.photoURL})` } : {}}></div>
                        <div className="logged-user-info"><span>{user.email}</span></div>
                        <div className="logout-button" onClick={() => dispatch(logout())}>Logout</div>
                    </div>
                )}
            </div>

            <div className={`form-wrapper ${!invitation && 'unavaillable-referral-code'}`}>
                {currentScreen === 'create-studio' ? (
                    <CreateStudioForm
                        user={user}
                        formData={formData}
                        updateFormData={updateFormData}
                        onNext={() => setCurrentScreen('user-contact')}
                        errors={errors}
                    />
                ) : (
                    <UserContactForm
                        user={user}
                        formData={formData}
                        updateFormData={updateFormData}
                        onNext={handleCreateAccount}
                        onPrevious={() => setCurrentScreen('create-studio')}
                        handleGoogleSignIn={handleGoogleSignIn}
                    />
                )}
            </div>
        </main>
    );
}

export default Onboarding;
