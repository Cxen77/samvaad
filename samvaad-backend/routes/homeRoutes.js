import express from 'express';
const router = express.Router();
import { getHomeData } from '../controllers/homeController.js';
import { protect } from '../middleware/authMiddleware.js';

router.route('/').get(protect, getHomeData);

export default router;
