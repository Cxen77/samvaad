import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import Session from '../models/Session.js';
import { generateAccessToken, generateRefreshToken, hashRefreshToken } from '../utils/generateToken.js';
import { createSession, clearSessionCookie, setRefreshCookie } from '../utils/sessionHelpers.js';
import generateOTP from '../utils/generateOTP.js';
import sendEmail, { sendEmailAsync } from '../utils/sendEmail.js';
import { validatePassword } from '../utils/validation.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { admin } from '../config/firebaseAdmin.js';

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
        if (!user.isEmailVerified) {
            res.status(403);
            throw new Error('Email not verified. Please verify your email.');
        }

        // Generate access token
        const accessToken = generateAccessToken(user._id);

        // Create session + set refresh cookie
        await createSession(user._id, req, res);

        res.json({
            _id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            profilePic: user.profilePic,
            isEmailVerified: user.isEmailVerified,
            accessToken
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, password, course, year, bio, skills, socials } = req.body;
    const email = req.body.email?.trim().toLowerCase();
    const username = req.body.username?.trim().toLowerCase();

    // 1. Validate Password Strength
    if (!validatePassword(password)) {
        res.status(400);
        throw new Error('Password must be at least 8 characters and include uppercase, lowercase, number, and special character.');
    }

    // 2. Check Exists
    const userExists = await User.findOne({ email });

    if (userExists) {
        if (userExists.isEmailVerified) {
            res.status(400);
            throw new Error('User already exists');
        } else {
            // User exists but NOT verified — Overwrite/Resend OTP
            userExists.name = name;
            userExists.username = username;
            userExists.password = password;
            userExists.course = course;
            userExists.year = year;
            userExists.bio = bio;
            userExists.skills = skills;
            userExists.socials = socials;

            const otp = generateOTP();
            userExists.otpHash = await bcrypt.hash(otp, 10);
            userExists.otpExpiresAt = Date.now() + 10 * 60 * 1000;

            await userExists.save();

            // Fire-and-forget — don't block the response
            sendEmailAsync({
                email: userExists.email,
                subject: 'Your Verification Code - SYNAPSE',
                message: `Your verification code is: ${otp}. It expires in 10 minutes.`
            });

            return res.status(200).json({
                message: 'Registration successful. Please verify your email.',
                requiresVerification: true,
                email: userExists.email
            });
        }
    }

    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
        res.status(400);
        throw new Error('Username already taken');
    }

    // 3. Generate OTP
    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpiresAt = Date.now() + 10 * 60 * 1000;

    // 4. Create User
    const user = await User.create({
        name,
        username,
        email,
        password,
        course,
        year,
        bio,
        skills,
        socials,
        otpHash,
        otpExpiresAt,
        isEmailVerified: false
    });

    // 5. Send OTP Email (fire-and-forget — don't block response)
    sendEmailAsync({
        email: user.email,
        subject: 'Your Verification Code - SYNAPSE',
        message: `Your verification code is: ${otp}. It expires in 10 minutes.`
    });

    if (user) {
        res.status(201).json({
            message: 'Registration successful. Please verify your email.',
            requiresVerification: true,
            email: user.email
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Verify OTP
// @route   POST /api/auth/verify-email
// @access  Public
const verifyEmail = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (user.isEmailVerified) {
        return res.status(400).json({ message: 'Email already verified' });
    }

    // Check Lockout
    if (user.otpLockUntil && user.otpLockUntil > Date.now()) {
        res.status(429);
        throw new Error('Too many failed attempts. Please try again later.');
    }

    // Check Expiry
    if (user.otpExpiresAt < Date.now()) {
        res.status(400);
        throw new Error('OTP expired. Please request a new one.');
    }

    // Verify Hash
    const isMatch = await bcrypt.compare(otp, user.otpHash);

    if (!isMatch) {
        user.otpAttempts += 1;
        if (user.otpAttempts >= 5) {
            user.otpLockUntil = Date.now() + 15 * 60 * 1000;
            user.otpAttempts = 0;
        }
        await user.save();
        res.status(400);
        throw new Error('Invalid OTP');
    }

    // Success
    user.isEmailVerified = true;
    user.otpHash = undefined;
    user.otpExpiresAt = undefined;
    user.otpAttempts = 0;
    user.otpLockUntil = undefined;
    await user.save();

    // Generate access token + session
    const accessToken = generateAccessToken(user._id);
    await createSession(user._id, req, res);

    res.json({
        message: 'Email verified successfully',
        _id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: true,
        accessToken
    });
});

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        return res.json({ message: 'If a user with that email exists, a reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Password Reset Request',
            message: `You requested a password reset. Click here to reset: ${resetUrl}`
        });
        res.json({ message: 'If a user with that email exists, a reset link has been sent.' });
    } catch (err) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        res.status(500);
        throw new Error('Email could not be sent');
    }
});

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;

    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
        resetPasswordToken: resetTokenHash,
        resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
        res.status(400);
        throw new Error('Invalid or expired token');
    }

    if (!validatePassword(newPassword)) {
        res.status(400);
        throw new Error('Password must be at least 8 characters and include uppercase, lowercase, number, and special character.');
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Invalidate all existing sessions on password reset
    await Session.deleteMany({ userId: user._id });

    res.json({ message: 'Password reset successful. You can now login.' });
});

