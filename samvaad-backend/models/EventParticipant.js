import mongoose from 'mongoose';

const eventParticipantSchema = new mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        default: null
    },
    registeredAt: {
        type: Date,
        default: Date.now
    },
    attended: {
        type: Boolean,
        default: false
    },
    attendedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: false
});

// Compound indexes for performance
// Unique registration guarantee + fast per-event lookups
eventParticipantSchema.index({ eventId: 1, userId: 1 }, { unique: true });
// Fast attendance-filtered queries used by export
eventParticipantSchema.index({ eventId: 1, attended: 1 });

const EventParticipant = mongoose.model('EventParticipant', eventParticipantSchema);

export default EventParticipant;
