import jwt from 'jsonwebtoken';
import crypto from 'crypto';

/**
 * Generate a short-lived access token (15 minutes)
 */
const generateAccessToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: '15m'
    });
};

/**
 * Generate a random 64-byte refresh token
 */
const generateRefreshToken = () => {
    return crypto.randomBytes(64).toString('hex');
};

/**
 * Hash a refresh token using SHA-256
 * Never store raw refresh tokens in the database
 */
const hashRefreshToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

export { generateAccessToken, generateRefreshToken, hashRefreshToken };
