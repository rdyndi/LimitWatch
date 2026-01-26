
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import * as firestore from "firebase/firestore";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged,
  updateProfile,
  User 
} from "firebase/auth";
import { AppState } from "../types";

const { getFirestore, doc, onSnapshot, setDoc } = firestore;

const firebaseConfig = {
  apiKey: "AIzaSyALzhraAqiH0_50nOOIQUY1WZd9tStajB8",
  authDomain: "dompetcerdas-4490e.firebaseapp.com",
  projectId: "dompetcerdas-4490e",
  storageBucket: "dompetcerdas-4490e.firebasestorage.app",
  messagingSenderId: "720070434008",
  appId: "1:720070434008:web:f5b001e1455374e0798bad",
  measurementId: "G-Z6MRN5Z18X"
};

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

export const updateUserProfile = async (displayName: string) => {
  if (auth.currentUser) {
    try {
      await updateProfile(auth.currentUser, { displayName });
      return true;
    } catch (error) {
      console.error("Error updating profile", error);
      throw error;
    }
  }
  return false;
};

export const subscribeToAuth = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export const subscribeToAppState = (userId: string, onUpdate: (data: AppState) => void) => {
  if (!userId) return () => {};

  const userDocRef = doc(db, "users", userId);

  const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
    if (docSnap.exists()) {
      const state = docSnap.data() as AppState;
      if (!state.piutangs) state.piutangs = [];
      onUpdate(state);
    } else {
      console.log("No user data found, creating new empty state.");
      onUpdate({
        cards: [],
        transactions: [],
        installments: [],
        savings: [],
        piutangs: []
      });
    }
  }, (error) => {
    console.error("Firestore subscription error:", error);
  });
  return unsubscribe;
};

export const saveAppState = async (userId: string, data: AppState) => {
  if (!userId) return;
  
  try {
    const sanitizedData = JSON.parse(JSON.stringify(data));
    const userDocRef = doc(db, "users", userId);
    await setDoc(userDocRef, sanitizedData);
  } catch (error) {
    console.error("Error saving to Firebase:", error);
  }
};

export { app, analytics, db, auth };
