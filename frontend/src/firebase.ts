import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";

// TODO: replace with your Firebase project configuration (or use environment variables)
const firebaseConfig = {
    apiKey: "AIzaSyAY1MjCmII65lBkjkOmc9E2t6bDTs07U4g",
    authDomain: "slidequick-71693.firebaseapp.com",
    projectId: "slidequick-71693",
    storageBucket: "slidequick-71693.firebasestorage.app",
    messagingSenderId: "1023746646694",
    appId: "1:1023746646694:web:b8cfd3680e1347a8634a67",
    measurementId: "G-47CNHSGCBK"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
