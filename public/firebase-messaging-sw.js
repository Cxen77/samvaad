// Firebase Cloud Messaging Service Worker
// These are PUBLIC client-side Firebase config values (not secrets).
// They are safe to include here — Firebase API keys are scoped by domain restrictions.
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize Firebase directly (no URL-param dependency)
// This ensures the SW evaluates successfully when registered by getToken()
try {
    if (!firebase.apps.length) {
        firebase.initializeApp({
            apiKey: "AIzaSyAB9syzEGR2lYpt_RGUlIV7p-IqtT2-SSk",
            authDomain: "synapse-92325.firebaseapp.com",
            projectId: "synapse-92325",
            storageBucket: "synapse-92325.firebasestorage.app",
            messagingSenderId: "476586267886",
            appId: "1:476586267886:web:38e00b0cf82efafb768fff",
            measurementId: "G-HC6SS7SV89"
        });
    }

    const messaging = firebase.messaging();

    messaging.onBackgroundMessage(function (payload) {
        console.log('[firebase-messaging-sw.js] Received background message ', payload);

        // Check if ANY app window is open
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            // If ANY client exists (even if not focused), suppress notification
            // The socket listener will handle in-app notifications
            if (clientList.length > 0) {
                console.log('[firebase-messaging-sw.js] App window is open - suppressing system notification (socket will handle)');
                return;
            }

            // Only show system notification if app is completely closed
            console.log('[firebase-messaging-sw.js] No app window open - showing system notification');
            const notificationTitle = payload.notification?.title || 'New Message';
            const notificationOptions = {
                body: payload.notification?.body || '',
                icon: '/logo.png',
                data: payload.data,
                tag: 'message-tag',
                badge: '/logo.png',
                requireInteraction: false
            };

            self.registration.showNotification(notificationTitle, notificationOptions);
        });
    });
} catch (err) {
    console.error('[firebase-messaging-sw.js] Initialization error:', err);
}

self.addEventListener('notificationclick', function (event) {
    console.log('[firebase-messaging-sw.js] Notification click Received.', event.notification.data);

    event.notification.close();

    const chatId = event.notification.data?.chatId;
    const url = chatId ? `/chat/${chatId}` : '/chat';

    // Open chat
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(function (windowClients) {
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url.includes(url) && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});
