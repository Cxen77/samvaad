import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');

const initializeFirebase = () => {
    try {
        let serviceAccount;

        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            // Production: Load from Environment Variable
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
            console.log('Firebase Admin: Loaded from Environment Variable');
        } else if (fs.existsSync(serviceAccountPath)) {
            // Local Development: Load from File
            serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
            console.log('Firebase Admin: Loaded from File');
        }

        if (serviceAccount) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log('Firebase Admin Initialized successfully');
        } else {
            console.warn('WARNING: No Firebase Service Account found (Env or File).');
            console.warn('Authentication will fail.');
        }
    } catch (error) {
        console.error('Error initializing Firebase Admin:', error);
    }
};

export { initializeFirebase, admin };
