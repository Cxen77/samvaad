import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    // AICTE Samvaad: Meeting-aware fields
    meetingId: {
        type: String,
        default: null,
        index: true
    },
    chatType: {
        type: String,
        enum: ['general', 'meeting', 'direct', 'group', 'private'],
        default: 'general'
    },
    isEncrypted: {
        type: Boolean,
        default: false
    },
    // AICTE Samvaad: Per-Meeting Encryption Key (Wrapped by Master Key)
    encryptedChatKey: {
        type: String,
        default: null
    },
    chatKeyIv: {
        type: String,
        default: null
    },
    chatKeyAuthTag: {
        type: String,
        default: null
    },
    chatKeyVersion: {
        type: Number,
        default: 1
    },
    // AICTE Samvaad: Group Key Versioning
    groupKeyVersion: {
        type: Number,
        default: 1
    },
    encryptedGroupKeys: {
        type: Map,
        of: String,
        default: {}
    },
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    // Track unread counts per user for efficiency
    unreadCounts: {
        type: Map,
        of: Number,
        default: {}
    },
    // Group Chat Fields
    isGroupChat: { type: Boolean, default: false },
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        default: null
    },
    chatName: { type: String, trim: true },
    description: { type: String, trim: true },
    groupAdmin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    deletedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

// Index for fetching user chats quickly
chatSchema.index({ participants: 1, updatedAt: -1 });
chatSchema.index({ meetingId: 1, chatType: 1 });

const Chat = mongoose.model('Chat', chatSchema);
export default Chat;
