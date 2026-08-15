import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { FiDownload, FiCalendar, FiChevronDown, FiMail, FiFilter, FiUsers, FiZap } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const CustomDropdown = ({ options, value, onChange, icon: Icon, placeholder = "-- Select --", labelKey = "label", valueKey = "value" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedOption = options.find(o => o[valueKey] === value);

    return (
        <div className="relative w-full">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm outline-none transition group hover:border-sky-500/30"
            >
                <div className="flex items-center gap-2 text-left truncate">
                    {Icon && <Icon className="text-sky-500 shrink-0" size={14} />}
                    <span className={`truncate ${selectedOption ? "font-semibold" : "text-gray-400"}`}>
                        {selectedOption ? (typeof selectedOption === 'string' ? selectedOption : selectedOption[labelKey]) : placeholder}
                    </span>
                </div>
                <FiChevronDown className={`transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} size={14} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute z-20 w-full mt-1 py-1 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto custom-scrollbar"
                        >
                            {options.map((opt, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                        onChange(typeof opt === 'string' ? opt : opt[valueKey]);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-white/5 flex items-center justify-between ${value === (typeof opt === 'string' ? opt : opt[valueKey]) ? 'text-sky-500 bg-sky-500/5' : 'text-gray-700 dark:text-gray-300'
                                        }`}
                                >
                                    <span className="truncate">{typeof opt === 'string' ? opt : opt[labelKey]}</span>
                                    {value === (typeof opt === 'string' ? opt : opt[valueKey]) && <CheckCircle2 size={12} className="text-sky-500 shrink-0" />}
                                </button>
                            ))}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

const TEAM_TYPES = [
    { label: 'All Types', value: 'all' },
    { label: 'Solo', value: 'solo' },
    { label: 'Auto-Team', value: 'auto' },
    { label: 'Pre-Team', value: 'pre' }
];

const ATTENDANCE_FILTERS = [
    { label: 'All Registered', value: 'all' },
    { label: 'Attended Only', value: 'attended' },
    { label: 'Not Attended', value: 'notAttended' }
];

export default function OrganizerExportTab() {
    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState('');
    const [downloading, setDownloading] = useState(false);
    const [filters, setFilters] = useState({
        teamType: 'all',
        attendanceFilter: 'all',
        college: '',
        year: '',
        section: ''
    });

    useEffect(() => {
        api.get('/organizer/events/my').then(r => setEvents(r.data)).catch(() => { });
    }, []);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleExport = async () => {
        if (!selectedEventId) return;
        setDownloading(true);

        const params = new URLSearchParams();
        if (filters.teamType) params.set('teamType', filters.teamType);
        if (filters.attendanceFilter) params.set('attendanceFilter', filters.attendanceFilter);
        if (filters.college) params.set('college', filters.college);
        if (filters.year) params.set('year', filters.year);
        if (filters.section) params.set('section', filters.section);

        try {
            const response = await api.get(
                `/organizer/events/${selectedEventId}/export?${params.toString()}`,
                { responseType: 'blob' }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `event-${selectedEventId}-participants.csv`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success('CSV exported successfully!');
        } catch (err) {
            toast.error('Failed to export participants.');
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 sm:p-8 max-w-3xl">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Export Data</h2>
            <p className="text-gray-400 dark:text-gray-500 mb-8">Download a structured CSV with academic data, registration types, and attendance status.</p>

            {/* Event selector */}
            <div className="mb-6 relative z-30">
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Select Event</label>
                <CustomDropdown
                    options={events}
                    value={selectedEventId}
                    onChange={id => setSelectedEventId(id)}
                    icon={FiCalendar}
                    placeholder="-- Choose an Event --"
                    labelKey="title"
                    valueKey="_id"
                />
            </div>

            {/* Filter Controls */}
            <div className="bg-gray-100 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5 mb-6 space-y-4">
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">Export Filters (Optional)</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Registration Type</label>
                        <CustomDropdown
                            options={TEAM_TYPES}
                            value={filters.teamType}
                            onChange={val => setFilters(prev => ({ ...prev, teamType: val }))}
                            icon={FiUsers}
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Attendance Status</label>
                        <CustomDropdown
                            options={ATTENDANCE_FILTERS}
                            value={filters.attendanceFilter}
                            onChange={val => setFilters(prev => ({ ...prev, attendanceFilter: val }))}
                            icon={CheckCircle2}
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">College (Partial match)</label>
                        <input
                            type="text"
                            name="college"
                            value={filters.college}
                            onChange={handleFilterChange}
                            placeholder="e.g. MIT"
                            className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Year (Exact)</label>
                        <input
                            type="text"
                            name="year"
                            value={filters.year}
                            onChange={handleFilterChange}
                            placeholder="e.g. 3rd"
                            className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Section (Exact)</label>
                        <input
                            type="text"
                            name="section"
                            value={filters.section}
                            onChange={handleFilterChange}
                            placeholder="e.g. A"
                            className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm outline-none"
                        />
                    </div>
                </div>
            </div>

            <button
                onClick={handleExport}
                disabled={!selectedEventId || downloading}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl font-medium transition"
            >
                <FiDownload />
                {downloading ? 'Preparing Download...' : 'Export to CSV'}
            </button>
        </div>
    );
}
