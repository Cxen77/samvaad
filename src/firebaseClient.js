import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "synapse-92325.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "synapse-92325",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "synapse-92325.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "476586267886",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:476586267886:web:38e00b0cf82efafb768fff",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-HC6SS7SV89"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
let messaging = null;

try {
    if (typeof window !== "undefined" && typeof navigator !== "undefined") {
        messaging = getMessaging(app);
    }
} catch (err) {
    console.warn('Firebase Messaging not supported');
}

export { auth, db, storage, messaging };
export default app;
