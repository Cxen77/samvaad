import { useEffect } from "react";
import { getToken } from "firebase/messaging";
import { messaging } from "../firebaseClient";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const useNotifications = () => {
    const { currentUser } = useAuth();

    useEffect(() => {
        const requestPermission = async () => {
            if (!currentUser || !messaging) return;

            try {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    console.log('Notification permission granted.');

                    // Get Token safely with VAPID key validation
                    const rawVapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
                    let validVapidKey = null;
                    if (rawVapidKey && typeof rawVapidKey === 'string' && rawVapidKey.length > 20) {
                        try {
                            const base64 = rawVapidKey.replace(/-/g, '+').replace(/_/g, '/');
                            const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
                            window.atob(padded);
                            validVapidKey = rawVapidKey;
                        } catch {
                            // Invalid base64, omit vapidKey to avoid atob crash
                        }
                    }

                    let currentToken = null;
                    try {
                        currentToken = await getToken(messaging, validVapidKey ? { vapidKey: validVapidKey } : undefined);
                    } catch (tokenErr) {
                        // Suppress unconfigured push notification token errors
                        console.warn('[Notifications] Token registration skipped:', tokenErr.message);
                    }

                    if (currentToken) {
                        try {
                            await api.put('/users/pushtoken', { pushToken: currentToken });
                            console.log('Push Token sent to server.');
                        } catch (err) {
                            console.error('Failed to send push token to server', err);
                        }
                    } else {
                        console.log('No registration token available.');
                    }
                } else {
                    console.log('Unable to get permission to notify.');
                }
            } catch (error) {
                console.warn('[Notifications] Permission or token handling warning:', error.message);
            }
        };

        requestPermission();
    }, [currentUser]);
};

export default useNotifications;
