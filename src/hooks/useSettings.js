import { useState, useCallback } from 'react';
import api from '../api/axios';
import { useToast } from '../components/common/Toast';

const useSettings = (user, setUser) => {
    const [loading, setLoading] = useState(false);
    const { addToast } = useToast();

    const updateSettings = useCallback(async (endpoint, payload, successMessage = "Settings updated successfully") => {
        setLoading(true);
        try {
            const { data } = await api.put(endpoint, payload);
            setUser(data);
            addToast(successMessage, 'success');
            return true;
        } catch (err) {
            console.error("Settings update failed", err);
            const errorMsg = err.response?.data?.message || "Failed to update settings. Please try again.";
            addToast(errorMsg, 'error');
            return false;
        } finally {
            setLoading(false);
        }
    }, [setUser, addToast]);

    return {
        updateSettings,
        loading
    };
};

export default useSettings;
