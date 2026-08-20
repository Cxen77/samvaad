import Session from '../models/Session.js';
import { generateRefreshToken, hashRefreshToken } from './generateToken.js';

const MAX_SESSIONS_PER_USER = 5;
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

/**
 * Create a new session and set the refresh token cookie.
 * Enforces max session limit per user (oldest removed first).
 * Returns the raw refresh token (for setting in cookie).
 */
const createSession = async (userId, req, res) => {
    // Generate refresh token
    const rawRefreshToken = generateRefreshToken();
    const hashedToken = hashRefreshToken(rawRefreshToken);

    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    // Enforce max sessions — remove oldest if limit exceeded
    const activeSessions = await Session.find({ userId, isActive: true }).sort({ createdAt: 1 });
    if (activeSessions.length >= MAX_SESSIONS_PER_USER) {
        const sessionsToRemove = activeSessions.slice(0, activeSessions.length - MAX_SESSIONS_PER_USER + 1);
        await Session.deleteMany({ _id: { $in: sessionsToRemove.map(s => s._id) } });
    }

    // Create session
    await Session.create({
        userId,
        refreshTokenHash: hashedToken,
        ipAddress: req.ip || req.connection?.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        expiresAt
    });

    // Set cookie
    setRefreshCookie(res, rawRefreshToken, req);

    return rawRefreshToken;
};

/**
 * Set the refresh token as an HTTP-only secure cookie.
 */
const setRefreshCookie = (res, token, req = null) => {
    const isHttps = req?.secure || req?.headers?.['x-forwarded-proto'] === 'https';
    const isRemote = req?.headers?.host ? !req.headers.host.includes('localhost') : true;
    const isProduction = process.env.NODE_ENV === 'production' || isHttps || isRemote;

    res.cookie('refreshToken', token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax', // 'none' is required for cross-origin deployments (e.g. Vercel/Render)
        path: '/',
        maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000 // 7 days in ms
    });
};

/**
 * Clear the refresh token cookie.
 */
const clearSessionCookie = (res, req = null) => {
    const isHttps = req?.secure || req?.headers?.['x-forwarded-proto'] === 'https';
    const isRemote = req?.headers?.host ? !req.headers.host.includes('localhost') : true;
    const isProduction = process.env.NODE_ENV === 'production' || isHttps || isRemote;

    res.cookie('refreshToken', '', {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        path: '/',
        expires: new Date(0)
    });
};

export { createSession, setRefreshCookie, clearSessionCookie };
