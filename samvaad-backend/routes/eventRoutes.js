import express from 'express';
import {
    createEvent,
    getEvents,
    joinEvent,
    leaveEvent,
    updateEvent,
    getEventById,
    deleteEvent,
    getEventQRPayload
} from '../controllers/eventController.js';
import { getEventTeams } from '../controllers/teamController.js';
import { protect } from '../middleware/authMiddleware.js';
import requireFeature from '../middleware/requireFeature.js';
import validate from '../middleware/validate.js';
import { eventSchema } from '../utils/validationSchemas.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.route('/')
    .post(protect, requireFeature('events'), upload.single('imageFile'), validate(eventSchema), createEvent)
    .get(protect, getEvents);

router.route('/:id')
    .get(protect, getEventById)
    .put(protect, upload.single('imageFile'), validate(eventSchema), updateEvent)
    .delete(protect, deleteEvent);

router.put('/:id/join', protect, joinEvent);
router.put('/:id/leave', protect, leaveEvent);
router.get('/:id/teams', protect, getEventTeams);

// QR attendance payload — returns signed JSON, frontend generates the visual QR
router.get('/:id/qr-payload', protect, getEventQRPayload);

export default router;
