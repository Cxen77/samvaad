import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { FiUsers, FiUser, FiZap, FiGrid, FiChevronDown, FiCalendar } from 'react-icons/fi';
import { Camera, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VerifiedBadge from '../common/VerifiedBadge';
import ScanAttendanceModal from './ScanAttendanceModal';

const FILTERS = [
    { label: 'All', value: 'all' },
    { label: 'Solo', value: 'solo' },
    { label: 'Auto-Team', value: 'auto' },
    { label: 'Pre-Team', value: 'pre' }
];

const TYPE_COLORS = {
    solo: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    auto: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    pre: 'text-sky-400 bg-sky-400/10 border-sky-400/20'
};

const EventDropdown = ({ events, selectedId, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedEvent = events.find(e => e._id === selectedId);

    return (
        <div className="relative w-full">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none transition group shadow-sm hover:border-sky-500/30"
            >
                <div className="flex items-center gap-2">
                    <FiCalendar className="text-sky-500" />
                    <span className={selectedEvent ? "font-semibold" : "text-gray-400"}>
                        {selectedEvent ? selectedEvent.title : "-- Choose an Event --"}
                    </span>
                </div>
                <FiChevronDown className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute z-20 w-full mt-2 py-2 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl overflow-hidden"
                        >
                            {events.length === 0 ? (
                                <p className="px-4 py-3 text-sm text-gray-500 italic">No events found</p>
                            ) : (
                                events.map(ev => (
                                    <button
                                        key={ev._id}
                                        onClick={() => {
                                            onChange(ev._id);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-white/5 flex items-center justify-between ${selectedId === ev._id ? 'text-sky-500 bg-sky-500/5' : 'text-gray-700 dark:text-gray-300'
                                            }`}
                                    >
                                        <span className="truncate">{ev.title}</span>
                                        {selectedId === ev._id && <CheckCircle2 size={14} className="text-sky-500 shrink-0" />}
                                    </button>
                                ))
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default function OrganizerParticipantsTab() {
    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [scannerOpen, setScannerOpen] = useState(false);

    useEffect(() => {
        api.get('/organizer/events/my').then(r => setEvents(r.data)).catch(() => { });
    }, []);

    const fetchParticipants = useCallback(async (eventId, type) => {
        if (!eventId) return;
        setLoading(true);
        setError('');
        try {
            const res = await api.get(`/organizer/events/${eventId}/participants`, {
                params: { type }
            });
            setData(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load participants.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchParticipants(selectedEventId, activeFilter);
    }, [selectedEventId, activeFilter, fetchParticipants]);

    const handleFilterChange = (value) => {
        setActiveFilter(value);
    };

    // After a successful scan, refresh participant list
    const handleScannerClose = () => {
        setScannerOpen(false);
        fetchParticipants(selectedEventId, activeFilter);
    };

    const totals = data?.totals || {};

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 sm:p-8">
                {/* Title Row */}
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Event Participants</h2>
                    {selectedEventId && (
                        <button
                            onClick={() => setScannerOpen(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-semibold text-sm transition shadow-sm shadow-sky-500/20"
                        >
                            <Camera size={15} />
                            Scan Attendance
                        </button>
                    )}
                </div>

                {/* Event Selector */}
                <div className="mb-6 max-w-sm relative z-20">
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Select Event</label>
                    <EventDropdown
                        events={events}
                        selectedId={selectedEventId}
                        onChange={id => { setSelectedEventId(id); setData(null); }}
                    />
                </div>

                {/* Summary Stats — now includes Attended */}
                {data && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6 animate-in fade-in duration-200">
                        {[
                            { label: 'Total', value: totals.total, icon: FiGrid, color: 'blue' },
                            { label: 'Solo', value: totals.solo, icon: FiUser, color: 'amber' },
                            { label: 'Auto-Team', value: totals.auto, icon: FiZap, color: 'emerald' },
                            { label: 'Pre-Team', value: totals.pre, icon: FiUsers, color: 'violet' },
                            { label: 'Attended', value: totals.attended, icon: CheckCircle2, color: 'green' }
                        ].map(stat => (
                            <div key={stat.label} className={`bg-${stat.color}-500/10 border border-${stat.color}-500/20 rounded-xl p-4 text-center`}>
                                <p className={`text-3xl font-bold text-${stat.color}-400`}>{stat.value ?? '—'}</p>
                                <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Filter Toggle */}
                {selectedEventId && (
                    <div className="flex flex-wrap gap-2 mb-6">
                        {FILTERS.map(f => (
                            <button
                                key={f.value}
                                onClick={() => handleFilterChange(f.value)}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold border transition ${activeFilter === f.value
                                    ? 'bg-sky-600 border-sky-500 text-white'
                                    : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:border-gray-200'
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                )}

                {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
                {loading && <p className="text-gray-400 animate-pulse">Loading participants...</p>}

                {/* Participant Table */}
                {!loading && data && (
                    <div className="animate-in fade-in duration-300 bg-gray-100 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl overflow-x-auto">
                        {data.participants.length === 0 ? (
                            <p className="text-gray-400 dark:text-gray-500 text-center py-10">No participants found for this filter.</p>
                        ) : (
                            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300 min-w-[720px]">
                                <thead className="bg-gray-200/50 dark:bg-black text-xs uppercase text-gray-400 dark:text-gray-500">
                                    <tr>
                                        <th className="px-5 py-3">Name</th>
                                        <th className="px-5 py-3">Username</th>
                                        <th className="px-5 py-3">College</th>
                                        <th className="px-5 py-3">Year</th>
                                        <th className="px-5 py-3">Section</th>
                                        <th className="px-5 py-3">Team</th>
                                        <th className="px-5 py-3">Type</th>
                                        <th className="px-5 py-3">Attendance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.participants.map((p, i) => (
                                        <tr key={p.user._id || i} className="border-b border-gray-100 dark:border-gray-800 hover:bg-white/5 dark:hover:bg-white/5 transition">
                                            <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">
                                                <div className="flex items-center gap-1.5">
                                                    <span>{p.user.name}</span>
                                                    <VerifiedBadge verified={p.user.collegeVerified} />
                                                </div>
                                            </td>
                                            <td className="px-5 py-3">@{p.user.username}</td>
                                            <td className="px-5 py-3 text-gray-400 dark:text-gray-500">{p.user.college || 'N/A'}</td>
                                            <td className="px-5 py-3 text-gray-400 dark:text-gray-500">{p.user.year || '—'}</td>
                                            <td className="px-5 py-3 text-gray-400 dark:text-gray-500">{p.user.section || '—'}</td>
                                            <td className="px-5 py-3 text-gray-400 dark:text-gray-500">{p.teamInfo?.teamName || 'Solo'}</td>
                                            <td className="px-5 py-3">
                                                <span className={`px-2 py-0.5 rounded border text-xs font-semibold ${TYPE_COLORS[p.registrationType]}`}>
                                                    {p.registrationType}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3">
                                                {p.attended ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
                                                        <CheckCircle2 size={11} />
                                                        Attended
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded border border-gray-600/30 bg-gray-500/10 text-gray-500 text-xs font-semibold">
                                                        Not Yet
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>

            {/* Scan Attendance Modal */}
            {scannerOpen && (
                <ScanAttendanceModal
                    eventId={selectedEventId}
                    onClose={handleScannerClose}
                />
            )}
        </div>
    );
}
