import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { X, QrCode, RefreshCw, Clock } from 'lucide-react';
import QRCode from 'qrcode';
import api from '../../api/axios';
import toast from 'react-hot-toast';

// Re-generates QR every 4.5 min so users never hit the 5-min expiry mid-scan
const REFRESH_INTERVAL_MS = 4.5 * 60 * 1000;

export default function EventQRModal({ eventId, eventTitle, onClose }) {
    const [qrDataUrl, setQrDataUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [countdown, setCountdown] = useState(300); // seconds
    const timerRef = useRef(null);
    const refreshRef = useRef(null);

    const fetchAndRenderQR = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const { data } = await api.get(`/events/${eventId}/qr-payload`);
            // Encode the entire signed payload as JSON string inside the QR
            const payloadStr = JSON.stringify({
                eventId: data.eventId,
                userId: data.userId,
                ts: data.ts,
                sig: data.sig
            });

            const dataUrl = await QRCode.toDataURL(payloadStr, {
                errorCorrectionLevel: 'H',
                margin: 2,
                width: 260,
                color: { dark: '#0f172a', light: '#ffffff' }
            });

            setQrDataUrl(dataUrl);
            setCountdown(data.expiresIn || 300);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load QR code. Are you registered for this event?');
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    // Initial load + auto-refresh
    useEffect(() => {
        fetchAndRenderQR();
        refreshRef.current = setInterval(fetchAndRenderQR, REFRESH_INTERVAL_MS);
        return () => {
            clearInterval(refreshRef.current);
            clearInterval(timerRef.current);
        };
    }, [fetchAndRenderQR]);

    // Countdown timer
    useEffect(() => {
        if (loading) return;
        clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    fetchAndRenderQR(); // auto-refresh when expired
                    return 300;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [loading, fetchAndRenderQR]);

    const mins = String(Math.floor(countdown / 60)).padStart(2, '0');
    const secs = String(countdown % 60).padStart(2, '0');
    const isExpiringSoon = countdown <= 30;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-white/70 dark:bg-black/80 backdrop-blur-sm px-4">
            <div className="bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-sm p-6 relative animate-in fade-in zoom-in-95 duration-200">
                {/* Close */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                    <X size={18} />
                </button>

                {/* Header */}
                <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-9 h-9 rounded-xl bg-sky-600 flex items-center justify-center flex-shrink-0">
                        <QrCode size={18} className="text-white" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs text-gray-400 font-medium">Your Attendance QR</p>
                        <h3 className="font-bold text-gray-900 dark:text-white truncate text-sm">{eventTitle}</h3>
                    </div>
                </div>

                {/* QR Area */}
                <div className="flex flex-col items-center">
                    {loading ? (
                        <div className="w-[260px] h-[260px] bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center animate-pulse">
                            <QrCode size={48} className="text-gray-300" />
                        </div>
                    ) : error ? (
                        <div className="w-[260px] h-[260px] bg-red-50 dark:bg-red-950/20 rounded-xl flex flex-col items-center justify-center gap-3 border border-red-200 dark:border-red-800 px-6 text-center">
                            <p className="text-red-500 text-sm font-medium">{error}</p>
                        </div>
                    ) : (
                        <div className="relative">
                            <img
                                src={qrDataUrl}
                                alt="Attendance QR Code"
                                className={`w-[260px] h-[260px] rounded-xl border-2 transition ${isExpiringSoon ? 'border-amber-400 opacity-80' : 'border-gray-200 dark:border-gray-700'}`}
                            />
                            {/* Corner accent */}
                            <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-sky-500 rounded-tl-lg" />
                            <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-sky-500 rounded-tr-lg" />
                            <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-sky-500 rounded-bl-lg" />
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-sky-500 rounded-br-lg" />
                        </div>
                    )}

                    {/* Countdown */}
                    {!loading && !error && (
                        <div className={`mt-5 flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold transition ${
                            isExpiringSoon
                                ? 'border-amber-400 text-amber-600 bg-amber-50 dark:bg-amber-900/20'
                                : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800'
                        }`}>
                            <Clock size={14} />
                            <span>Refreshes in {mins}:{secs}</span>
                        </div>
                    )}

                    {/* Refresh manually */}
                    {!loading && (
                        <button
                            onClick={fetchAndRenderQR}
                            className="mt-3 flex items-center gap-1.5 text-xs text-sky-500 hover:text-sky-700 font-medium transition"
                        >
                            <RefreshCw size={12} />
                            Refresh now
                        </button>
                    )}
                </div>

                {/* Instruction */}
                <p className="mt-5 text-center text-xs text-gray-400 dark:text-gray-500">
                    Show this QR code to the organizer to mark your attendance.
                    <br />
                    Valid for <strong>5 minutes</strong> · auto-refreshes before expiry.
                </p>
            </div>
        </div>,
        document.body
    );
}
