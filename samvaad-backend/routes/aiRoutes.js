import express from 'express';
import { summarizeTranscript } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/v1/ai/summarize — Generate AI summary from transcript
router.post('/summarize', protect, summarizeTranscript);

export default router;
