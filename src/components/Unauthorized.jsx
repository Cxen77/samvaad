import React from 'react';
import { Link } from 'react-router-dom';
import { FiShieldOff, FiArrowLeft } from 'react-icons/fi';

const Unauthorized = () => {
    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-6 animate-fade-in-up">

                {/* Icon Container */}
                <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-500/10 mb-2">
                    <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping opacity-20" />
                    <FiShieldOff className="w-10 h-10 text-red-500 relative z-10" />
                </div>

                {/* Content */}
                <div className="space-y-3">
                    <h1 className="text-3xl font-bold text-white tracking-tight">Access Denied</h1>
                    <p className="text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">
                        You do not have permission to access this panel. Your role prevents you from entering this restricted area.
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="pt-6">
                    <Link
                        to="/"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-slate-100 text-slate-900 font-semibold rounded-xl transition-all duration-200 hover:-translate-y-0.5"
                    >
                        <FiArrowLeft className="w-4 h-4" />
                        Return to Dashboard
                    </Link>
                </div>

                {/* Secure Badge */}
                <div className="pt-12 flex justify-center">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 uppercase tracking-widest px-3 py-1 bg-slate-900 border border-slate-800 rounded-full">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        Secure Zone
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Unauthorized;
