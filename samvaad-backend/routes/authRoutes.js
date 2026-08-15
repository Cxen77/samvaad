import express from 'express';
import {
    authUser,
    registerUser,
    logoutUser,
    logoutAllSessions,
    verifyEmail,
    forgotPassword,
    resetPassword,
    googleAuth,
    refreshToken,
    getCurrentSession,
    getAllSessions,
    resendOtp
} from '../controllers/authController.js';
import passport from 'passport';
import { protect } from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import { authLimiter, refreshLimiter, googleAuthLimiter } from '../middleware/rateLimiters.js';
import verifyCaptcha from '../middleware/captchaMiddleware.js';

const router = express.Router();

// Auth routes with Rate Limiting & CAPTCHA
router.post('/signup', authLimiter, verifyCaptcha, registerUser);
router.post('/register', authLimiter, verifyCaptcha, registerUser); // alias for backward compat
router.post('/login', authLimiter, verifyCaptcha, authUser);
router.post('/verify-email', authLimiter, verifyCaptcha, verifyEmail);
router.post('/forgot-password', authLimiter, verifyCaptcha, forgotPassword);
router.post('/reset-password', authLimiter, verifyCaptcha, resetPassword);
router.post('/resend-otp', authLimiter, resendOtp);

// Google Auth Route — uses its own limiter (Firebase validates token server-side, not brute-forceable)
router.post('/google', googleAuthLimiter, googleAuth);

// Session management
router.post('/refresh', refreshLimiter, refreshToken);
router.post('/logout', logoutUser);
router.post('/logout-all', protect, logoutAllSessions);
router.get('/session', protect, getCurrentSession);
router.get('/sessions', protect, getAllSessions);

// ==========================
// GITHUB OAUTH ROUTES
// ==========================

import { admin } from '../config/firebaseAdmin.js';

router.get('/github',
    async (req, res, next) => {
        try {
            const token = req.query.token;
            if (!token) {
                return res.status(401).json({ message: 'No token provided' });
            }

            // Verify Firebase Token
            const decodedToken = await admin.auth().verifyIdToken(token);
            const { email } = decodedToken;

            // Find user in DB to get _id
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const options = {
                scope: ['user:email', 'repo'],
                state: user._id.toString()
            };

            passport.authenticate('github', options)(req, res, next);
        } catch (error) {
            console.error("Token verification failed:", error.message);
            res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=token_failed`);
        }
    }
);

router.get('/github/callback',
    passport.authenticate('github', {
        failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=github_auth_failed`,
        session: false
    }),
    (req, res) => {
        res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/profile?github=success`);
    }
);

export default router;
