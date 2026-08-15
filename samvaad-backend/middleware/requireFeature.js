import SystemSettings from '../models/SystemSettings.js';

/**
 * @middleware requireFeature(featureKey)
 * @desc      Blocks access to a route if the feature flag is disabled or the user's role is not in rolesAllowed.
 *            Backend-only enforcement — does NOT rely on frontend hiding.
 * @usage     router.post('/...', protect, requireFeature('forum'), handler)
 */
const requireFeature = (featureKey) => async (req, res, next) => {
    try {
        const settings = await SystemSettings.getSettings();
        const feature = settings.features.get(featureKey);

        // Feature not found in settings — block access defensively
        if (!feature) {
            res.status(403);
            return next(new Error(`Feature "${featureKey}" is not configured`));
        }

        // Feature is fully killed globally
        if (feature.isKilled) {
            res.status(403);
            return next(new Error(`Feature "${featureKey}" has been globally removed by administrators`));
        }

        // Feature is disabled globally (soft disable)
        if (!feature.enabled) {
            res.status(403);
            return next(new Error(`Feature "${featureKey}" is currently disabled`));
        }

        // If rolesAllowed is defined and non-empty, check user's role
        if (feature.rolesAllowed && feature.rolesAllowed.length > 0) {
            const userRole = req.user?.role;
            if (!userRole || !feature.rolesAllowed.includes(userRole)) {
                res.status(403);
                return next(new Error(`Your role does not have access to feature "${featureKey}"`));
            }
        }

        next();
    } catch (err) {
        next(err);
    }
};

export default requireFeature;
