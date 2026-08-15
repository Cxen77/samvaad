import { useEffect } from "react";
import { getToken } from "firebase/messaging";
import { messaging } from "../firebaseClient";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const useNotifications = () => {
    const { currentUser } = useAuth();

    useEffect(() => {
        const requestPermission = async () => {
            if (!currentUser) return;

            try {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    console.log('Notification permission granted.');

                    // Get Token
                    const currentToken = await getToken(messaging);

                    if (currentToken) {
                        try {
                            await api.put('/users/pushtoken', { pushToken: currentToken });
                            console.log('Push Token sent to server.');
                        } catch (err) {
                            console.error('Failed to send push token to server', err);
                        }
                    } else {
                        console.log('No registration token available. Request permission to generate one.');
                    }
                } else {
                    console.log('Unable to get permission to notify.');
                }
            } catch (error) {
                console.error('An error occurred while retrieving token. ', error);
            }
        };

        requestPermission();
    }, [currentUser]);
};

export default useNotifications;
