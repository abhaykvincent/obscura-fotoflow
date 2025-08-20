import React, { useEffect, useState } from 'react';
import { provider,auth,signInWithPopup } from '../../firebase/app';
import {GoogleAuthProvider} from 'firebase/auth';
import { useNavigate } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { googleLogin, login, selectUserStudio, setUser } from '../../app/slices/authSlice';
import { openModal } from '../../app/slices/modalSlice';
import LoginEmailPassword from './LoginEmailPassword';
import AddStudio from '../../components/Modal/AddStudio';
import { fetchStudiosOfUser } from '../../firebase/functions/studios';
import { isDeveloper, trackEvent } from '../../analytics/utils';
import { updateProjectsStatus } from '../../app/slices/projectsSlice';
import { Link } from 'react-router-dom';
import { isAppleDevice } from '../../utils/generalUtils';
import { createNotification } from '../../app/slices/notificationSlice';
import { fetchLoginLocation } from '../../utils/locationUtils';

const LoginModal = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const defaultStudio = useSelector(selectUserStudio)
  const [googleSignInResult, setGoogleSignInResult] = useState({});
  
  useEffect(()=>{
    if(isDeveloper)navigate('/onboarding?ref=2744')
  },[])
  useEffect(()=>{
    if(googleSignInResult.user){
      
    console.log(googleSignInResult?.user)
    }
  },[googleSignInResult])
  const dispatchNotification = (response, deviceInfo, loginLocation) => {
    dispatch(
      createNotification({
        studioId: response.payload.studio.domain,
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

      const serializedUser = {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        access: studiosResponse,
      };

      const response = await dispatch(login(serializedUser));
      const deviceInfo = navigator.userAgentData.platform;

      // Fetch login location
      const loginLocation = await fetchLoginLocation();

      console.log('Login response:', response);

      if (response.payload === 'no-studio-found') {
        dispatch(updateProjectsStatus('login'));
        navigate('/onboarding');

        window.location.reload();
      } else {
        // Dispatch notification
        dispatchNotification(response, deviceInfo, loginLocation);
  
        navigate(`/${response.payload.studio.domain}`);
      }
    } catch (error) {
      console.log('Error during sign-in:', error);
      const credential = GoogleAuthProvider.credentialFromError(error);
    } finally {
      setLoading(false);
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

        <h3 className='login-title-section'><span>Secure Login<span>.</span></span></h3>
        {/* <h2 className='login-title'>Signup <span>.</span> Signin <span>.</span></h2> */}
        <h3 className='login-subtitle'>Shoot. Select. Share{/* <a className="green-label" href="">Create your studio</a> */}</h3>

        <p className="open-with-login-label">{ loading?'':''}</p>
          {/* <div className='button secondary outline disable'  onClick={openEmailPassordLogin}>Password Login<div className="email-logo"></div></div> */}
          
        <div className="sign-in-buttons">
        {
        loading? 
        <div className="">
          { googleSignInResult?.user?
            <p>Sign-in as <span>{googleSignInResult?.user?.email}</span></p> :
            <div className="">
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
          <div className={`button apple ${isAppleDevice() ? '':'disabled'}`}  onClick={handleGoogleSignIn}>
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
            <Link to="/onboarding" className={`create-studio-link ${loading? 'fade':''}`}>Create your Studio</Link>
          </div>
          
        </div>
          
        <div className="login-footer">
          <div className="footer-cta">
            <div className="footer-cta-button">Need Help ? <span> Chat with us</span></div>
            <p className="cta-postlabel"></p>
          </div>
          <div className="footer-actions">
            <a href="">Demo</a>
            <a href="">Recovery</a>
            <a href="">Region</a>
            <a href="">Terms of Service </a>
            <p className="ampersand">&</p>
            <a href="">Privacy Policy</a>
          </div>
        
        </div>

        </div>

      </div>

      <div className="login-branding">
        <p> 
          <span><span> Fotoflow</span> </span>
          <span>| </span>
            from the  house 
              <> of </>  
          <span>
            <span> Flow</span>
            OS
          </span>
        </p>
      </div>
    </div>
    <AddStudio/>
    <LoginEmailPassword/>
    </>
  );
  
}

export default LoginModal;
// Line Complexity  0.6 -> 0.9
