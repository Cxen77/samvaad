import mongoose from 'mongoose';

const adminLogSchema = new mongoose.Schema({
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    targetType: {
        type: String,
        enum: ['User', 'Event', 'Post', 'ForumPost', 'SystemSettings', 'College'],
        required: true
    },
    details: {
        type: String,
        default: ''
    },
    ipAddress: {
        type: String,
        default: ''
    },
    userAgent: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Index for chronological log viewing
adminLogSchema.index({ createdAt: -1 });
adminLogSchema.index({ adminId: 1 });

const AdminLog = mongoose.model('AdminLog', adminLogSchema);

export default AdminLog;
