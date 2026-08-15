import express from 'express';
const router = express.Router();
import { getLegalContent } from '../controllers/legalController.js';

router.get('/:type', getLegalContent);

export default router;
