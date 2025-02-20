import { initializeApp } from "firebase/app";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAnalytics, isSupported, logEvent } from "firebase/analytics";
import { getVertexAI, getGenerativeModel } from "firebase/vertexai-preview";
import { getAuth, connectAuthEmulator, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// Enable Firebase debug mode
if (process.env.NODE_ENV === 'development') {
    console.log('DEV MODE');
    window.firebase = window.firebase || {};  // for debugging
    window.firebase.DEBUG = true;  // Enable verbose logging
}

// Monalisa Studio
/* const firebaseConfig = {
    apiKey: "AIzaSyAGoygHPVwkRh9x8tJIn_aKqfu38B7QGN0",
    authDomain: "monalisa-studio.firebaseapp.com",
    projectId: "monalisa-studio",
    storageBucket: "monalisa-studio.firebasestorage.app",
    messagingSenderId: "879876177591",
    appId: "1:879876177591:web:e750b669a1128585279732",
    measurementId: "G-K0JNH4BCS5"
  }; */
  
// Fotoflow-cloud
/* const firebaseConfig = {
    apiKey: "AIzaSyBsWiVISzqI1HwLIuy8oOgQ1phUC83WJXM",
    authDomain: "fotoflow-cloud.firebaseapp.com",
    projectId: "fotoflow-cloud",
    storageBucket: "fotoflow-cloud.firebasestorage.app",
    messagingSenderId: "484818631335",
    appId: "1:484818631335:web:50dbdf0791765ac9db7982",
    measurementId: "G-6PEEW55RGM"
}; */

// Fotoflow-dev !!! Storage Full
/* const firebaseConfig = {
    apiKey: "AIzaSyDmAGZJTd1xSofgYgyQeGOYP2dSiLE646U",
    authDomain: "fotoflow-dev.firebaseapp.com",
    projectId: "fotoflow-dev",
    storageBucket: "fotoflow-dev.appspot.com",
    messagingSenderId: "180761954293",
    appId: "1:180761954293:web:2756c328ad6f8d792e82bc",
    measurementId: "G-HMJWHV4W3X"
  }; */

// Obscura
const firebaseConfig = {
    apiKey: "AIzaSyATMISVaGPMkJANWrzgmOGqgMGHprnrT04",
    authDomain: "obscura-fotoflow.firebaseapp.com",
    projectId: "obscura-fotoflow",
    storageBucket: "obscura-fotoflow.appspot.com",
    messagingSenderId: "541778693405",
    appId: "1:541778693405:web:030ac1bcc8e072ea94e5f4",
    measurementId: "G-3P0M36DPY2"
};

/* const firebaseConfig = {
    apiKey: "AIzaSyCZ1dnvYYzVH-bViQGBFP1WgV5MVsTqakk",
    authDomain: "fotoflow-studio.firebaseapp.com",
    projectId: "fotoflow-studio",
    storageBucket: "fotoflow-studio.firebasestorage.app",
    messagingSenderId: "570189860599",
    appId: "1:570189860599:web:878ed45bd396cdebf24df2",
    measurementId: "G-FHQSX1KPWQ"
  }; */
  

const app = initializeApp(firebaseConfig);

const storage = getStorage(app);
const db = getFirestore(app);
const auth = getAuth(app);
let analytics
const vertexAI = getVertexAI(app);

const model = getGenerativeModel(vertexAI, { model: "gemini-2.0-flash" });

if (process.env.NODE_ENV === 'development') {
    const EMULATOR_HOST = process.env.REACT_APP_EMULATOR_HOST;
    const EMULATOR_PORT = process.env.REACT_APP_EMULATOR_PORT;
    const EMULATOR_FIRESTORE_PORT = process.env.REACT_APP_EMULATOR_FIRESTORE_PORT;
    const EMULATOR_AUTH_PORT = process.env.REACT_APP_EMULATOR_AUTH_PORT;
    console.log(EMULATOR_HOST, EMULATOR_PORT, EMULATOR_FIRESTORE_PORT, EMULATOR_AUTH_PORT);
    // Enable Firebase EMULATORS
    connectStorageEmulator(storage, EMULATOR_HOST, EMULATOR_PORT);
    connectFirestoreEmulator(db, EMULATOR_HOST, EMULATOR_FIRESTORE_PORT);
    connectAuthEmulator(auth, `http://${EMULATOR_HOST}:${EMULATOR_AUTH_PORT}`);
}

else {
    // Enable ANALYTICS only on PRODUCTION
     analytics = getAnalytics(app);
     console.log('Analytics running on PRODUCTION');
}

const provider = new GoogleAuthProvider();

// Export Firebase services
export { storage, db, auth, provider, analytics,model, signInWithPopup };
