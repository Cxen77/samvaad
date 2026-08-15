import mongoose from 'mongoose';

const replySchema = mongoose.Schema({
    content: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'ForumPost', required: true },
    parentReply: { type: mongoose.Schema.Types.ObjectId, ref: 'Reply', default: null }, // For nested replies
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, {
    timestamps: true
});

// Indexes
replySchema.index({ post: 1, createdAt: 1 });
replySchema.index({ parentReply: 1 });

const Reply = mongoose.model('Reply', replySchema);

export default Reply;
