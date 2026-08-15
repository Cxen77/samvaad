import Story from '../models/Story.js';
import User from '../models/User.js';

// @desc    Get visible stories
// @route   GET /api/stories
// @access  Private
export const getStories = async (req, res) => {
    try {
        // Filter stories from users the current user follows + their own stories
        const followingIds = req.user.following || []; // Ensure it exists
        const visibleUserIds = [...followingIds, req.user._id];

        const stories = await Story.find({ userId: { $in: visibleUserIds } })
            .populate('userId', 'name profilePic')
            .sort({ createdAt: -1 });

        res.json(stories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a story
// @route   POST /api/stories
// @access  Private
export const createStory = async (req, res) => {
    try {
        const { text, images } = req.body;

        const story = await Story.create({
            userId: req.user._id,
            text,
            images
        });

        await story.populate('userId', 'name profilePic');

        res.status(201).json(story);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a user's story
// @route   DELETE /api/stories/:id
// @access  Private
export const deleteStory = async (req, res) => {
    try {
        const story = await Story.findById(req.params.id);

        if (!story) {
            return res.status(404).json({ message: 'Story not found' });
        }

        // Check if user owns the story
        if (story.userId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to delete this story' });
        }

        await story.deleteOne();

        res.json({ message: 'Story removed successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
