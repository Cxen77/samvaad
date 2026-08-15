import mongoose from 'mongoose';

const storySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        trim: true
    },
    images: [{
        type: String,
        trim: true
    }],
    createdAt: {
        type: Date,
        default: Date.now,
        index: { expires: '24h' } // TTL index: automatically delete after 24 hours
    }
}, {
    timestamps: true
});

storySchema.index({ userId: 1, createdAt: -1 });

const Story = mongoose.model('Story', storySchema);
export default Story;
