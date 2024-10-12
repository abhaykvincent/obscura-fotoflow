import { initializeApp } from "firebase/app";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAnalytics, isSupported, logEvent } from "firebase/analytics";
import { getAuth, connectAuthEmulator, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// Enable Firebase debug mode
if (process.env.NODE_ENV === 'development') {
    console.log('DEV MODE');
    window.firebase = window.firebase || {};  // for debugging
    window.firebase.DEBUG = true;  // Enable verbose logging
} else {
    console.log('Analytics running on PRODUCTION');
}
<<<<<<< HEAD
=======

// Fotoflow-dev
>>>>>>> develop-alpha
const firebaseConfig = {
    apiKey: "AIzaSyDmAGZJTd1xSofgYgyQeGOYP2dSiLE646U",
    authDomain: "fotoflow-dev.firebaseapp.com",
    projectId: "fotoflow-dev",
    storageBucket: "fotoflow-dev.appspot.com",
    messagingSenderId: "180761954293",
    appId: "1:180761954293:web:2756c328ad6f8d792e82bc",
    measurementId: "G-HMJWHV4W3X"
  };

// Obscura
 /*  const firebaseConfig = {
    apiKey: "AIzaSyATMISVaGPMkJANWrzgmOGqgMGHprnrT04",
    authDomain: "obscura-fotoflow.firebaseapp.com",
    projectId: "obscura-fotoflow",
    storageBucket: "obscura-fotoflow.appspot.com",
    messagingSenderId: "541778693405",
    appId: "1:541778693405:web:030ac1bcc8e072ea94e5f4",
    measurementId: "G-3P0M36DPY2"
}; */

const app = initializeApp(firebaseConfig);

const storage = getStorage(app);
const db = getFirestore(app);
const auth = getAuth(app);
let analytics


if (process.env.NODE_ENV === 'development') {
    const EMULATOR_HOST = process.env.REACT_APP_EMULATOR_HOST;
    const EMULATOR_PORT = process.env.REACT_APP_EMULATOR_PORT;
    const EMULATOR_FIRESTORE_PORT = process.env.REACT_APP_EMULATOR_FIRESTORE_PORT;
    const EMULATOR_AUTH_PORT = process.env.REACT_APP_EMULATOR_AUTH_PORT;

    // Enable Firebase EMULATORS
    connectStorageEmulator(storage, EMULATOR_HOST, EMULATOR_PORT);
    connectFirestoreEmulator(db, EMULATOR_HOST, EMULATOR_FIRESTORE_PORT);
    connectAuthEmulator(auth, `http://${EMULATOR_HOST}:${EMULATOR_AUTH_PORT}`);
}

else {
    // Enable ANALYTICS only on PRODUCTION
     analytics = getAnalytics(app);
}

const provider = new GoogleAuthProvider();

// Export Firebase services
export { storage, db, auth, provider, analytics, signInWithPopup };
