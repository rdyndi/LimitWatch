// @ts-ignore
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile, 
  onAuthStateChanged,
  User 
} from "firebase/auth";
// @ts-ignore
import { getFirestore, doc, onSnapshot, setDoc, collection, query, where, getDocs } from "firebase/firestore";
// @ts-ignore
import { getMessaging, getToken, onMessage } from "firebase/messaging";
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
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const messaging = getMessaging(app);

const googleProvider = new GoogleAuthProvider();

// VAPID Key Anda (Pastikan tidak ada spasi)
const VAPID_KEY = "BAF-rI8LoPk1Ga5ryX-P2lXpM8zsidXWfFFFvWB2zqS1OIWV6Nl6lCr8wDvT2ZO9xx5YoN2e98yJXlx3HlaSazE";

// --- Messaging Functions ---

export const requestFcmToken = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // PENTING: Register SW secara eksplisit di root
      // Gunakan scope '/' untuk memastikan SW mengontrol seluruh aplikasi
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/firebase-cloud-messaging-push-scope' });
      
      const currentToken = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration 
      });

      if (currentToken) {
        console.log('FCM Token:', currentToken);
        return currentToken;
      } else {
        console.log('No registration token available. Request permission to generate one.');
        return null;
      }
    } else {
      console.log('Unable to get permission to notify.');
      return null;
    }
  } catch (err) {
    console.error('An error occurred while retrieving token: ', err);
    return null;
  }
};

export const onMessageListener = () => {
  return new Promise((resolve) => {
    onMessage(messaging, (payload: any) => {
      resolve(payload);
    });
  });
};

// --- Auth Functions ---

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

// --- Database Functions ---

export const getEmailByUsername = async (username: string): Promise<string | null> => {
  try {
    const usersRef = collection(db, "users");
    // Query users where username matches
    const q = query(usersRef, where("username", "==", username));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const userData = querySnapshot.docs[0].data() as AppState;
      return userData.email || null;
    }
    return null;
  } catch (error) {
    console.error("Error finding username:", error);
    return null;
  }
};

export const subscribeToAppState = (userId: string, onUpdate: (data: AppState) => void) => {
  if (!userId) return () => {};

  const userDocRef = doc(db, "users", userId);

  const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
    if (docSnap.exists()) {
      onUpdate(docSnap.data() as AppState);
    } else {
      console.log("No user data found, creating new empty state.");
      onUpdate({
        cards: [],
        transactions: [],
        installments: [],
        savings: [],
        wallets: []
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

export { app, db, auth, messaging };