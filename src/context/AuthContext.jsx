import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { setAccessToken, getAccessToken, refreshAccessToken } from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebaseClient';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Initial Load: Try silent refresh to restore session
    useEffect(() => {
        const loadUser = async () => {
            try {
                const token = await refreshAccessToken();
                if (token) {
                    const { data: userData } = await api.get('/users/me', { _skipAuthRedirect: true });
                    setCurrentUser(userData);
                } else {
                    setAccessToken(null);
                    setCurrentUser(null);
                }
            } catch (error) {
                // 401 simply means no existing login session — user is a guest
                if (error.response?.status !== 401) {
                    console.warn("[AuthContext] Boot session notice:", error.message || error);
                }
                setAccessToken(null);
                setCurrentUser(null);
            } finally {
                setLoading(false);
            }
        };
        loadUser();
    }, []);

    // Signup (no token issued — requires email verification)
    const signup = async (formData, captchaToken) => {
        const { data } = await api.post('/auth/signup', { ...formData, captchaToken });
        return data;
    };

    // Verify OTP — issues access token + refresh cookie
    const verifyOtp = async (email, otp, captchaToken) => {
        const { data } = await api.post('/auth/verify-email', { email, otp, captchaToken });
        setAccessToken(data.accessToken);
        setCurrentUser(data);
        return data;
    };

    // Login — issues access token + refresh cookie
    const login = async (email, password, captchaToken) => {
        const { data } = await api.post('/auth/login', { email, password, captchaToken });
        setAccessToken(data.accessToken);
        setCurrentUser(data);
        return data;
    };

    // Google Login — issues access token + refresh cookie
    const googleLogin = async () => {
        if (!auth) {
            throw new Error("Firebase is not configured. Please add VITE_FIREBASE_API_KEY in .env to use Google Login.");
        }
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const idToken = await result.user.getIdToken();

        const { data } = await api.post('/auth/google', { token: idToken });
        setAccessToken(data.accessToken);
        setCurrentUser(data);
        return data;
    };

    // Forgot Password
    const forgotPassword = async (email, captchaToken) => {
        const { data } = await api.post('/auth/forgot-password', { email, captchaToken });
        return data;
    };

    // Reset Password
    const resetPassword = async (token, newPassword, captchaToken) => {
        const { data } = await api.post('/auth/reset-password', { token, newPassword, captchaToken });
        return data;
    };

    // Logout current session
    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            // Ignore logout errors
        }
        setAccessToken(null);
        setCurrentUser(null);
    };

    // Logout all sessions
    const logoutAll = async () => {
        try {
            await api.post('/auth/logout-all');
        } catch (error) {
            // Ignore errors
        }
        setAccessToken(null);
        setCurrentUser(null);
    };

    const value = {
        currentUser,
        signup,
        verifyOtp,
        login,
        googleLogin,
        forgotPassword,
        resetPassword,
        logout,
        logoutAll,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
