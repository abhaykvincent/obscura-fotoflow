// firebase.js
import { initializeApp } from "firebase/app";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAnalytics,isSupported,logEvent } from "firebase/analytics";
import { getAuth, connectAuthEmulator, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

if(process.env.NODE_ENV === 'development'){
    console.log('DEV MODE');
}
else{
    console.log('PROD MODE');
}

const firebaseConfig = {
    apiKey: "AIzaSyATMISVaGPMkJANWrzgmOGqgMGHprnrT04",
    authDomain: "obscura-fotoflow.firebaseapp.com",
    projectId: "obscura-fotoflow",
    storageBucket: "obscura-fotoflow.appspot.com",
    messagingSenderId: "541778693405",
    appId: "1:541778693405:web:030ac1bcc8e072ea94e5f4",
  };
  
const app = initializeApp(firebaseConfig);

const storage = getStorage(app);
const db = getFirestore(app); 
const auth = getAuth(app);

if (process.env.NODE_ENV === 'development') {
    const EMULATOR_HOST = process.env.REACT_APP_EMULATOR_HOST;
    const EMULATOR_PORT = process.env.REACT_APP_EMULATOR_PORT;
    const EMULATOR_FIRESTORE_PORT = process.env.REACT_APP_EMULATOR_FIRESTORE_PORT;
    const EMULATOR_AUTH_PORT = process.env.REACT_APP_EMULATOR_AUTH_PORT;

    connectStorageEmulator(storage, EMULATOR_HOST, EMULATOR_PORT);
    connectFirestoreEmulator(db, EMULATOR_HOST, EMULATOR_FIRESTORE_PORT);
    connectAuthEmulator(auth, `http://${EMULATOR_HOST}:${EMULATOR_AUTH_PORT}`);
}

const provider = new GoogleAuthProvider();

export { storage, db,auth, provider, signInWithPopup};


