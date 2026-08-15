import asyncHandler from 'express-async-handler';
import Event from '../models/Event.js';

/**
 * requireRole(...allowedRoles)
 * Middleware to restrict access to specific roles.
 * Must be used AFTER `protect` middleware.
 */
export const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401);
            throw new Error('Not authorized, no user found');
        }

        // Suspension check (Redundant if protect already checks, but safe to double-check)
        if (req.user.isSuspended) {
            res.status(403);
            throw new Error('Your account has been suspended.');
        }

        if (!allowedRoles.includes(req.user.role)) {
            res.status(403);
            throw new Error('Forbidden — Insufficient permissions');
        }

        next();
    };
};

/**
 * requireOrganizerForEvent
 * Middleware to ensure Organizers can only manage events for THEIR college.
 * Admins can access everything.
 */
export const requireOrganizerForEvent = asyncHandler(async (req, res, next) => {
    const eventId = req.params.id;

    // 1. If Admin, allow
    if (req.user.role === 'admin') {
        return next();
    }

    // 2. If valid Organizer
    if (req.user.role === 'organizer') {
        const event = await Event.findById(eventId);

        if (!event) {
            res.status(404);
            throw new Error('Event not found');
        }

        // 3. Strict College Check
        // Compare String representations of ObjectIds
        if (event.collegeId?.toString() !== req.user.collegeId?.toString()) {
            res.status(403);
            throw new Error('Forbidden — You can only manage events for your own college');
        }

        req.event = event; // Pass event to controller to avoid re-fetching
        return next();
    }

    // 4. Everyone else (User, Moderator) -> Forbidden
    res.status(403);
    throw new Error('Forbidden — Organizer access required');
});
