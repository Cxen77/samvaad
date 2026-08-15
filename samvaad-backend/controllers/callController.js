import CallHistory from '../models/CallHistory.js';
import Chat from '../models/Chat.js';

// @desc    Get call history for a specific conversation
// @route   GET /api/call/history/:conversationId
// @access  Private
export const getConversationCallHistory = async (req, res) => {
    try {
        const { conversationId } = req.params;

        // Verify membership
        const isMember = await Chat.exists({
            _id: conversationId,
            participants: req.user._id
        });

        if (!isMember) {
            return res.status(403).json({ message: 'Not authorized to view history for this conversation' });
        }

        const calls = await CallHistory.find({ conversationId })
            .populate('callerId', 'name profilePic role email')
            .populate('calleeId', 'name profilePic role email')
            .sort({ createdAt: -1 })
            .limit(50);

        res.json(calls);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user call history
// @route   GET /api/call/history
// @access  Private
export const getUserCallHistory = async (req, res) => {
    try {
        const calls = await CallHistory.find({
            $or: [
                { callerId: req.user._id },
                { calleeId: req.user._id }
            ]
        })
            .populate('callerId', 'name profilePic role email')
            .populate('calleeId', 'name profilePic role email')
            .populate('conversationId', 'chatName chatType')
            .sort({ createdAt: -1 })
            .limit(100);

        res.json(calls);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
