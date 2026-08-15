import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { X, QrCode, RefreshCw, Clock, Calendar, MapPin, CheckCircle2, Ticket } from 'lucide-react';
import QRCode from 'qrcode';
import api from '../../api/axios';
import Avatar from '../common/Avatar';

// Re-generates QR every 4.5 min to never hit the 5-min expiry mid-scan
const REFRESH_INTERVAL_MS = 4.5 * 60 * 1000;

export default function EventPassModal({ event, user, onClose }) {
    const [viewMode, setViewMode] = useState('details'); // 'details' | 'qr'
    
    const [qrDataUrl, setQrDataUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [countdown, setCountdown] = useState(300);
    const timerRef = useRef(null);
    const refreshRef = useRef(null);

    const fetchAndRenderQR = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const { data } = await api.get(`/events/${event._id}/qr-payload`);
            const payloadStr = JSON.stringify({
                eventId: data.eventId,
                userId: data.userId,
                ts: data.ts,
                sig: data.sig
            });
            const dataUrl = await QRCode.toDataURL(payloadStr, {
                errorCorrectionLevel: 'H',
                margin: 2,
                width: 240,
                color: { dark: '#0f172a', light: '#ffffff' }
            });
            setQrDataUrl(dataUrl);
            setCountdown(data.expiresIn || 300);
        } catch (err) {
            setError(err.response?.data?.message || 'Could not load pass. Are you registered?');
        } finally {
            setLoading(false);
        }
    }, [event._id]);

    useEffect(() => {
        fetchAndRenderQR();
        refreshRef.current = setInterval(fetchAndRenderQR, REFRESH_INTERVAL_MS);
        return () => {
            clearInterval(refreshRef.current);
            clearInterval(timerRef.current);
        };
    }, [fetchAndRenderQR]);

    useEffect(() => {
        if (loading) return;
        clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) { fetchAndRenderQR(); return 300; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [loading, fetchAndRenderQR]);

    const mins = String(Math.floor(countdown / 60)).padStart(2, '0');
    const secs = String(countdown % 60).padStart(2, '0');
    const isExpiringSoon = countdown <= 30;

    const eventDate = event.date ? new Date(event.date) : null;
    const formattedDate = eventDate
        ? eventDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
        : 'TBA';

    return ReactDOM.createPortal(
        <div
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="relative w-full max-w-sm animate-in fade-in zoom-in-95 duration-200">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute -top-3 -right-3 z-10 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-500 hover:text-gray-800 transition"
                >
                    <X size={16} />
                </button>

                {/* Pass Card */}
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">

                    {/* Top: Event Banner / Header */}
                    <div className="relative h-24 bg-gradient-to-br from-sky-600 to-sky-700 flex flex-col justify-end px-5 pb-4 overflow-hidden">
                        {/* Background pattern */}
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-3 left-3 w-20 h-20 rounded-full border-4 border-white" />
                            <div className="absolute top-8 left-12 w-32 h-32 rounded-full border-4 border-white" />
                            <div className="absolute -top-2 right-10 w-24 h-24 rounded-full border-4 border-white" />
                        </div>

                        <div className="relative flex items-center gap-3">
                            <div className="w-9 h-9 flex-shrink-0 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                                <Ticket size={18} className="text-white" />
                            </div>
                            <div className="min-w-0 flex-1 pr-2">
                                <p className="text-white/70 text-[10px] font-semibold uppercase tracking-wider mb-0.5">Event Pass</p>
                                <h2 className="text-white font-bold text-sm leading-tight truncate">{event.title}</h2>
                            </div>
                        </div>
                    </div>

                    {/* View Toggle */}
                    <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-center">
                        <div className="flex bg-gray-200/60 p-1 rounded-xl w-full max-w-[240px] relative">
                            {/* Sliding background */}
                            <div 
                                className={`absolute inset-y-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm transition-all duration-300 ease-out ${viewMode === 'details' ? 'left-1' : 'left-[calc(50%+2px)]'}`}
                            />
                            
                            <button 
                                onClick={() => setViewMode('details')}
                                className={`flex-1 relative z-10 py-1.5 text-xs font-bold transition-colors ${viewMode === 'details' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Pass Details
                            </button>
                            <button 
                                onClick={() => setViewMode('qr')}
                                className={`flex-1 relative z-10 py-1.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${viewMode === 'qr' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <QrCode size={13} />
                                QR Code
                            </button>
                        </div>
                    </div>

                    <div className="h-[420px] overflow-y-auto custom-scrollbar">
                        {viewMode === 'details' ? (
                        /* ================= details View ================= */
                        <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                            {/* Attendee Info */}
                            <div className="px-5 pt-5 pb-4 flex items-center gap-3">
                                <Avatar
                                    src={user?.profilePic}
                                    alt={user?.name || 'You'}
                                    size="lg"
                                    className="ring-2 ring-sky-100"
                                />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                        <p className="font-bold text-gray-900 text-base truncate">{user?.name || 'Attendee'}</p>
                                        {user?.collegeVerified && (
                                            <CheckCircle2 size={14} className="text-sky-500 flex-shrink-0" />
                                        )}
                                    </div>
                                    <p className="text-xs font-medium text-gray-400 truncate">@{user?.username || ''}</p>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="px-5 pb-6">
                                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Attendee Name</p>
                                        <p className="text-sm font-semibold text-gray-900">{user?.name || 'Participant'}</p>
                                    </div>

                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Event Name</p>
                                        <p className="text-sm font-semibold text-gray-900">{event.title}</p>
                                    </div>

                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Date & Time</p>
                                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                                            <Calendar size={14} className="text-sky-500" />
                                            <span>{formattedDate}</span>
                                        </div>
                                    </div>
                                    
                                    {user?.college && (
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">College / Institute</p>
                                            <p className="text-sm font-semibold text-gray-900 line-clamp-2">{user.college}</p>
                                        </div>
                                    )}

                                    {event.location && (
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Location</p>
                                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                                                <MapPin size={14} className="text-sky-500 flex-shrink-0" />
                                                <span className="truncate">{event.location}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* ================= QR Code View ================= */
                        <div className="animate-in fade-in slide-in-from-right-2 duration-300 flex flex-col items-center justify-center h-full px-5 py-6">
                            {loading ? (
                                <div className="w-[200px] h-[200px] bg-gray-50 rounded-2xl flex items-center justify-center animate-pulse border border-gray-100">
                                    <QrCode size={40} className="text-gray-300" />
                                </div>
                            ) : error ? (
                                <div className="w-[200px] h-[200px] bg-red-50 rounded-2xl flex flex-col items-center justify-center gap-2 border border-red-100 px-4 text-center">
                                    <p className="text-red-500 text-xs font-medium">{error}</p>
                                </div>
                            ) : (
                                <div className="relative p-2 bg-white rounded-2xl shadow-sm border border-gray-100">
                                    <img
                                        src={qrDataUrl}
                                        alt="Attendance QR Code"
                                        className={`w-[200px] h-[200px] rounded-xl transition ${isExpiringSoon ? 'opacity-70' : ''}`}
                                    />
                                    {/* Corner marks */}
                                    <div className="absolute top-1 left-1 w-6 h-6 border-t-[3px] border-l-[3px] border-sky-500 rounded-tl-lg" />
                                    <div className="absolute top-1 right-1 w-6 h-6 border-t-[3px] border-r-[3px] border-sky-500 rounded-tr-lg" />
                                    <div className="absolute bottom-1 left-1 w-6 h-6 border-b-[3px] border-l-[3px] border-sky-500 rounded-bl-lg" />
                                    <div className="absolute bottom-1 right-1 w-6 h-6 border-b-[3px] border-r-[3px] border-sky-500 rounded-br-lg" />
                                </div>
                            )}

                            {/* Timer & Refresh */}
                            {!loading && !error && (
                                <div className="mt-4 flex items-center gap-3">
                                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                                        isExpiringSoon
                                            ? 'border-amber-300 text-amber-700 bg-amber-50'
                                            : 'border-gray-200 text-gray-600 bg-gray-50'
                                    }`}>
                                        <Clock size={12} className={isExpiringSoon ? 'text-amber-500' : 'text-gray-400'} />
                                        <span>{mins}:{secs}</span>
                                    </div>
                                    <button
                                        onClick={fetchAndRenderQR}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-sky-50 text-xs text-sky-600 hover:bg-sky-100 font-bold transition border border-sky-100"
                                    >
                                        <RefreshCw size={11} />
                                        Refresh
                                    </button>
                                </div>
                            )}
                            
                            <p className="mt-5 text-center text-[10px] text-gray-400 leading-relaxed max-w-[220px]">
                                Show this QR to the organizer to mark attendance. Refreshes every 5 mins.
                            </p>
                        </div>
                    )}
                    </div>

                </div>
            </div>
        </div>,
        document.body
    );
}
