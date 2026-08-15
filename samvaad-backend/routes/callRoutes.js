import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getConversationCallHistory, getUserCallHistory } from '../controllers/callController.js';

const router = express.Router();

router.get('/history', protect, getUserCallHistory);
router.get('/history/:conversationId', protect, getConversationCallHistory);

export default router;
