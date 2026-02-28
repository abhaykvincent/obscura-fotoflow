import React, { useEffect, useState } from 'react';
import { provider,auth,signInWithPopup } from '../../firebase/app';
import {GoogleAuthProvider} from 'firebase/auth';
import { useNavigate } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { googleLogin, login, selectUserStudio, setUser } from '../../app/slices/authSlice';
import { openModal } from '../../app/slices/modalSlice';
import LoginEmailPassword from './LoginEmailPassword';
import AddStudio from '../../components/Modal/AddStudio';
import TermsOfServiceModal from '../../components/Modal/TermsOfServiceModal';
import PrivacyPolicyModal from '../../components/Modal/PrivacyPolicyModal';
import { fetchStudiosOfUser } from '../../firebase/functions/studios';
import { isDeveloper, trackEvent } from '../../analytics/utils';
import { updateProjectsStatus } from '../../app/slices/projectsSlice';
import { Link } from 'react-router-dom';
import { isAppleDevice } from '../../utils/generalUtils';
import { createNotification } from '../../app/slices/notificationSlice';
import { fetchLoginLocation } from '../../utils/locationUtils';
import { QRCodeCanvas } from 'qrcode.react';

const LoginModal = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const defaultStudio = useSelector(selectUserStudio)
  const [googleSignInResult, setGoogleSignInResult] = useState({});
  const [userStudios, setUserStudios] = useState([]);
  const [showStudioSelection, setShowStudioSelection] = useState(false);
  const [showDevQR, setShowDevQR] = useState(false);

  const localIp = process.env.REACT_APP_EMULATOR_HOST || 'localhost';
  const devUrl = `http://${localIp}:${window.location.port || '3000'}`;
  
  useEffect(()=>{
    
  },[])
  useEffect(()=>{
    if(googleSignInResult.user){
      
    console.log(googleSignInResult?.user)
    }
  },[googleSignInResult])
  const dispatchNotification = (response, deviceInfo, loginLocation) => {
    const studio = response.payload.selectedStudio || response.payload.studios?.[0] || response.payload.studio;
    if (!studio) return;

    dispatch(
      createNotification({
        studioId: studio.domain,
        notificationData: {
          title: 'New Login Detected',
          message: `Your account was accessed via Google  from ${deviceInfo} in ${loginLocation ? `\n ${loginLocation}` : ''}`,
          type: 'security',
          actionLink: '/activity-log',
          priority: 'normal',
          isRead: false,
          metadata: {
            createdAt: new Date().toISOString(),
            eventType: 'user_login',
            authMethod: 'google',
          },
        },
      })
    );
  };

  const handleSelectStudio = async (studio) => {
    try {
      setLoading(true);
      const user = googleSignInResult.user;
      const deviceInfo = navigator.userAgentData.platform;
      const loginLocation = await fetchLoginLocation();

      const serializedUser = {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        access: userStudios,
        selectedStudio: studio,
      };

      const response = await dispatch(login(serializedUser));
      
      if (response.payload === 'no-studio-found') {
        dispatch(updateProjectsStatus('login'));
        navigate('/onboarding');
        window.location.reload();
      } else {
        dispatchNotification(response, deviceInfo, loginLocation);
        navigate(`/${studio.domain}`);
      }
    } catch (error) {
      console.error('Error during studio selection:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);

      const result = await signInWithPopup(auth, provider);
      setGoogleSignInResult(result);

      // The signed-in user info.
      const user = result.user;
      console.log('Logged in as ' + user.email);

      trackEvent('login', { method: 'Google' });

      const studiosResponse = await fetchStudiosOfUser(user.email);
      console.log('Studios response:', studiosResponse);
      setUserStudios(studiosResponse);

      const serializedUser = {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        access: studiosResponse,
      };

      if (studiosResponse.length > 1) {
        debugger
        setShowStudioSelection(true);
        setLoading(false);;
        return;
      }

      const response = await dispatch(login(serializedUser));
      const deviceInfo = navigator.userAgentData.platform;

      // Fetch login location
      const loginLocation = await fetchLoginLocation();

      console.log('Login response:', response);

      if (studiosResponse.length === 0 || response.payload === 'no-studio-found') {
        dispatch(updateProjectsStatus('login'));
        navigate('/onboarding');

        window.location.reload();
      } else {
        // Dispatch notification
        dispatchNotification(response, deviceInfo, loginLocation);
  
        const studio = response.payload.selectedStudio || response.payload.studios?.[0] || response.payload.studio;
        navigate(`/${studio.domain}`);
      }
    } catch (error) {
      console.log('Error during sign-in:', error);
      const credential = GoogleAuthProvider.credentialFromError(error);
    } finally {
      if (!showStudioSelection) {
        setLoading(false);
      }
    }
  };
  const openEmailPassordLogin = () => {
    dispatch(openModal('loginEmailPassword'))
  }


  return (
    <>
    <div className="login-container">
      <div className={`logo ${loading ? 'loading' : ''}`}></div>
      <div className="modal island loginModal">

        <div className="actions">

        <h3 className='login-title-section'>
          <span>FotoFlow<span>.</span></span></h3>
        {/* <h2 className='login-title'>Signup <span>.</span> Signin <span>.</span></h2> */}
        
        {showStudioSelection ? (
          <div className="studio-selection-container">
            <h3 className='login-subtitle'>Select Studio</h3>
            <div className="studio-list">
              {userStudios.map((studio) => (
                <div 
                  key={studio.domain} 
                  className="studio-item button secondary"
                  onClick={() => handleSelectStudio(studio)}
                >
                  <div className="studio-info">
                    <span className="studio-name">{studio.name}</span>
                    <span className="studio-domain">{studio.domain}.fotoflow.pro</span>
                  </div>
                  <div className="icon-chevron-right"></div>
                </div>
              ))}
            </div>
            <div 
              className="button outline mt-4" 
              onClick={() => setShowStudioSelection(false)}
            >
              Back to Login
            </div>
          </div>
        ) : (
          <>
            <h3 className='login-subtitle'>Sign in or Create an account{/* <a className="green-label" href="">Create your studio</a> */}</h3>

            <p className="open-with-login-label">{ loading?'':''}</p>
              {/* <div className='button secondary outline disable'  onClick={openEmailPassordLogin}>Password Login<div className="email-logo"></div></div> */}
              
            <div className="sign-in-buttons">
            {
            loading? 
            <div className="">
              { googleSignInResult?.user?
                <p>Sign-in as <span>{googleSignInResult?.user?.email}</span></p> :
                <div className="google-signin-loading">
                  <p>
                      <span className='opening-loader'>... </span>Opening Google Sign-in 
                      <span className='auth-cancel'
                        onClick={()=>setLoading(false)}
                      >Cancel </span>
                  </p>
                </div> 
              }
            </div>:
            <>
              <div className={`button apple ${isAppleDevice() ? '':''}`}  onClick={handleGoogleSignIn}>
                <div className="logo-container">
                <div className="apple-logo"></div>

                </div>
                Continue with Apple
              </div>
              <div className='button google'  onClick={handleGoogleSignIn}>
                <div className="logo-container">
                  <div className="google-logo"></div>
                </div>
                Continue with Google
              </div>
            </>
            } 
              <div className="login-helper-options">
                <Link to={isDeveloper?'/onboarding?ref=2744':`/onboarding`}
                className={`create-studio-link ${loading? 'fade':''}`}
                >Sign up for Free</Link>
              </div>
              
            </div>
          </>
        )}
          

        </div>

        <div className="login-footer">
          <div className="footer-cta">
            <div className="footer-cta-button">Need Help ? <span> Chat with us</span></div>
            <p className="cta-postlabel"></p>
          </div>
          <div className="footer-actions">
            <a onClick={() => dispatch(openModal('privacyPolicy'))}>Privacy Policy</a>
            <p className="ampersand">&</p>
            <a onClick={() => dispatch(openModal('termsOfService'))}>Terms of Service </a>
          </div>
        
        </div>
      </div>

      <div className="login-branding">
        <p> 
          <span><span> Fotoflow</span> </span>
          <span>| </span>
          <span>
            <span> Flow</span>
            OS
          </span>
        </p>
      </div>

      {isDeveloper && (
        <div className="dev-qr-trigger" onClick={() => setShowDevQR(true)}>
          <div className="button icon icon-only share"></div>
        </div>
      )}
    </div>

    {showDevQR && (
      <div className="dev-qr-modal modal-container">
        <div className="modal island">
          <div className="modal-header">
            <div className="modal-controls">
              <div className="control close" onClick={() => setShowDevQR(false)}></div>
            </div>
            <div className="modal-title">Developer Access</div>
          </div>
          <div className="modal-body">
            <div className="qr-code-section">
              <QRCodeCanvas value={devUrl} size={256} />
              <p className="ip-label">{devUrl}</p>
              <p className="instruction">Scan to open on mobile</p>
            </div>
          </div>
          <div className="actions">
            <div className="button primary" onClick={() => setShowDevQR(false)}>Close</div>
          </div>
        </div>
        <div className="modal-backdrop" onClick={() => setShowDevQR(false)}></div>
      </div>
    )}
    <AddStudio/>
    <LoginEmailPassword/>
    <TermsOfServiceModal/>
    <PrivacyPolicyModal/>
    </>
  );
  
}

export default LoginModal;
// Line Complexity  0.6 -> 0.9
