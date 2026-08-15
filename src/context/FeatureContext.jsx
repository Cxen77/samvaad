import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const FeatureContext = createContext({});

/**
 * FeatureProvider
 * Fetches feature flags from /api/admin/settings and exposes them
 * to the entire component tree. Non-admin users will receive a 403
 * from this endpoint, so we gracefully default to an empty feature
 * map (all features treated as enabled/visible from the UI perspective).
 */
export function FeatureProvider({ children }) {
    const [features, setFeatures] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                // Use the public /api/system/features endpoint 
                // so ALL users (guest and logged-in) get the kill-switch configs.
                const { data } = await api.get('/system/features');
                setFeatures(data.features || {});
            } catch (err) {
                console.error('[FeatureProvider] Failed to load features', err);
                setFeatures({});
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    return (
        <FeatureContext.Provider value={{ features, loading }}>
            {children}
        </FeatureContext.Provider>
    );
}

/**
 * useFeature(key)
 * Returns { enabled, rolesAllowed } for the given feature flag key.
 * Defaults to { enabled: true } if the feature is not found (fail-open on frontend).
 */
export function useFeature(key) {
    const { features } = useContext(FeatureContext);
    if (!key || !features[key]) return { enabled: true, isKilled: false, rolesAllowed: [] };
    return features[key];
}

export default FeatureContext;
