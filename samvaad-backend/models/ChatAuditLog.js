import mongoose from 'mongoose';

const chatAuditLogSchema = new mongoose.Schema({
    event: {
        type: String,
        required: true,
        enum: [
            'CHAT_CREATED',
            'MESSAGE_SENT',
            'FILE_SHARED',
            'PRIVATE_CHAT_CREATED',
            'CHAT_ACCESS_DENIED',
            'MESSAGE_EDITED',
            'MESSAGE_DELETED',
            'MEETING_CHAT_JOINED',
            'MEETING_CHAT_LEFT',
            'SYSTEM_MESSAGE',
            'MEETING_CHAT_KEY_CREATED',
            'MEETING_CHAT_KEY_ROTATED',
            'MESSAGE_ENCRYPTED',
            'MESSAGE_DECRYPTED',
            'CHAT_KEY_ACCESS_DENIED',
            'CONTACT_ADDED',
            'CONTACT_REMOVED',
            'DIRECT_CHAT_CREATED',
            'GROUP_CREATED',
            'GROUP_MEMBER_ADDED',
            'GROUP_MEMBER_REMOVED',
            'GROUP_RENAMED',
            'PUBLIC_KEY_REGISTERED'
        ]
    },
    meetingId: {
        type: String,
        default: null
    },
    chatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat',
        default: null
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    messageId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    }
}, {
    timestamps: true
});

// Indexes for efficient querying
chatAuditLogSchema.index({ createdAt: -1 });
chatAuditLogSchema.index({ meetingId: 1, createdAt: -1 });
chatAuditLogSchema.index({ chatId: 1, createdAt: -1 });

const ChatAuditLog = mongoose.model('ChatAuditLog', chatAuditLogSchema);
export default ChatAuditLog;
