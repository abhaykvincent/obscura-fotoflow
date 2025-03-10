import React, { useEffect, useState } from 'react';
import { provider,auth,signInWithPopup } from '../../firebase/app';
import {GoogleAuthProvider} from 'firebase/auth';
import { Navigate, useNavigate } from 'react-router';
import { fullAccess, getOwnerFromTeams, getStudiosOfUser } from '../../data/teams';
import { useDispatch, useSelector } from 'react-redux';
import { googleLogin, login, selectUserStudio, setUser } from '../../app/slices/authSlice';
import { openModal } from '../../app/slices/modalSlice';
import LoginEmailPassword from './LoginEmailPassword';
import AddStudio from '../../components/Modal/AddStudio';
import { fetchStudiosOfUser } from '../../firebase/functions/firestore';
import { trackEvent } from '../../analytics/utils';
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
      
        <p className="open-with-login-label">{ loading?'':'Open with ...'}</p>
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
              <div className='button google'  onClick={handleGoogleSignIn}>
                <div className="google-logo"></div>
                Google
              </div>
              <div className={`button apple ${isAppleDevice() ? '':'disabled'}`}  onClick={handleGoogleSignIn}>
                <div className="apple-logo"></div>
                Apple
              </div>
            </>
            } 
              <div className="login-helper-options">
                <Link to="/onboarding" className={`create-studio-link ${loading? 'fade':''}`}>Create your Studio</Link>
              </div>
              <div className="login-branding">
              <p>From the  
                <span>
                <> house </>  
                 </span>
                  <> of </>  
                <span>
                  <span> Flow</span>
                  OS
                </span>
              </p>
              </div>
            </div>
              
          </div>

          
        
      </div>
      <div className="login-footer">
        <a href="">Demo</a>
        <a href="">Support</a>
        <a href="">Recovery</a>
        <a href="">Region</a>
        <a href="">Terms of Service </a>
        <p className="ampersand">&</p>
        <a href="">Privacy Policy</a>
      </div>
    </div>
    <AddStudio/>
    <LoginEmailPassword/>
    </>
  );
  
}

export default LoginModal;
// Line Complexity  0.6 -> 0.9
