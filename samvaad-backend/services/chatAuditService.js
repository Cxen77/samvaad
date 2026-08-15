import ChatAuditLog from '../models/ChatAuditLog.js';

/**
 * Log a chat audit event. Fire-and-forget — errors are logged but don't break the caller.
 * 
 * @param {string} event - Event type (e.g., 'MESSAGE_SENT', 'CHAT_CREATED')
 * @param {Object} details - Event details
 * @param {string} [details.meetingId] - Associated meeting ID
 * @param {string} [details.chatId] - Associated chat ObjectId
 * @param {string} [details.userId] - User who triggered the event
 * @param {string} [details.messageId] - Associated message ObjectId
 * @param {Object} [details.metadata] - Additional non-sensitive metadata
 */
export const logChatEvent = async (event, { meetingId, chatId, userId, messageId, metadata } = {}) => {
    try {
        await ChatAuditLog.create({
            event,
            meetingId: meetingId || null,
            chatId: chatId || null,
            userId: userId || null,
            messageId: messageId || null,
            metadata: metadata || null
        });
    } catch (err) {
        // Non-blocking: audit logging should never break the main flow
        console.error('[ChatAudit] Failed to log event:', event, err.message);
    }
};
