import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { KeyRound, ArrowLeft, CheckCircle } from 'lucide-react';
import TurnstileWidget from './TurnstileWidget';

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [captchaToken, setCaptchaToken] = useState("");
    const [captchaResetKey, setCaptchaResetKey] = useState(0);
    const { forgotPassword } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!captchaToken) {
            toast.error("Please complete the CAPTCHA.");
            return;
        }

        setLoading(true);

        try {
            await forgotPassword(email, captchaToken);
            setSent(true);
            toast.success("Password reset link sent!");
        } catch (error) {
            toast.error("Failed to send reset link. Please try again.");
            setCaptchaToken("");
            setCaptchaResetKey(prev => prev + 1);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50/50 px-4 py-8 sm:py-12" style={{ fontFamily: "'Inter', sans-serif" }}>
            {/* Subtle decorative blobs */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-sky-100/40 blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-violet-100/30 blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

            <div className="w-full max-w-md animate-fade-in-up relative z-10">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
                    {sent ? (
                        /* Success State */
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 mb-5">
                                <CheckCircle className="w-8 h-8 text-emerald-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h1>
                            <p className="text-gray-500 text-sm mb-6">
                                If an account exists for{" "}
                                <span className="font-semibold text-gray-900">{email}</span>,
                                we've sent a password reset link.
                            </p>
                            <Link
                                to="/login"
                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl shadow-sm transition-all duration-200 text-sm"
                            >
                                Back to Login
                            </Link>
                        </div>
                    ) : (
                        /* Form State */
                        <>
                            <div className="text-center mb-6">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-50 border border-sky-100 mb-5">
                                    <KeyRound className="w-8 h-8 text-sky-600" />
                                </div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-2">Forgot Password?</h1>
                                <p className="text-gray-500 text-sm">No worries, we'll send you a reset link.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Email Address</label>
                                    <input
                                        type="email"
                                        className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-all text-sm"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>

                                <TurnstileWidget key={captchaResetKey} onVerify={setCaptchaToken} />

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                            Sending...
                                        </span>
                                    ) : "Send Reset Link"}
                                </button>
                            </form>

                            <div className="mt-6 text-center">
                                <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                    Back to Login
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
