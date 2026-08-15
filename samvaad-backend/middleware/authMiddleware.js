import asyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import SystemSettings from '../models/SystemSettings.js';

const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            // Verify Custom JWT
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from token
            req.user = await User.findById(decoded.userId).select('-password');

            if (!req.user) {
                res.status(401);
                throw new Error('User not found');
            }

            // Block suspended users globally
            if (req.user.isSuspended) {
                res.status(403);
                throw new Error('Your account has been suspended. Contact support for assistance.');
            }

            // Maintenance mode — block non-admins
            const settings = await SystemSettings.getSettings();
            const maintenance = settings.features?.get('maintenance');
            if (maintenance?.enabled && req.user.role !== 'admin') {
                res.status(503);
                throw new Error('Service temporarily unavailable — maintenance in progress');
            }

            next();
        } catch (error) {
            // Auth error — do not leak details
            res.status(401);
            throw new Error('Not authorized, token failed');
        }
    }

    if (!token) {
        res.status(401);
        throw new Error('Not authorized, no token');
    }
});

export { protect };
