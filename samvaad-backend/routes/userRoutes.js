import express from 'express';

import {
    getUserProfile,
    updateUserProfile,
    updateProfilePic,
    updateBannerPic,
    getUserByUsername,
    followUser,
    searchUsers,
    getUserStats,
    deleteUser,
    getRecommendedUsers,
    getOnlineUsers,
    getGithubRepos,
    disconnectGithub,
    getGithubStats,
    startEmailVerification,
    verifyCollegeEmailOtp,
    submitIdVerification,
    searchUsersDirectory,
    addContact,
    removeContact,
    getContacts,
    savePublicKey,
    getUserPublicKey
} from '../controllers/userController.js';
import { updatePushToken } from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

import upload from '../middleware/uploadMiddleware.js';
import { searchLimiter } from '../middleware/rateLimiters.js';

router.get('/me', protect, (req, res) => {
    res.json(req.user);
});

router.put('/pushtoken', protect, updatePushToken);

// User Directory & Contacts
router.get('/directory', protect, searchUsersDirectory);
router.get('/contacts', protect, getContacts);
router.post('/contacts/:contactId', protect, addContact);
router.delete('/contacts/:contactId', protect, removeContact);

// E2EE Public Key
router.put('/public-key', protect, savePublicKey);
router.get('/:userId/public-key', protect, getUserPublicKey);

router.route('/profile').get(protect, getUserProfile).put(protect, updateUserProfile).delete(protect, deleteUser);
router.route('/profile-pic').put(protect, upload.single('profilePic'), updateProfilePic);
router.route('/banner-pic').put(protect, upload.single('bannerPic'), updateBannerPic);
router.route('/search').get(protect, searchLimiter, searchUsers);
router.route('/recommended').get(protect, getRecommendedUsers);
router.route('/online').get(protect, getOnlineUsers);
router.route('/github/repos').get(protect, getGithubRepos);
router.delete('/github', protect, disconnectGithub);
// Student verification routes
router.post('/verify-email-start', protect, startEmailVerification);
router.post('/verify-email-otp', protect, verifyCollegeEmailOtp);
router.post('/verify-id', protect, upload.single('idCard'), submitIdVerification);

// Public routes (or semi-public)
router.get('/:id/stats', getUserStats);
router.get('/:id/github/stats', getGithubStats);
router.get('/:username', getUserByUsername);
router.put('/:id/follow', protect, followUser);

export default router;
