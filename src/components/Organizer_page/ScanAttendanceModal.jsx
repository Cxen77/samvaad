import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { X, Camera, CheckCircle2, AlertCircle, UserCheck } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import Avatar from '../common/Avatar';

// A short 800 Hz beep for successful scans
function playBeep() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
    } catch (_) { /* silently ignore if audio not supported */ }
}

export default function ScanAttendanceModal({ eventId, onClose }) {
    const [scanning, setScanning] = useState(false);
    const [status, setStatus] = useState('idle'); // 'idle'|'processing'|'success'|'error'|'duplicate'
    const [scannedUser, setScannedUser] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [showCheck, setShowCheck] = useState(false);
    const scannerRef = useRef(null);
    const containerRef = useRef(null);
    const processingRef = useRef(false); // prevent concurrent scan calls

    const stopScanner = useCallback(async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                scannerRef.current.clear();
            } catch (_) { }
            scannerRef.current = null;
        }
        setScanning(false);
    }, []);

    const startScanner = useCallback(async () => {
        const scanner = new Html5Qrcode('qr-scanner-container');
        scannerRef.current = scanner;
        setScanning(true);
        setStatus('idle');
        setScannedUser(null);
        processingRef.current = false;

        try {
            await scanner.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 240, height: 240 } },
                async (decodedText) => {
                    if (processingRef.current) return;
                    processingRef.current = true;
                    setStatus('processing');

                    try {
                        const payload = JSON.parse(decodedText);
                        const res = await api.post(`/organizer/events/${eventId}/scan-attendance`, payload);

                        playBeep();
                        setScannedUser(res.data.participant);
                        setStatus('success');
                        setShowCheck(true);

                        // After 3 s of showing success, reset for next scan
                        setTimeout(() => {
                            setShowCheck(false);
                            setScannedUser(null);
                            setStatus('idle');
                            processingRef.current = false;
                        }, 3000);

                    } catch (err) {
                        const code = err.response?.status;
                        const msg = err.response?.data?.message || 'Scan failed';

                        if (code === 409) {
                            // Duplicate — show user info anyway if returned
                            setStatus('duplicate');
                            setErrorMsg(msg);
                        } else {
                            setStatus('error');
                            setErrorMsg(msg);
                        }

                        // Reset after 2.5 s so organizer can scan next person
                        setTimeout(() => {
                            setStatus('idle');
                            setErrorMsg('');
                            processingRef.current = false;
                        }, 2500);
                    }
                },
                () => { /* silent qr decode errors */ }
            );
        } catch (err) {
            setScanning(false);
            toast.error('Camera access denied or unavailable.');
        }
    }, [eventId]);

    // Cleanup on unmount
    useEffect(() => {
        return () => { stopScanner(); };
    }, [stopScanner]);

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-white/70 dark:bg-black/80 backdrop-blur-sm px-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-sm overflow-hidden relative">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                        <Camera size={18} className="text-sky-500" />
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm">Scan Attendance</h3>
                    </div>
                    <button
                        onClick={() => { stopScanner(); onClose(); }}
                        className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Scanner viewport */}
                <div className="relative bg-black" style={{ minHeight: '280px' }}>
                    <div
                        id="qr-scanner-container"
                        ref={containerRef}
                        className="w-full"
                        style={{ minHeight: '280px' }}
                    />

                    {/* Overlay states */}
                    {(status === 'success' || status === 'error' || status === 'duplicate' || status === 'processing') && (
                        <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-300 ${
                            status === 'success' ? 'bg-emerald-900/80' :
                            status === 'duplicate' ? 'bg-amber-900/80' :
                            status === 'processing' ? 'bg-black/60' :
                            'bg-red-900/80'
                        }`}>
                            {status === 'processing' && (
                                <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
                            )}
                            {status === 'success' && showCheck && (
                                <div className="flex flex-col items-center gap-3 animate-in zoom-in-50 duration-300">
                                    <CheckCircle2 size={56} className="text-emerald-400 drop-shadow-lg" strokeWidth={2} />
                                    <p className="text-white font-bold text-base">Attendance Marked!</p>
                                </div>
                            )}
                            {(status === 'error' || status === 'duplicate') && (
                                <div className="flex flex-col items-center gap-3 animate-in zoom-in-50 duration-300 px-6 text-center">
                                    <AlertCircle size={48} className={status === 'duplicate' ? 'text-amber-400' : 'text-red-400'} />
                                    <p className="text-white font-semibold text-sm">{errorMsg}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Scan guide frame (visible when idle) */}
                    {!scanning && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                            <p className="text-gray-400 text-sm text-center px-6">
                                Press <span className="text-white font-semibold">Start Camera</span> to begin scanning QR codes
                            </p>
                        </div>
                    )}
                </div>

                {/* Scanned User Card */}
                {status === 'success' && scannedUser && (
                    <div className="px-5 py-4 bg-emerald-50 dark:bg-emerald-900/20 border-t border-emerald-100 dark:border-emerald-800 animate-in slide-in-from-bottom duration-300">
                        <div className="flex items-center gap-3">
                            <Avatar
                                src={scannedUser.profilePic}
                                alt={scannedUser.name}
                                size="custom"
                                className="w-11 h-11 rounded-full flex-shrink-0 border-2 border-emerald-300"
                            />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                    <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{scannedUser.name}</p>
                                    <UserCheck size={14} className="text-emerald-500 flex-shrink-0" />
                                </div>
                                <p className="text-xs text-gray-500 truncate">
                                    {scannedUser.college || scannedUser.email}
                                </p>
                                {(scannedUser.year || scannedUser.section) && (
                                    <p className="text-xs text-gray-400">
                                        {[scannedUser.year, scannedUser.section ? `Section ${scannedUser.section}` : null].filter(Boolean).join(' · ')}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Controls */}
                <div className="px-5 py-4 flex gap-3">
                    {!scanning ? (
                        <button
                            onClick={startScanner}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-semibold text-sm transition"
                        >
                            <Camera size={16} />
                            Start Camera
                        </button>
                    ) : (
                        <button
                            onClick={stopScanner}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-semibold text-sm transition"
                        >
                            Stop Scanner
                        </button>
                    )}
                    <button
                        onClick={() => { stopScanner(); onClose(); }}
                        className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
