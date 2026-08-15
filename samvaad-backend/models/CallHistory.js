import mongoose from 'mongoose';

const callHistorySchema = new mongoose.Schema({
    callId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat',
        required: true,
        index: true
    },
    callerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    calleeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    callType: {
        type: String,
        enum: ['voice', 'video'],
        required: true
    },
    status: {
        type: String,
        enum: ['COMPLETED', 'MISSED', 'REJECTED', 'BUSY', 'CANCELLED', 'FAILED'],
        required: true
    },
    startedAt: {
        type: Date,
        default: null
    },
    endedAt: {
        type: Date,
        default: null
    },
    duration: {
        type: Number, // in seconds
        default: 0
    }
}, {
    timestamps: true
});

callHistorySchema.index({ conversationId: 1, createdAt: -1 });

const CallHistory = mongoose.model('CallHistory', callHistorySchema);
export default CallHistory;
