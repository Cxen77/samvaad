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
                // Use shared refreshAccessToken so it participates in the same lock
                // as the axios interceptor — prevents two simultaneous /auth/refresh calls
                console.log("[AuthContext] Attempting silent refresh payload on boot...");
                await refreshAccessToken();
                console.log("[AuthContext] Silent refresh success. Requesting /users/me...");

                // Now use the api instance (with token) to fetch user profile
                // Add _skipAuthRedirect to prevent the interceptor from immediately
                // kicking the user out if this specific check 401s
                const { data: userData } = await api.get('/users/me', { _skipAuthRedirect: true });
                console.log("[AuthContext] /users/me fetched successfully:", userData.email);
                setCurrentUser(userData);
            } catch (error) {
                console.error("[AuthContext] Boot session failed:", error.message || error);
                // No valid session — user needs to login (this is expected)
                setAccessToken(null);
                setCurrentUser(null);
            }
            setLoading(false);
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
