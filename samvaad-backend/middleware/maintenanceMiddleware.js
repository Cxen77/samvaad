import asyncHandler from 'express-async-handler';
import SystemSettings from '../models/SystemSettings.js';

// @desc    Block all non-admin requests when maintenance mode is on
// @note    Skips requests without req.user (public/auth routes)
//          so admins can still log in to disable maintenance.
export const checkMaintenanceMode = asyncHandler(async (req, res, next) => {
    // Skip if no user attached yet (public routes like login, signup, health)
    if (!req.user) {
        return next();
    }

    const settings = await SystemSettings.getSettings();

    if (settings.maintenanceMode && req.user.role !== 'admin') {
        res.status(503);
        throw new Error('Service temporarily unavailable — maintenance in progress');
    }

    next();
});
