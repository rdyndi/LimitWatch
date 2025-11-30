import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, doc, onSnapshot, setDoc } from "firebase/firestore";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged, 
  User 
} from "firebase/auth";
import { AppState } from "../types";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyALzhraAqiH0_50nOOIQUY1WZd9tStajB8",
  authDomain: "dompetcerdas-4490e.firebaseapp.com",
  projectId: "dompetcerdas-4490e",
  storageBucket: "dompetcerdas-4490e.firebasestorage.app",
  messagingSenderId: "720070434008",
  appId: "1:720070434008:web:f5b001e1455374e0798bad",
  measurementId: "G-Z6MRN5Z18X"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let analytics = null;
try {
  analytics = getAnalytics(app);
} catch (error) {
  console.warn("Firebase Analytics initialization failed (this is optional):", error);
}

const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// --- Auth Functions (Optional/Future Use) ---

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
};

export const registerWithEmail = async (email: string, pass: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (error) {
    console.error("Register failed:", error);
    throw error;
  }
};

export const loginWithEmail = async (email: string, pass: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout failed:", error);
  }
};

export const subscribeToAuth = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// --- Database Functions ---

// Use a fixed global document for app data synchronization since no user ID is passed from App.tsx
const GLOBAL_DOC_REF = doc(db, "app_data", "main_data");

export const subscribeToAppState = (onUpdate: (data: AppState) => void) => {
  // Listen for realtime updates on the global document
  const unsubscribe = onSnapshot(GLOBAL_DOC_REF, (docSnap) => {
    if (docSnap.exists()) {
      onUpdate(docSnap.data() as AppState);
    } else {
      console.log("No data found, starting with empty state.");
      // Send empty state so the app stops loading
      onUpdate({
        cards: [],
        transactions: [],
        installments: [],
        savings: []
      });
    }
  }, (error) => {
    console.error("Firestore subscription error:", error);
  });
  return unsubscribe;
};

export const saveAppState = async (data: AppState) => {
  try {
    await setDoc(GLOBAL_DOC_REF, data);
  } catch (error) {
    console.error("Error saving to Firebase:", error);
  }
};

export { app, analytics, db, auth };