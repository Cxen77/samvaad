import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * RoleRoute
 * Protects routes based on user role.
 * 
 * @param {Array} allowedRoles - List of roles allowed to access this route.
 */
const RoleRoute = ({ allowedRoles = [], children }) => {
    const { currentUser, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    if (currentUser.isSuspended) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-gray-800">
                <div className="text-6xl mb-4">🚫</div>
                <h1 className="text-2xl font-bold mb-2">Account Suspended</h1>
                <p>Your account has been suspended. Please contact support.</p>
            </div>
        );
    }

    // Strict check: if the user's role is not explicitly in the allowedRoles array, redirect them immediately to the /unauthorized panel.
    // No dynamic role switching, no silent fallbacks.
    if (!allowedRoles.includes(currentUser.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    // Since RoleRoute is acting as a wrapper for component children:
    return children ? children : <Outlet />;
};

export default RoleRoute;
