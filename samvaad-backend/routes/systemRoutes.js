import express from 'express';
import SystemSettings from '../models/SystemSettings.js';

const router = express.Router();

/**
 * @route   GET /api/system/features
 * @desc    Public endpoint — returns feature flags for frontend UI control
 * @access  Public (no auth required)
 */
router.get('/features', async (req, res) => {
    try {
        const settings = await SystemSettings.getSettings();
        res.json({ features: settings.getFeaturesObject() });
    } catch (err) {
        console.error('[System] Failed to fetch features:', err.message);
        res.status(500).json({ message: 'Failed to load features' });
    }
});

export default router;
