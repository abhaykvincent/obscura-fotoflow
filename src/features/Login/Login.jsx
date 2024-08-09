import React, { useEffect } from 'react';
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

const LoginModal = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const defaultStudio = useSelector(selectUserStudio)

 

  document.title = `Login`
  const handleGoogleSignIn = async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        
        // This gives you a Google Access Token. You can use it to access the Google API.
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential.accessToken;
        
        // The signed-in user info.
        const user = result.user;
        console.log("Logged in as " + user.email);
        
        const studiosResponse = await fetchStudiosOfUser(user.email);
        console.log("Studios response:", studiosResponse);
        

        const studios = studiosResponse.payload;
        const serializedUser = {
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            access: studiosResponse,
        };
        console.log("Serialized user:", serializedUser);

        await dispatch(login(serializedUser));
        navigate(`/${studiosResponse.domain}/`);
    } catch (error) {
        console.log("Error during sign-in:", error);
        // Handle Errors here.
        const credential = GoogleAuthProvider.credentialFromError(error);
        navigate('/onboarding');
    }
};



    const openEmailPassordLogin = () => {
      dispatch(openModal('loginEmailPassword'))
    }

  return (
    <>
    <div className="modal loginModal">
      <div className="modal-header">
        <div className="modal-controls">
          <div className="control close"></div>
        </div>
        Login
      </div>
      <div className="form-section">
          <p>Use google account to use <b>FotoFlow</b></p>
        <div className="actions">
          <div className='button secondary outline'  onClick={openEmailPassordLogin}>Password Login<div className="email-logo"></div></div>
          <div className='button'  onClick={handleGoogleSignIn}>Sign In with<div className="google-logo"></div></div>
        </div>
      </div>
      <div className="logo">
        
      </div>
    </div>
    <AddStudio/>
    <LoginEmailPassword/>
    </>
  );
}

export default LoginModal;
// Line Complexity  0.6 -> 0.9
