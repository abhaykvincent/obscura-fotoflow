
import React, { useEffect, useRef, useState } from 'react'
import CreateStudio from './CreateStudio.jsx'
import './Onboarding.scss'
import ProfessionType from './ProfessionType.jsx'
import ClientsSize from './ClientsSize.jsx'
import UserContact from './UserContact.jsx'
import { useNavigate } from 'react-router'
import { acceptInvitationCode, createStudio, createUser, useInvitationCode, validateInvitationCodeFromFirestore } from '../../firebase/functions/firestore.js'
import { useDispatch, useSelector } from 'react-redux'
import { checkAuthStatus, login, logout, selectUser, setCurrentStudio, setUser } from '../../app/slices/authSlice.js'
import { showAlert } from '../../app/slices/alertSlice.js'
import { signInWithPopup } from 'firebase/auth'
import { analytics, auth, provider } from '../../firebase/app.js'
import { GoogleAuthProvider } from 'firebase/auth/cordova'
import { useSearchParams } from 'react-router-dom'
import { greetUser } from '../../utils/stringUtils.js'
import { current } from '@reduxjs/toolkit'

function Onboarding() {
  const navigate = useNavigate()
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const ref = searchParams.get('ref') || '0000'; // Get the 'ref' parameter
  const user = useSelector(selectUser)
  const [timeOfDay, setTimeOfDay] = useState({
    timeOfDay: '',
    timeGreeting: '',
    personalizedMessage: ''

  })
  const [currentScreen, setCurrentScreen]= useState('create-studio')
  const [invitationReferral, setInvitationReferral] = useState({})
  const [createAccountData, setCreateAccountData] = useState({
    studioName: '',
    studioDomain: '',
    professionType: '',
    professionDomain: '',
    clientsPerMonth: '',
    projectSize: '',
    studioContact:''
  })
  const [errors, setErrors] = useState({
    studioName: '',
    email: ''
  });
  // Validation function
    const validateForm = () => {
      const newErrors = {};
      // Name validation
      if (!createAccountData.studioName.trim()) {
        newErrors.studioName = 'Name is required';
      } else if (createAccountData.studioName.trim().length < 2) {
        newErrors.studioName = 'Name must be at least 2 characters';
      }
  
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!user?.email.trim()) {
        newErrors.email = 'Use Google account to continue';
      } else if (!emailRegex.test(user.email)) {
        newErrors.email = 'Invalid email format';
      }
      else{
        newErrors.email = ''
      }
      console.log(newErrors)
      return newErrors;
    };
  const createTimeOFDayObject = () => {
    const hours = new Date().getHours();
    let timeOfDay;
    let timeGreeting;
    let personalizedMessage;
    if (hours < 5) { // Night Owls
    timeOfDay = "late-night";
    timeGreeting = "Happy late night!";
    personalizedMessage = "Stars are ready for their close-up—are you? ";
  } else if (hours < 6) { // Early Birds
    timeOfDay = "early-bird";
    timeGreeting = "Hei Early Bird!";
    personalizedMessage = "Fresh mornings, fresh perspectives. Now its the time"
  } else if (hours < 8.5) { // Golden Hour
    timeOfDay = "goden-hour";
    timeGreeting = "Happy Golden Hour!";
    personalizedMessage = " Let the golden hour inspire your creativity today.";
  } else if (hours < 12) { // Morning
    timeOfDay = "morning";
    timeGreeting = "Fresh morning!";
    personalizedMessage = "Sunrise calls for creativity. Let's get started!";
  } else if (hours < 15) { // After Noon
    timeOfDay = "noon";
    timeGreeting = "Good afternoon!";
    personalizedMessage = "Afternoon vibes are perfect for creating something extraordinary!";
  } else if (hours < 17) { // After Noon
    timeOfDay = "evening";
    timeGreeting = "Good Evening!";
    personalizedMessage = "Every great photo starts with the first step. Begin yours now.";
    } else if (hours < 19) { // Golden Hour
    timeOfDay = "golden-hour";
    timeGreeting = "Happy Golden Hour!";
    personalizedMessage = " Let the golden hour inspire your creativity tonight.";
  } else if (hours < 22) { // Night
    timeOfDay = "night";
    timeGreeting = "Good evening!";
    personalizedMessage = "Night is young, and so are ideas.";
  } else { // Final Hour of the Day
    timeOfDay = "late-night";
    timeGreeting = "Happy late night!";
    personalizedMessage = "When the world sleeps, creativity awakens. Let's make magic! ";
  }
    setTimeOfDay({ timeOfDay,timeGreeting, personalizedMessage });
  }
  const updateAccountData = (data) => {
    setCreateAccountData({...createAccountData, ...data})
  }
  const handleGoogleSignIn = async () => {
    signInWithPopup(auth, provider)
    .then((result) => {
      // This gives you a Google Access Token. You can use it to access the Google API.
      /* const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential.accessToken; */
      // The signed-in user info.
      let loginUser = result.user;
      console.log(loginUser)
      // IdP data available using getAdditionalUserInfo(result)
      // ...
      console.log("Logged in as " + loginUser.email )
      // EROR: Login.jsx:27 A non-serializable value was detected in an action, in the path: `payload`. Value: 
      const serializedUser = {
        userId: loginUser.uid,
        email: loginUser.email,
        displayName: loginUser.displayName,
        photoURL: loginUser.photoURL,
        access: '',
        studio: [],
      };  
      dispatch(setUser(serializedUser))

      analytics.setUserId(loginUser.uid);

    }).catch((error) => {
      // Handle Errors here.
      console.log(error)
      // The AuthCredential type that was used.
      const credential = GoogleAuthProvider.credentialFromError(error);
      // ...
      //navigate('/onboarding')
    });
  };
  const createAccountAndNavigate  = () => {
    console.log(user)
    createUser({
      email:user.email, 
      studio:{
        name: createAccountData.studioName,
        domain: createAccountData.studioDomain,
        roles: ['Admin'],
      }
    })
    .then((response) => {
      console.log(response)
      createStudio(response.studio)
          .then((response) => {
            console.log(response)
            acceptInvitationCode(ref)
              dispatch(showAlert({type:'success', message:`New Studio created!`}));
              dispatch(login(user))
              navigate(`/${response.domain}`);
          })
          .catch((error) => {
              console.error('Error creating Studio:', error);
              dispatch(showAlert({type:'error', message:`error`}));
              // Handle error scenarios, e.g., show an error message
          });
      dispatch(showAlert({type:'success', message:`New Studio created!`}));


      navigate(`/${response.studio.domain}`)
    })
  }
  // on ref change check the ref which is Invitation code for controlled onboarding
  const validateRefCode = () =>{
    validateInvitationCodeFromFirestore(ref)
    .then((response) => {
      setInvitationReferral(response)
    })
  }


  useEffect(() =>{
    ref && validateRefCode()
  },[ref])

  useEffect(() => {
      validateForm()
  },[user, createAccountData])
  useEffect(() => {
    dispatch(checkAuthStatus)
    createTimeOFDayObject()
  },[])
  return (
    <>
    <main className="onboarding-container">
      <div className="logo"></div>
      <div className="user-authentication">
        
        {
          invitationReferral?.name ?
            
            <>
              <p className='onboarding-greeting'>
                <span className={'timeGreeting icon '+ timeOfDay.timeOfDay}>{timeOfDay.timeGreeting}</span>
                <span className='iconic-gradient-white'>{invitationReferral?.name} </span>
              </p>
              <p className='onboarding-message'>{timeOfDay.personalizedMessage}</p>
            </>
            : <p></p>
        }
      

      {

        !user?.email && invitationReferral  &&
        <>
        <h3 className='continue-with'>Continue with</h3>
        <div className={`button primary google-login-button ${errors.email && 'error-shake'}`}  onClick={handleGoogleSignIn}>Google <div className="google-logo"></div></div>
        </>
      }
      {
          !invitationReferral && 'Referal Code not Active. Join Waitlist'
        }
      {
        user?.email &&
        <div className={`logged-user ${currentScreen!=='create-studio' ? 'minimize-gmail-user' : ''}`}>
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
      }
      {
        errors.email && !user?.email &&
        <div className="error-container">
          {
            errors.email
          }
        </div>
      }
        
      </div>

        <CreateStudio   
          active={currentScreen==='create-studio'} 
          next={()=>setCurrentScreen('user-contact')}
          updateAccountData={updateAccountData}
          createAccountData={createAccountData}
          setCreateAccountData={setCreateAccountData}
          user={user}
          validateForm={validateForm}
          setErrors={setErrors}
          errors={errors}

        />

        <UserContact    
          active={currentScreen==='user-contact'} 
          next={()=>createAccountAndNavigate()}
          previous={()=>{setCurrentScreen('create-studio')}}
          updateAccountData={updateAccountData}
          createAccountData={createAccountData}
          setCreateAccountData={setCreateAccountData}
          user={user}
          validateForm={validateForm}
          setErrors={setErrors}
      />
    </main>
    </>
  )
}

export default Onboarding