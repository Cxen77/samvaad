import { useState, useEffect } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '../firebaseClient';
import { useAuth } from '../context/AuthContext';
import axios from '../api/axios';
import toast from 'react-hot-toast';

const usePushNotification = () => {
    const { user } = useAuth();
    const [permission, setPermission] = useState(Notification.permission);

    useEffect(() => {
        if (!user || !messaging) return;

        const requestPermissionAndSaveToken = async () => {
            try {
                const currentPermission = await Notification.requestPermission();
                setPermission(currentPermission);

                if (currentPermission === 'granted') {
                    const tokenOptions = import.meta.env.VITE_FIREBASE_VAPID_KEY 
                        ? { vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY } 
                        : undefined;
                    const token = await getToken(messaging, tokenOptions);

                    if (token) {
                        // Send to backend
                        await axios.put('/pushtoken', { pushToken: token });
                        console.log('Push token updated');
                    }
                }
            } catch (error) {
                console.error('Failed to request permission or save token:', error);
            }
        };

        requestPermissionAndSaveToken();

    }, [user]);

    // Foreground listener
    useEffect(() => {
        if (!messaging) return;

        const unsubscribe = onMessage(messaging, (payload) => {
            // Optional: Show toast for foreground message
            // The user prompt said "default system notification" but that's for background.
            // For foreground, apps usually show a toast or in-app UI.
            // I'll leave a log and a simple toast for now.
            console.log('Foreground push message received:', payload);
            // toast(payload.notification.title + ': ' + payload.notification.body, {
            //     icon: '💬',
            //     duration: 4000
            // });
        });

        return () => unsubscribe();
    }, []);

    return { permission };
};

export default usePushNotification;
