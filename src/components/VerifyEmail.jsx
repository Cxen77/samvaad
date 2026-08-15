import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Mail, RotateCcw } from 'lucide-react';
import TurnstileWidget from './TurnstileWidget';
import api from '../api/axios';

const VerifyEmail = () => {
    const { verifyOtp, currentUser } = useAuth();
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [email, setEmail] = useState("");
    const [captchaToken, setCaptchaToken] = useState("");
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [captchaResetKey, setCaptchaResetKey] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();
    const inputRefs = useRef([]);

    useEffect(() => {
        if (location.state?.email) {
            setEmail(location.state.email);
        } else if (currentUser?.email) {
            setEmail(currentUser.email);
        }
    }, [location, currentUser]);

    useEffect(() => {
        if (currentUser?.isEmailVerified) {
            navigate('/');
        }
    }, [currentUser, navigate]);

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    const handleOtpChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        const pasted = e.clipboardData.getData("text").trim().slice(0, 6);
        if (/^\d+$/.test(pasted)) {
            const newOtp = [...otp];
            pasted.split("").forEach((char, i) => { newOtp[i] = char; });
            setOtp(newOtp);
            inputRefs.current[Math.min(pasted.length, 5)]?.focus();
            e.preventDefault();
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        const otpString = otp.join("");
        if (otpString.length < 6) {
            toast.error("Please enter the complete 6-digit code.");
            return;
        }
        if (!captchaToken) {
            toast.error("Please complete the CAPTCHA.");
            return;
        }
        setLoading(true);
        try {
            await verifyOtp(email, otpString, captchaToken);
            toast.success("Email verified successfully!");
            navigate('/');
        } catch (error) {
            toast.error(error.response?.data?.message || "Verification failed. Invalid OTP.");
            setCaptchaToken("");
            setCaptchaResetKey(prev => prev + 1);
        } finally {
            setLoading(false);
        }
    };

    const [resendsRemaining, setResendsRemaining] = useState(3);

    const handleResendOtp = async () => {
        if (resendCooldown > 0 || !email) return;
        setResending(true);
        try {
            const { data } = await api.post('/auth/resend-otp', { email });
            toast.success("New verification code sent!");
            setResendCooldown(60);
            setOtp(["", "", "", "", "", ""]);
            inputRefs.current[0]?.focus();
            if (data.resendsRemaining !== undefined) {
                setResendsRemaining(data.resendsRemaining);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to resend code.");
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50/50 px-4 py-8 sm:py-12" style={{ fontFamily: "'Inter', sans-serif" }}>
            {/* Subtle decorative blobs */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-sky-100/40 blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-violet-100/30 blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

            <div className="w-full max-w-md animate-fade-in-up relative z-10">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 text-center">
                    {/* Icon */}
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-50 border border-sky-100 mb-5">
                        <Mail className="w-8 h-8 text-sky-600" />
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-2">Verify Your Email</h1>
                    <p className="text-gray-500 text-sm mb-6">
                        Enter the 6-digit code sent to{" "}
                        <span className="font-semibold text-gray-900">{email || "your email"}</span>
                    </p>

                    <form onSubmit={handleVerify} className="flex flex-col gap-5">
                        {/* OTP Boxes */}
                        <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={el => inputRefs.current[index] = el}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-all"
                                />
                            ))}
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
                                    Verifying...
                                </span>
                            ) : "Verify Email"}
                        </button>
                    </form>

                    {/* Resend */}
                    <div className="mt-5 space-y-1">
                        <button
                            onClick={handleResendOtp}
                            disabled={resending || resendCooldown > 0 || resendsRemaining <= 0}
                            className="inline-flex items-center gap-1.5 text-sm text-sky-600 hover:text-sky-700 font-medium transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            {resendCooldown > 0
                                ? `Resend in ${resendCooldown}s`
                                : resendsRemaining <= 0
                                    ? "Daily limit reached"
                                    : resending ? "Sending..." : "Resend Code"}
                        </button>
                        {resendsRemaining < 3 && resendsRemaining > 0 && (
                            <p className="text-xs text-gray-400">{resendsRemaining} resend{resendsRemaining > 1 ? 's' : ''} left today</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
