import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import { apiLimiter, roleLimiter } from '../middleware/rateLimiters.js';

import {
    getDashboardStats,
    getUsers,
    updateUserRole,
    suspendUser,
    unsuspendUser,
    deleteUser,
    getEvents,
    approveEvent,
    rejectEvent,
    deleteEvent,
    getPosts,
    deletePost,
    getForumPosts,
    deleteForumPost,
    getSettings,
    updateSettings,
    getLogs,
    getVerificationRequests,
    approveVerification,
    rejectVerification
} from '../controllers/adminController.js';

const router = express.Router();

// ============================================================
// SHARED ROUTES (Admin + Moderator)
// ============================================================

// Dashboard Stats
router.get('/', requireRole('admin', 'moderator'), getDashboardStats);

// Event Moderation
router.get('/events', requireRole('admin', 'moderator'), getEvents);
router.patch('/events/:id/approve', requireRole('admin', 'moderator'), approveEvent);
router.patch('/events/:id/reject', requireRole('admin', 'moderator'), rejectEvent);
router.delete('/events/:id', requireRole('admin', 'moderator'), deleteEvent);

// Content Moderation — Posts
router.get('/posts', requireRole('admin', 'moderator'), getPosts);
router.delete('/posts/:id', requireRole('admin', 'moderator'), deletePost);

// Content Moderation — Forum Posts
router.get('/forumPosts', requireRole('admin', 'moderator'), getForumPosts);
router.delete('/forumPosts/:id', requireRole('admin', 'moderator'), deleteForumPost);

// User Moderation (Suspend/Unsuspend only)
router.get('/users', requireRole('admin', 'moderator'), getUsers);
router.patch('/users/:id/suspend', requireRole('admin', 'moderator'), suspendUser);
router.patch('/users/:id/unsuspend', requireRole('admin', 'moderator'), unsuspendUser);

// Student Verification
router.get('/verifications', requireRole('admin', 'moderator'), getVerificationRequests);
router.patch('/verifications/:id/approve', requireRole('admin', 'moderator'), approveVerification);
router.patch('/verifications/:id/reject', requireRole('admin', 'moderator'), rejectVerification);

// ============================================================
// ADMIN ONLY ROUTES
// ============================================================

// Deep User Management
router.patch('/users/:id/role', requireRole('admin'), roleLimiter, updateUserRole);
router.delete('/users/:id', requireRole('admin'), deleteUser);

// Feature Flags / System Settings
router.get('/settings', requireRole('admin'), getSettings);
router.patch('/settings', requireRole('admin'), updateSettings);

// Audit Logs
router.get('/logs', requireRole('admin'), getLogs);

export default router;
