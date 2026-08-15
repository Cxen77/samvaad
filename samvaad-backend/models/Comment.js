import mongoose from 'mongoose';

const commentSchema = mongoose.Schema({
    post: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Post' },
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    text: { type: String, required: true },
    parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }, // Optional, for replies
}, {
    timestamps: true
});

// Indexes for fast fetching and pagination per post
commentSchema.index({ post: 1, createdAt: -1 });

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;
