
import React, { useEffect, useState } from 'react'
import CreateStudio from './CreateStudio.jsx'
import './Onboarding.scss'
import ProfessionType from './ProfessionType.jsx'
import ClientsSize from './ClientsSize.jsx'
import UserContact from './UserContact.jsx'
import { useNavigate } from 'react-router'
import { createStudio, createUser } from '../../firebase/functions/firestore.js'
import { useDispatch, useSelector } from 'react-redux'
import { selectUser, setCurrentStudio, setUser } from '../../app/slices/authSlice.js'
import { showAlert } from '../../app/slices/alertSlice.js'
import { signInWithPopup } from 'firebase/auth'
import { analytics, auth, provider } from '../../firebase/app.js'
import { GoogleAuthProvider } from 'firebase/auth/cordova'

function Onboarding() {
  const navigate = useNavigate()
  const dispatch = useDispatch();
  const user = useSelector(selectUser)
  const [currentScreen, setCurrentScreen]= useState('create-studio')
  const [createAccountData, setCreateAccountData] = useState({
    studioName: '',
    studioDomain: '',
    professionType: '',
    professionDomain: '',
    clientsPerMonth: '',
    projectSize: '',
    studioContact:''
  })
  const updateAccountData = (data) => {
    setCreateAccountData({...createAccountData, ...data})
  }
  
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
              dispatch(showAlert({type:'success', message:`New Project created!`}));
            
              navigate(`/${response.domain}`);
          })
          .catch((error) => {
              console.error('Error creating project:', error);
              dispatch(showAlert({type:'error', message:`error`}));
              // Handle error scenarios, e.g., show an error message
          });
      dispatch(showAlert({type:'success', message:`New Studio created!`}));


      navigate(`/${response.studio.domain}`)
    })
  }
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
      // EROR: Login.jsx:27 A non-serializable value was detected in an action, in the path: `payload`. Value: 
      const serializedUser = {
        userId: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        access: '',
        studio: [],
      };
      dispatch(setUser(serializedUser))

      analytics.setUserId(user.uid);

    }).catch((error) => {
      // Handle Errors here.
      console.log(error)
      // The AuthCredential type that was used.
      const credential = GoogleAuthProvider.credentialFromError(error);
      // ...
      //navigate('/onboarding')
    });
};
  useEffect(() => {
    console.log(createAccountData)
  },[createAccountData])
  return (
    <main className="onboarding-container">
      <div className="user-authentication">
      {
        !user.email &&
      <div className='button primary google-login-button'  onClick={handleGoogleSignIn}>Sign In with Google <div className="google-logo"></div></div>
      }
      {
        user.email &&
        <div className="logged-user">
        <div className="logged-user-info">Logged in as  <span> {user.email}</span></div>
      </div>
      }
      

      </div>

        <CreateStudio   active={currentScreen==='create-studio'} 
          next={()=>setCurrentScreen('profession-type')}
          updateAccountData={updateAccountData}
          createAccountData={createAccountData}
        />

        <ProfessionType active={currentScreen==='profession-type'} 
          next={()=>setCurrentScreen('client-size')}
          updateAccountData={updateAccountData}
          createAccountData={createAccountData}

        />

        <ClientsSize    active={currentScreen==='client-size'} 
          next={()=>setCurrentScreen('user-contact')}
          updateAccountData={updateAccountData}
          createAccountData={createAccountData}

        />

        <UserContact    active={currentScreen==='user-contact'} 
          next={()=>createAccountAndNavigate()}
          updateAccountData={updateAccountData}
          createAccountData={createAccountData}

        />
    </main>
  )
}

export default Onboarding