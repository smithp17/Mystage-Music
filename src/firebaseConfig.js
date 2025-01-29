// Import Firebase modules
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";  // ✅ Import Firebase Authentication
import { getAnalytics } from "firebase/analytics";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAbLXrA1LsXhoMgo-S7GH_Xotg-2tKu0D8",
  authDomain: "mystage-music.firebaseapp.com",
  projectId: "mystage-music",
  storageBucket: "mystage-music.appspot.com",  // ✅ Corrected storageBucket URL
  messagingSenderId: "934911299047",
  appId: "1:934911299047:web:a093e501bed7d4c3fb4142",
  measurementId: "G-WCQ6WH5D6H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);  // ✅ Initialize Firebase Auth
const analytics = getAnalytics(app);

export { app, auth, analytics };  // ✅ Export auth
