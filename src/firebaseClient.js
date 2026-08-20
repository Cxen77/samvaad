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

// Initialize Firebase conditionally to prevent runtime crashes when keys are missing
let app = null;
let auth = null;
let db = null;
let storage = null;
let messaging = null;

if (firebaseConfig.apiKey) {
    try {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        storage = getStorage(app);

        if (typeof window !== "undefined" && typeof navigator !== "undefined") {
            try {
                messaging = getMessaging(app);
            } catch (err) {
                console.warn('Firebase Messaging not supported in this environment:', err.message);
            }
        }
    } catch (err) {
        console.warn('Firebase initialization error:', err.message);
    }
} else {
    console.warn('⚠️ VITE_FIREBASE_API_KEY is not defined. Firebase services are running in safe fallback mode.');
}

export { auth, db, storage, messaging };
export default app;
