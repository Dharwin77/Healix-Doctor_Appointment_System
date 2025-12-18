import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBeDeqNjJJLywaHTf2s7FUooCBijovFIo8",
  authDomain: "health-25075.firebaseapp.com",
  projectId: "health-25075",
  storageBucket: "health-25075.firebasestorage.app",
  messagingSenderId: "145878140220",
  appId: "1:145878140220:web:c83ee4d802d381e6434a39",
  measurementId: "G-PD4WPWD97R"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.addScope("profile");
provider.addScope("email");
provider.setCustomParameters({
  prompt: "select_account",
});

let analytics = null;
if (typeof window !== "undefined") {
  try {
    analytics = getAnalytics(app);
  } catch (e) {
    console.warn("Analytics failed to initialize:", e);
  }
}

export {
  auth,
  provider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  analytics,
  onAuthStateChanged,
  signOut,
};
