import mongoose from 'mongoose';

const postSchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    content: { type: String },
    image: { type: String },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: { type: String, required: true },
        likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        replies: [{
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            text: { type: String, required: true },
            likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
            createdAt: { type: Date, default: Date.now }
        }],
        createdAt: { type: Date, default: Date.now }
    }],
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    // Soft migration: track comments via counter instead of loading the massive embedded array
    commentsCount: { type: Number, default: 0 },
    // Optional team attachment — only team owner can attach; team must be public + open
    attachedTeamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    // Optional event attachment — only event organizer can attach; event must be approved
    attachedEventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', default: null }
}, {
    timestamps: true
});

// Indexes for performance
postSchema.index({ user: 1 });
postSchema.index({ likes: 1 });

// CRITICAL INDEX: Prevent full collection scans on feed queries
postSchema.index({ isDeleted: 1, createdAt: -1 });
postSchema.index({ attachedTeamId: 1 });
postSchema.index({ attachedEventId: 1 });

const Post = mongoose.model('Post', postSchema);

export default Post;
