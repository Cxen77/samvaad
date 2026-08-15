import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    chatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat',
        required: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        trim: true
    },
    // AICTE Samvaad: Encryption fields (AES-256-GCM)
    encryptedContent: {
        type: String,
        default: null
    },
    iv: {
        type: String,
        default: null
    },
    authTag: {
        type: String,
        default: null
    },
    keyVersion: {
        type: Number,
        default: null // null implies legacy master-key encryption
    },
    // AICTE Samvaad: Message type for system messages
    messageType: {
        type: String,
        enum: ['user', 'system', 'file', 'decision', 'call'],
        default: 'user'
    },
    attachments: [{
        type: String, // URLs to images/files
        trim: true
    }],
    // AICTE Samvaad: File integrity hash
    fileHash: {
        type: String,
        default: null
    },
    isEdited: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        default: null
    },
    readBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

// Index for fetching chat history in order
messageSchema.index({ chatId: 1, createdAt: 1 });

const Message = mongoose.model('Message', messageSchema);
export default Message;
