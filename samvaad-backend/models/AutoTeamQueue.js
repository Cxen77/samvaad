import mongoose from 'mongoose';

const autoTeamQueueSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    filters: {
        college: { type: String, default: '' },
        location: { type: String, default: '' },
        year: { type: String, default: '' },
        skills: [{ type: String }],
        role: { type: String, default: '' }
    },
    status: {
        type: String,
        enum: ['queued', 'matched'],
        default: 'queued'
    }
}, {
    timestamps: true
});

// Index to quickly find queued users for a specific event
autoTeamQueueSchema.index({ eventId: 1, status: 1 });
// Ensure a user can only be in the queue once per event
autoTeamQueueSchema.index({ userId: 1, eventId: 1 }, { unique: true });

const AutoTeamQueue = mongoose.model('AutoTeamQueue', autoTeamQueueSchema);

export default AutoTeamQueue;