// @desc    Google Auth (Verify Firebase Token & Login/Register)
// @route   POST /api/auth/google
// @access  Public
const googleAuth = asyncHandler(async (req, res) => {
    const { token } = req.body;

    if (!token) {
        res.status(400);
        throw new Error('No token provided');
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        const { email, name, picture, uid } = decodedToken;

        let user = await User.findOne({ email });

        if (user) {
            if (!user.firebaseUid) {
                user.firebaseUid = uid;
                await user.save();
            }
            if (!user.isEmailVerified) {
                user.isEmailVerified = true;
                await user.save();
            }
        } else {
            const randomPassword = crypto.randomBytes(16).toString('hex') + 'A1!';

            user = await User.create({
                name: name || 'Google User',
                username: email.split('@')[0] + Math.random().toString(36).slice(-4),
                email,
                password: randomPassword,
                profilePic: picture,
                firebaseUid: uid,
                isEmailVerified: true
            });
        }

        // Generate access token + session
        const accessToken = generateAccessToken(user._id);
        await createSession(user._id, req, res);

        res.json({
            _id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            profilePic: user.profilePic,
            isEmailVerified: true,
            accessToken
        });

    } catch (error) {
        console.error('Google Auth Error:', error.message);
        res.status(401);
        throw new Error('Invalid Google Token');
    }
});

// @desc    Refresh access token (with rotation)
// @route   POST /api/auth/refresh
// @access  Public (cookie required)
const refreshToken = asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken;

    if (!token) {
        res.status(401);
        throw new Error('No refresh token provided');
    }

    const hashedToken = hashRefreshToken(token);

    // Find the session with this refresh token
    const session = await Session.findOne({
        refreshTokenHash: hashedToken,
        isActive: true,
        expiresAt: { $gt: new Date() }
    });

    if (!session) {
        // REUSE DETECTION: Token not found means it was already rotated
        // Someone is replaying an old token — invalidate ALL sessions for safety
        // Try to decode the token to find the user (best effort)
        // Since we can't decode a random token, we clear the cookie and reject
        clearSessionCookie(res);
        res.status(401);
        throw new Error('Invalid refresh token. Please login again.');
    }

    // ROTATION: Delete the old session
    await Session.deleteById ? await session.deleteOne() : await Session.findByIdAndDelete(session._id);

    // Create a new session with a new refresh token
    const accessToken = generateAccessToken(session.userId);
    await createSession(session.userId, req, res);

    res.json({ accessToken });
});

// @desc    Logout current session
// @route   POST /api/auth/logout
// @access  Public (cookie required)
const logoutUser = asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken;

    if (token) {
        const hashedToken = hashRefreshToken(token);
        await Session.findOneAndDelete({ refreshTokenHash: hashedToken });
    }

    clearSessionCookie(res);
    res.status(200).json({ message: 'Logged out successfully' });
});

// @desc    Logout all sessions
// @route   POST /api/auth/logout-all
// @access  Private (requires access token)
const logoutAllSessions = asyncHandler(async (req, res) => {
    await Session.deleteMany({ userId: req.user._id });
    clearSessionCookie(res);
    res.status(200).json({ message: 'All sessions logged out successfully' });
});

// @desc    Get current session details
// @route   GET /api/auth/session
// @access  Private (requires access token)
const getCurrentSession = asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken;

    if (!token) {
        return res.json({ session: null });
    }

    const hashedToken = hashRefreshToken(token);
    const session = await Session.findOne({
        refreshTokenHash: hashedToken,
        isActive: true
    }).select('ipAddress userAgent createdAt expiresAt');

    res.json({ session });
});

// @desc    Get all active sessions for user
// @route   GET /api/auth/sessions
// @access  Private (requires access token)
const getAllSessions = asyncHandler(async (req, res) => {
    const sessions = await Session.find({
        userId: req.user._id,
        isActive: true,
        expiresAt: { $gt: new Date() }
    }).select('ipAddress userAgent createdAt expiresAt').sort({ createdAt: -1 });

    res.json({ sessions });
});

// @desc    Resend OTP (max 3 per day)
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOtp = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.isEmailVerified) {
        return res.json({ message: 'If the email is valid, a new code has been sent.' });
    }

    // Daily resend limit (3 per day)
    const now = new Date();
    const resendCount = user.otpResendCount || 0;
    const resendResetAt = user.otpResendResetAt ? new Date(user.otpResendResetAt) : null;

    // Reset counter if 24h have passed
    if (!resendResetAt || now > resendResetAt) {
        user.otpResendCount = 0;
    }

    if (user.otpResendCount >= 3) {
        res.status(429);
        throw new Error('Maximum 3 resends per day. Please try again tomorrow.');
    }

    const otp = generateOTP();
    user.otpHash = await bcrypt.hash(otp, 10);
    user.otpExpiresAt = Date.now() + 10 * 60 * 1000;
    user.otpAttempts = 0;
    user.otpLockUntil = undefined;
    user.otpResendCount = (user.otpResendCount || 0) + 1;
    if (!resendResetAt || now > resendResetAt) {
        user.otpResendResetAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
    await user.save();

    // Fire-and-forget — don't block the response
    sendEmailAsync({
        email: user.email,
        subject: 'Your Verification Code - SYNAPSE',
        message: `Your verification code is: ${otp}. It expires in 10 minutes.`
    });

    const remaining = 3 - user.otpResendCount;
    res.json({ message: 'If the email is valid, a new code has been sent.', resendsRemaining: remaining });
});

export {
    authUser,
    registerUser,
    verifyEmail,
    forgotPassword,
    resetPassword,
    logoutUser,
    logoutAllSessions,
    refreshToken,
    getCurrentSession,
    getAllSessions,
    googleAuth,
    resendOtp
};
