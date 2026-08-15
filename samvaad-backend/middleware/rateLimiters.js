import rateLimit from 'express-rate-limit';

// Global Limiter - Prevent DDoS / Heavy Spam
export const globalLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 1000, // Limit each IP to 1000 requests per window
    message: { message: 'Too many requests from this IP, please try again after 10 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Auth Limiter - Prevent Brute Force Attacks on Login/Register
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per window (strict!)
    message: { message: 'Too many login attempts, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Search Limiter - Prevent Scraping
export const searchLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 50, // 50 searches per minute is generous for human, hard for scraper
    message: { message: 'Search query limit exceeded, please slow down' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Standard API Limiter - For general data fetching
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300,
    message: { message: 'API rate limit exceeded' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Refresh Token Limiter - Prevent token abuse
export const refreshLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // Allow reasonable refresh attempts (silent refresh fires often)
    message: { message: 'Too many refresh attempts, please login again' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Google Auth Limiter - More lenient since token is validated server-side by Firebase
export const googleAuthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 requests per window -- generous for normal use
    message: { message: 'Too many Google auth attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Role Assignment Limiter - Prevent mass role changes (Security)
export const roleLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: { message: 'To many role assignment attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Scan Attendance Limiter - Allow rapid scanning at events (60/min per IP)
export const scanLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60,
    message: { message: 'Scan rate limit exceeded, please slow down' },
    standardHeaders: true,
    legacyHeaders: false,
});
