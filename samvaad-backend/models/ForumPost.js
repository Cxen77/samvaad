import mongoose from 'mongoose';

const forumPostSchema = mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    image: { type: String, default: '' },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    forum: { type: mongoose.Schema.Types.ObjectId, ref: 'Forum', required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    views: { type: Number, default: 0 },
    tags: [{ type: String }],
    slug: { type: String }, // Optional: for SEO friendly URLs
    lastActivity: { type: Date, default: Date.now },
    isSolved: { type: Boolean, default: false },
    repliesCount: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date }
}, {
    timestamps: true
});

// Indexes
forumPostSchema.index({ forum: 1, createdAt: -1 });
forumPostSchema.index({ author: 1 });
forumPostSchema.index({ title: 'text', content: 'text', tags: 'text' }); // Text search

const ForumPost = mongoose.model('ForumPost', forumPostSchema);

export default ForumPost;
