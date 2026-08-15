import User from '../models/User.js';
import Notification from '../models/Notification.js';

// @desc    Update User Push Token
// @route   PUT /api/users/pushtoken
// @access  Private
export const updatePushToken = async (req, res) => {
    const { pushToken } = req.body;

    if (!pushToken) {
        return res.status(400).json({ message: "No token provided" });
    }

    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.pushToken = pushToken;
            await user.save();
            res.json({ message: "Push token updated" });
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get All Notifications
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user._id })
            .sort({ createdAt: -1 })
            .populate('sender', 'name profilePic')
            .populate('post', 'content')
            .populate('team', 'name')
            .populate('event', 'title') // populate event as well just in case
            .limit(20);

        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (notification) {
            if (notification.recipient.toString() !== req.user._id.toString()) {
                return res.status(401).json({ message: "Not authorized" });
            }

            notification.read = true;
            await notification.save();
            res.json(notification);
        } else {
            res.status(404).json({ message: "Notification not found" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
