import mongoose from 'mongoose';

const forumSchema = mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    icon: { type: String, default: '' },
    banner: { type: String, default: '' },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    rules: [{ type: String }],
    topics: [{ type: String }],
    stats: {
        postsCount: { type: Number, default: 0 },
        membersCount: { type: Number, default: 0 }
    }
}, {
    timestamps: true
});

// Indexes
forumSchema.index({ name: 'text', description: 'text' });

const Forum = mongoose.model('Forum', forumSchema);

export default Forum;
