import axios from 'axios';
import asyncHandler from 'express-async-handler';

// Middleware to verify Cloudflare Turnstile CAPTCHA
const verifyCaptcha = asyncHandler(async (req, res, next) => {
    const token = req.body.captchaToken;

    // Skip in Development if configured or if no secret key is configured
    if ((process.env.NODE_ENV === 'development' && process.env.SKIP_CAPTCHA === 'true') || (!process.env.TURNSTILE_SECRET_KEY && process.env.NODE_ENV !== 'production')) {
        return next();
    }

    if (!token) {
        res.status(400);
        throw new Error('CAPTCHA token is missing.');
    }

    try {
        const secretKey = process.env.TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000AA';
        const response = await axios.post(
            'https://challenges.cloudflare.com/turnstile/v0/siteverify',
            {
                secret: secretKey,
                response: token,
                remoteip: req.ip
            },
            {
                headers: { 'Content-Type': 'application/json' }
            }
        );

        const data = response.data;

        if (!data.success) {
            res.status(400);
            throw new Error('CAPTCHA verification failed.');
        }

        next();
    } catch (error) {
        console.error('CAPTCHA Error:', error.message);
        res.status(400);
        throw new Error('CAPTCHA verification failed or service unavailable.');
    }
});

export default verifyCaptcha;
