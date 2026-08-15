import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getStories, createStory, deleteStory } from '../controllers/storyController.js';

const router = express.Router();

router.use(protect);

router.route('/')
    .get(getStories)
    .post(createStory);

router.route('/:id')
    .delete(deleteStory);

export default router;
