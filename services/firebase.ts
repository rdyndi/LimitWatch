import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, doc, onSnapshot, setDoc } from "firebase/firestore";
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
const analytics = getAnalytics(app);
const db = getFirestore(app);

// Reference to the main data document
// We use a single document 'main' in collection 'app_data' for global sync
const DOC_REF = doc(db, "app_data", "main");

export const subscribeToAppState = (onUpdate: (data: AppState) => void) => {
  // Listen for realtime updates
  const unsubscribe = onSnapshot(DOC_REF, (docSnap) => {
    if (docSnap.exists()) {
      onUpdate(docSnap.data() as AppState);
    } else {
      console.log("No data found in Firebase, starting with empty state.");
      // Fix: Send empty state so the app stops loading
      onUpdate({
        cards: [],
        transactions: [],
        installments: [],
        savings: []
      });
    }
  }, (error) => {
    console.error("Firestore subscription error:", error);
    // On error (e.g. offline/permission), possibly stop loading too or show error
    // For now, let's allow the app to render with empty state or handle in UI
  });
  return unsubscribe;
};

export const saveAppState = async (data: AppState) => {
  try {
    // console.log("Saving to Firebase...", data);
    await setDoc(DOC_REF, data);
  } catch (error) {
    console.error("Error saving to Firebase:", error);
  }
};

export { app, analytics, db };