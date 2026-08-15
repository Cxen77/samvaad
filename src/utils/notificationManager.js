// Notification Deduplication Manager
// Prevents showing the same notification twice due to race conditions between Socket.io and FCM

const SHOWN_MESSAGES_KEY = 'shownNotifications';
const MAX_CACHE_SIZE = 100;
const EXPIRY_TIME = 30000; // 30 seconds

/**
 * Check if a notification for this message has already been shown
 * @param {string} messageId - The unique message ID
 * @returns {boolean} - True if already shown
 */
export const hasShownNotification = (messageId) => {
    try {
        const data = JSON.parse(sessionStorage.getItem(SHOWN_MESSAGES_KEY) || '{}');
        const timestamp = data[messageId];

        if (!timestamp) return false;

        // Check if expired
        if (Date.now() - timestamp > EXPIRY_TIME) {
            delete data[messageId];
            sessionStorage.setItem(SHOWN_MESSAGES_KEY, JSON.stringify(data));
            return false;
        }

        return true;
    } catch (error) {
        console.error('[NotificationManager] Error checking notification:', error);
        return false;
    }
};

/**
 * Mark a notification as shown
 * @param {string} messageId - The unique message ID
 */
export const markNotificationShown = (messageId) => {
    try {
        let data = JSON.parse(sessionStorage.getItem(SHOWN_MESSAGES_KEY) || '{}');

        // Add current message
        data[messageId] = Date.now();

        // Cleanup old entries if cache is too large
        const entries = Object.entries(data);
        if (entries.length > MAX_CACHE_SIZE) {
            // Sort by timestamp and keep only the most recent
            const sorted = entries.sort((a, b) => b[1] - a[1]);
            data = Object.fromEntries(sorted.slice(0, MAX_CACHE_SIZE));
        }

        sessionStorage.setItem(SHOWN_MESSAGES_KEY, JSON.stringify(data));
    } catch (error) {
        console.error('[NotificationManager] Error marking notification:', error);
    }
};

/**
 * Clear all notification history (useful for testing)
 */
export const clearNotificationHistory = () => {
    sessionStorage.removeItem(SHOWN_MESSAGES_KEY);
};
