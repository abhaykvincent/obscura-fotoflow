import React from 'react';
import { provider,auth,signInWithPopup } from '../../firebase/app';
import {GoogleAuthProvider} from 'firebase/auth';
import { Navigate, useNavigate } from 'react-router';
import { fullAccess, getOwnerFromTeams } from '../../data/teams';
import { useDispatch } from 'react-redux';
import { login } from '../../app/slices/authSlice';

const LoginModal = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  document.title = `Login`
    const handleGoogleSignIn = async () => {
        signInWithPopup(auth, provider)
        .then((result) => {
          // This gives you a Google Access Token. You can use it to access the Google API.
          const credential = GoogleAuthProvider.credentialFromResult(result);
          const token = credential.accessToken;
          // The signed-in user info.
          const user = result.user;
          // IdP data available using getAdditionalUserInfo(result)
          // ...
          console.log("Logged in as " + user.email )
          dispatch(login(user))

        }).catch((error) => {
          // Handle Errors here.
          console.log(error)
          // The AuthCredential type that was used.
          const credential = GoogleAuthProvider.credentialFromError(error);
          // ...
        });
    };

  return (
    <div className="modal" id="loginModal">
      <div className="modal-header">
        <div className="modal-controls">
          <div className="control close"></div>
        </div>
        Login
      </div>
      <div className="form-section">
          <p>SignIn to FotoFlow as <b>{getOwnerFromTeams().email}</b></p>
        <div className="actions">
          <div className='button'  onClick={handleGoogleSignIn}>Sign In as {getOwnerFromTeams().name}<div className="google-logo"></div></div>
        </div>
      </div>
      <div className="logo">
        
      </div>
    </div>
  );
}

export default LoginModal;
