import mongoose from 'mongoose';

const eventSchema = mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    location: { type: String, required: true },
    category: {
        type: String,
        required: true,
        enum: ['Hackathon', 'Workshop', 'Seminar', 'Tournament', 'Meetup', 'Project', 'Game', 'Sport']
    },
    prize: { type: String },
    imageUrl: { type: String },
    organizer: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', index: true },
    isMultiCollege: { type: Boolean, default: true },
    allowTeamRegistration: { type: Boolean, default: false },
    requireUSN: { type: Boolean, default: false },
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    maxTeamSize: { type: Number, default: 4 },
    isApproved: { type: Boolean },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date }
}, {
    timestamps: true
});

// Indexes for performance
eventSchema.index({ date: 1 });
eventSchema.index({ organizer: 1 });
eventSchema.index({ attendees: 1 });
eventSchema.index({ isApproved: 1, isDeleted: 1, createdAt: -1 });

const Event = mongoose.model('Event', eventSchema);

export default Event;
