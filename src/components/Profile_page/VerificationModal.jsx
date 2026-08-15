import { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { FiMail, FiUpload, FiX, FiCheck, FiShield, FiAlertCircle, FiLoader } from 'react-icons/fi';

// ─── Small spinner helper ────────────────────────────────────
const Spinner = () => (
    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
);

// ─── Step indicator ──────────────────────────────────────────
const StepDot = ({ active, done }) => (
    <div className={`w-2 h-2 rounded-full transition-all ${done ? 'bg-sky-500' : active ? 'bg-sky-400 scale-125' : 'bg-gray-200'}`} />
);

export default function VerificationModal({ user, onClose, onVerified }) {
    const [tab, setTab] = useState('email'); // 'email' | 'id'

    // --- Email OTP state ---
    const [collegeEmail, setCollegeEmail] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState('');
    const [emailLoading, setEmailLoading] = useState(false);
    const [emailError, setEmailError] = useState('');

    // --- ID card state ---
    const [idFile, setIdFile] = useState(null);
    const [idPreview, setIdPreview] = useState('');
    const [idLoading, setIdLoading] = useState(false);
    const [idError, setIdError] = useState('');
    const fileRef = useRef(null);

    // ─── Email flow handlers ──────────────────────────────────
    const handleSendOtp = async () => {
        setEmailError('');
        if (!collegeEmail.includes('@')) {
            setEmailError('Please enter a valid college email address.');
            return;
        }
        setEmailLoading(true);
        try {
            const { data } = await api.post('/users/verify-email-start', { collegeEmail });
            toast.success(data.message || 'OTP sent!');
            setOtpSent(true);
        } catch (err) {
            setEmailError(err.response?.data?.message || 'Failed to send OTP. Please check your college email.');
        } finally {
            setEmailLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        setEmailError('');
        if (!otp || otp.length < 4) {
            setEmailError('Please enter the 6-digit OTP.');
            return;
        }
        setEmailLoading(true);
        try {
            const { data } = await api.post('/users/verify-email-otp', { otp });
            toast.success('🎉 You are now a Verified Student!');
            onVerified(data);
            onClose();
        } catch (err) {
            setEmailError(err.response?.data?.message || 'Invalid or expired OTP.');
        } finally {
            setEmailLoading(false);
        }
    };

    // ─── ID card flow handlers ────────────────────────────────
    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            setIdError('File too large. Maximum 5 MB allowed.');
            return;
        }
        setIdError('');
        setIdFile(file);
        setIdPreview(URL.createObjectURL(file));
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) {
            const fakeEvent = { target: { files: [file] } };
            handleFileChange(fakeEvent);
        }
    };

    const handleIdSubmit = async () => {
        setIdError('');
        if (!idFile) { setIdError('Please select an ID card image.'); return; }
        setIdLoading(true);
        try {
            const formData = new FormData();
            formData.append('idCard', idFile);
            const { data } = await api.post('/users/verify-id', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 60000, // 60s — Cloudinary can be slow on dev
            });
            setIdError(''); // clear any previous error
            toast.success('ID card submitted! Your request is under admin review.');
            onVerified(data);
            onClose();
        } catch (err) {
            const msg = err.response?.data?.message;
            if (msg) {
                setIdError(msg);
            } else if (err.code === 'ECONNABORTED') {
                setIdError('Upload timed out. Please try again with a smaller image.');
            } else {
                setIdError('Upload failed. Please check your connection and try again.');
            }
        } finally {
            setIdLoading(false);
        }
    };

    // ─── Modal content ────────────────────────────────────────
    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="relative px-6 pt-6 pb-4 border-b border-gray-100">
                    <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                        <FiX size={20} />
                    </button>
                    <div className="flex flex-col gap-1.5 pr-8">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <FiShield className="text-sky-500" />
                            Verify Student Status
                        </h2>
                        <p className="text-gray-500 text-sm">Choose a verification method below</p>
                    </div>
                </div>

                <div className="p-6">
                    {/* Tab Segmented Control */}
                    <div className="bg-gray-100/80 p-1 rounded-xl flex gap-1 mb-6">
                        <button
                            onClick={() => { setTab('email'); setEmailError(''); setIdError(''); }}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'email' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <FiMail size={16} /> College Email
                        </button>
                        <button
                            onClick={() => { setTab('id'); setEmailError(''); setIdError(''); }}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'id' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <FiUpload size={16} /> Upload ID Card
                        </button>
                    </div>
                    {/* ─── Email OTP Tab ─── */}
                    {tab === 'email' && (
                        <div className="space-y-4">
                            <div className="flex items-start gap-2 p-3 bg-sky-50 rounded-xl text-xs text-sky-700">
                                <FiCheck className="w-4 h-4 mt-0.5 shrink-0" />
                                <span>Enter your <strong>college email address</strong> (.edu, .ac.in, .ac.np etc.). An OTP will be sent to it. <strong>Approved instantly</strong> — no admin needed.</span>
                            </div>

                            {/* Step dots */}
                            <div className="flex items-center gap-2 px-1">
                                <StepDot active={!otpSent} done={otpSent} />
                                <div className="flex-1 h-px bg-gray-100" />
                                <StepDot active={otpSent} done={false} />
                            </div>

                            {!otpSent ? (
                                /* Step 1: Enter college email */
                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-gray-700">
                                        College Email Address <span className="text-red-400">*</span>
                                    </label>
                                    <div className="relative">
                                        <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input
                                            type="email"
                                            value={collegeEmail}
                                            onChange={e => { setCollegeEmail(e.target.value); setEmailError(''); }}
                                            onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                                            placeholder="you@college.ac.in"
                                            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
                                            autoFocus
                                        />
                                    </div>
                                    {emailError && (
                                        <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 p-2.5 rounded-lg">
                                            <FiAlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {emailError}
                                        </div>
                                    )}
                                    <button
                                        onClick={handleSendOtp}
                                        disabled={emailLoading || !collegeEmail}
                                        className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm shadow-sky-200"
                                    >
                                        {emailLoading ? <Spinner /> : <FiMail size={14} />}
                                        Send OTP
                                    </button>
                                </div>
                            ) : (
                                /* Step 2: Enter OTP */
                                <div className="space-y-3">
                                    <p className="text-xs text-gray-500">OTP sent to <strong className="text-gray-800">{collegeEmail}</strong>. Check your inbox (and spam folder).</p>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Enter 6-digit OTP <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={6}
                                            value={otp}
                                            onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setEmailError(''); }}
                                            onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()}
                                            placeholder="••••••"
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-center text-2xl font-bold tracking-[0.5em] focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
                                            autoFocus
                                        />
                                    </div>
                                    {emailError && (
                                        <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 p-2.5 rounded-lg">
                                            <FiAlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {emailError}
                                        </div>
                                    )}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => { setOtpSent(false); setOtp(''); setEmailError(''); }}
                                            className="px-4 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium transition-colors"
                                        >
                                            Back
                                        </button>
                                        <button
                                            onClick={handleVerifyOtp}
                                            disabled={emailLoading || otp.length < 6}
                                            className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            {emailLoading ? <Spinner /> : <FiCheck size={14} />}
                                            Verify
                                        </button>
                                    </div>
                                    <button
                                        onClick={handleSendOtp}
                                        disabled={emailLoading}
                                        className="w-full text-xs text-sky-600 hover:underline text-center py-1"
                                    >
                                        Resend OTP
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ─── ID Card Tab ─── */}
                    {tab === 'id' && (
                        <div className="space-y-4">
                            <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl text-xs text-amber-700">
                                <FiAlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                <span>Upload a photo of your <strong>college ID card</strong>. Your request will be reviewed by an admin within 24–48 hours.</span>
                            </div>

                            {/* Drop zone */}
                            <div
                                onDragOver={e => e.preventDefault()}
                                onDrop={handleDrop}
                                onClick={() => fileRef.current?.click()}
                                className="relative border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-sky-400 hover:bg-sky-50/30 transition-all group"
                            >
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                {idPreview ? (
                                    <div className="relative">
                                        <img src={idPreview} alt="ID preview" className="max-h-40 mx-auto rounded-lg object-contain shadow" />
                                        <div className="mt-2 text-xs text-gray-500">Click to change</div>
                                    </div>
                                ) : (
                                    <div className="space-y-2 pointer-events-none">
                                        <div className="w-12 h-12 mx-auto bg-gray-100 group-hover:bg-sky-100 rounded-xl flex items-center justify-center transition-colors">
                                            <FiUpload className="text-gray-400 group-hover:text-sky-500 w-5 h-5 transition-colors" />
                                        </div>
                                        <p className="text-sm font-medium text-gray-600">Drag & drop or click to upload</p>
                                        <p className="text-xs text-gray-400">JPG, PNG, WEBP — max 5 MB</p>
                                    </div>
                                )}
                            </div>

                            {idError && (
                                <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 p-2.5 rounded-lg">
                                    <FiAlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {idError}
                                </div>
                            )}

                            <button
                                onClick={handleIdSubmit}
                                disabled={idLoading || !idFile}
                                className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm shadow-sky-200"
                            >
                                {idLoading ? <Spinner /> : <FiUpload size={14} />}
                                Submit for Review
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
