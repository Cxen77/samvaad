import express from 'express';
import SystemSettings, { DEFAULT_FEATURES } from '../models/SystemSettings.js';
import mongoose from 'mongoose';

const router = express.Router();

/**
 * @route   GET /api/system/features
 * @desc    Public endpoint — returns feature flags for frontend UI control
 * @access  Public (no auth required)
 */
router.get('/features', async (req, res) => {
    try {
        if (mongoose.connection.readyState === 1) {
            const settings = await SystemSettings.getSettings();
            return res.json({ features: settings.getFeaturesObject() });
        }
        // Fallback if DB is disconnected (e.g. initial dev setup)
        return res.json({ features: DEFAULT_FEATURES });
    } catch (err) {
        console.warn('[System] Database unavailable, falling back to default features:', err.message);
        return res.json({ features: DEFAULT_FEATURES });
    }
});

export default router;
