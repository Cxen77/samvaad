import express from 'express';
import { uploadImage } from '../controllers/uploadController.js';
import upload from '../middleware/uploadMiddleware.js';
import { protect } from '../middleware/authMiddleware.js';
import requireFeature from '../middleware/requireFeature.js';

const router = express.Router();

router.post('/', protect, requireFeature('imagePost'), upload.single('image'), uploadImage);

export default router;
