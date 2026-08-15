import React from 'react';
import { useFeature } from '../../context/FeatureContext';
import { Navigate } from 'react-router-dom';

/**
 * FeatureGate
 * 
 * A universal kill switch wrapper. Checks the global FeatureContext.
 * If the feature is disabled (hardDisable = true on backend), this component
 * instantly removes its child components from the DOM.
 * 
 * @param {string} featureKey - The dictionary key from SystemSettings (e.g. 'forum')
 * @param {ReactNode} fallback - Optional component to render if disabled (e.g. a Navigate component for routes)
 */
export default function FeatureGate({ children, featureKey, fallback = null }) {
    const feature = useFeature(featureKey);

    // Completely block rendering if the feature is explicitly killed globally.
    // We do NOT check rolesAllowed here since backend enforces roles logic, 
    // we strictly block the entire feature if the admin toggled it completely OFF via the Kill Switch.
    if (!feature || feature.isKilled === true) {
        return fallback;
    }

    return <>{children}</>;
}
