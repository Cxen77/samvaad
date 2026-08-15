import express from 'express';
import multer from 'multer';

// Use memory storage for logos to avoid storing them permanently on disk
// The buffer will be drawn directly onto the PDF
const uploadFields = multer({ storage: multer.memoryStorage() }).fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'banner', maxCount: 1 },
    { name: 'organizerLogo', maxCount: 3 },
    { name: 'sponsorLogo', maxCount: 5 },
    { name: 'organizerLogos', maxCount: 3 },
    { name: 'sponsorLogos', maxCount: 5 }
]);
import {
    getDashboardStats,
    getEvents
} from '../controllers/adminController.js';

import {
    getOrganizerEvents,
    getEventParticipants,
    exportEventParticipants,
    generateEventCertificates,
    previewEventCertificates,
    scanAttendance
} from '../controllers/organizerController.js';

import { scanLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

// ============================================================
// ORGANIZER ROUTES (College Event Management Only)
// Security (protect, requireRole('organizer'), apiLimiter) is applied in server.js
// ============================================================

// Dashboard Stats (Organizers see college-specific stats)
router.get('/', getDashboardStats);

// Organizer specific Event Routes
router.get('/events/my', getOrganizerEvents);
router.get('/events/:id/participants', getEventParticipants);
router.get('/events/:id/export', exportEventParticipants);
router.post('/events/:id/certificates', uploadFields, generateEventCertificates);
router.post('/events/:id/certificates/preview', uploadFields, previewEventCertificates);

// ── Attendance Scanning ──────────────────────────────────────────────────────
// scanLimiter: 60 req/min — comfortable for rapid venue scanning, blocks abuse
router.post('/events/:id/scan-attendance', scanLimiter, scanAttendance);

export default router;
