import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Lock, Eye, EyeOff } from 'lucide-react';
import TurnstileWidget from './TurnstileWidget';

const PasswordStrengthMeter = ({ password }) => {
    const checks = useMemo(() => ({
        length: password.length >= 8,
        upper: /[A-Z]/.test(password),
        lower: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[\W_]/.test(password),
    }), [password]);

    const score = Object.values(checks).filter(Boolean).length;
    const percent = (score / 5) * 100;
    const color = score <= 1 ? "bg-red-500" : score <= 3 ? "bg-yellow-500" : score === 4 ? "bg-sky-500" : "bg-emerald-500";
    const label = score <= 1 ? "Weak" : score <= 3 ? "Fair" : score === 4 ? "Strong" : "Very Strong";

    if (!password) return null;

    return (
        <div className="mt-2.5 space-y-2">
            <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${percent}%` }} />
                </div>
                <span className="text-xs font-medium text-gray-500 min-w-[64px] text-right">{label}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                {[
                    ["8+ characters", checks.length],
                    ["Uppercase", checks.upper],
                    ["Lowercase", checks.lower],
                    ["Number", checks.number],
                    ["Special char", checks.special],
                ].map(([text, ok]) => (
                    <span key={text} className={`text-[11px] flex items-center gap-1.5 ${ok ? "text-emerald-600" : "text-gray-400"}`}>
                        <span className={`inline-block w-1 h-1 rounded-full ${ok ? "bg-emerald-500" : "bg-gray-300"}`} />
                        {text}
                    </span>
                ))}
            </div>
        </div>
    );
};

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [captchaToken, setCaptchaToken] = useState("");
    const [captchaResetKey, setCaptchaResetKey] = useState(0);
    const [loading, setLoading] = useState(false);
    const { resetPassword } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (!captchaToken) {
            toast.error("Please complete the CAPTCHA.");
            return;
        }

        setLoading(true);

        try {
            await resetPassword(token, newPassword, captchaToken);
            toast.success("Password reset successfully! Please login.");
            navigate('/login');
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to reset password. Link may be expired.");
            setCaptchaToken("");
            setCaptchaResetKey(prev => prev + 1);
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50/50 px-4" style={{ fontFamily: "'Inter', sans-serif" }}>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center max-w-sm">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-red-50 border border-red-100 mb-4">
                        <Lock className="w-6 h-6 text-red-500" />
                    </div>
                    <p className="text-gray-900 font-semibold mb-2">Invalid Reset Link</p>
                    <p className="text-gray-500 text-sm mb-4">The token is missing or malformed. Please request a new link.</p>
                    <Link to="/forgot-password" className="text-sky-600 hover:text-sky-700 text-sm font-medium transition-colors">
                        Request New Link
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50/50 px-4 py-8 sm:py-12" style={{ fontFamily: "'Inter', sans-serif" }}>
            {/* Subtle decorative blobs */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-sky-100/40 blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-violet-100/30 blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

            <div className="w-full max-w-md animate-fade-in-up relative z-10">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-50 border border-sky-100 mb-5">
                            <Lock className="w-8 h-8 text-sky-600" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-2">Reset Password</h1>
                        <p className="text-gray-500 text-sm">Choose a strong, unique password</p>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="relative">
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">New Password</label>
                            <input
                                type={showPassword ? "text" : "password"}
                                className="w-full px-4 py-2.5 pr-11 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-all text-sm"
                                placeholder="Min 8 chars, mixed case + number"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-[34px] text-gray-400 hover:text-sky-600 transition-colors"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                            <PasswordStrengthMeter password={newPassword} />
                        </div>

                        <div className="relative">
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Confirm Password</label>
                            <input
                                type={showConfirm ? "text" : "password"}
                                className={`w-full px-4 py-2.5 pr-11 rounded-xl bg-gray-50 border text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all text-sm ${confirmPassword && confirmPassword !== newPassword
                                        ? "border-red-300 focus:ring-red-500/30"
                                        : confirmPassword && confirmPassword === newPassword
                                            ? "border-emerald-300 focus:ring-emerald-500/30"
                                            : "border-gray-200 focus:ring-sky-500/30 focus:border-sky-400"
                                    }`}
                                placeholder="Type your password again"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-[34px] text-gray-400 hover:text-sky-600 transition-colors"
                                onClick={() => setShowConfirm(!showConfirm)}
                                tabIndex={-1}
                            >
                                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                            {confirmPassword && confirmPassword !== newPassword && (
                                <p className="text-red-500 text-xs mt-1.5">Passwords don't match</p>
                            )}
                        </div>

                        <TurnstileWidget key={captchaResetKey} onVerify={setCaptchaToken} />

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 mt-1 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                    Resetting...
                                </span>
                            ) : "Reset Password"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
