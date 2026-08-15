import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { FaBolt, FaUniversity, FaCalendarAlt, FaMapMarkerAlt, FaCode, FaBriefcase } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const ROLES = [
    { value: 'Member', label: 'General Member' },
    { value: 'Frontend', label: 'Frontend Developer' },
    { value: 'Backend', label: 'Backend Developer' },
    { value: 'Designer', label: 'UI/UX Designer' },
    { value: 'Leader', label: 'Team Lead' },
    { value: 'Marketing', label: 'Marketing / Pitch' }
];

const AutoTeamModal = ({ eventId, user, onClose, onJoined }) => {
    const navigate = useNavigate();
    const modalRef = useRef(null);

    // Initialize state with user's profile data as defaults
    const [preferences, setPreferences] = useState({
        college: user.college || '',
        location: user.location || '',
        year: user.year || '',
        role: 'Member',
        skills: user.skills?.join(', ') || ''
    });

    const [loading, setLoading] = useState(false);

    // Handle click outside to close sidebar
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                onClose();
            }
        };

        // Use mousedown to capture the intention immediately for snappy feel
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setPreferences(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleJoinQueue = async () => {
        if (!eventId) return;
        setLoading(true);
        try {
            // Process skills string to array
            const processedSkills = preferences.skills
                .split(',')
                .map(s => s.trim())
                .filter(s => s.length > 0);

            const filters = {
                ...preferences,
                skills: processedSkills
            };

            const { data } = await api.post(`/autoteam/${eventId}/join`, { filters });

            if (data.status === 'matched' && data.chatId) {
                toast.custom((t) => (
                    <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
                        <div className="flex-1 w-0 p-4">
                            <div className="flex items-start">
                                <div className="flex-shrink-0 pt-0.5">
                                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                        <FaBolt className="h-6 w-6 text-green-600" />
                                    </div>
                                </div>
                                <div className="ml-3 flex-1">
                                    <p className="text-sm font-medium text-gray-900">
                                        Team Formed! 🎉
                                    </p>
                                    <p className="mt-1 text-sm text-gray-500">
                                        You have been matched! Check out your new team.
                                    </p>
                                    <div className="mt-3 flex space-x-3">
                                        <button
                                            onClick={() => {
                                                toast.dismiss(t.id);
                                                navigate(`/chat/${data.chatId}`);
                                            }}
                                            className="bg-sky-600 rounded-md text-sm font-medium text-white px-4 py-2 hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
                                        >
                                            Go to Chat
                                        </button>
                                        <button
                                            onClick={() => toast.dismiss(t.id)}
                                            className="bg-white rounded-md text-sm font-medium text-gray-700 hover:text-gray-500 focus:outline-none"
                                        >
                                            Dismiss
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ), { duration: 5000 });
            } else {
                toast.success("Joined Queue! We'll notify you when a team is found.");
            }

            if (onJoined) onJoined();
            onClose();
        } catch (error) {
            console.error('Auto match error:', error);
            toast.error("Failed to join queue. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-4 pointer-events-none transition-all duration-300 ease-out">
            {/* Backdrop click handler (separate div to preserve pointer-events logic) */}
            <div
                className="absolute inset-0 pointer-events-auto"
                onMouseDown={() => onClose()}
            />

            <div
                ref={modalRef}
                className="bg-white rounded-t-[2rem] sm:rounded-[1.5rem] shadow-2xl shadow-sky-900/10 w-full sm:max-w-sm overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] border-t sm:border border-white/50 pointer-events-auto relative transform transition-all animate-slide-up sm:animate-none"
                onClick={e => e.stopPropagation()}
            >

                {/* Drag Handle for Mobile */}
                <div className="sm:hidden w-full flex justify-center pt-3 pb-1" onMouseDown={onClose}>
                    <div className="w-12 h-1.5 bg-gray-200 rounded-full cursor-pointer hover:bg-gray-300 transition-colors" />
                </div>

                {/* Ultra-Compact Header */}
                <div className="pt-2 sm:pt-5 px-5 pb-2 text-center">
                    <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center mx-auto mb-2 text-sky-600 shadow-sm border border-sky-100">
                        <FaBolt size={18} />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 tracking-tight">Auto Match</h2>
                    <p className="text-gray-400 text-xs mt-1 font-medium">
                        Preferences for your ideal team.
                    </p>
                </div>

                {/* Content - Ultra-Compact Form */}
                <div className="px-5 py-4 space-y-3 overflow-y-auto custom-scrollbar overscroll-contain">

                    {/* Role */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                            Preferred Role
                        </label>
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-sky-600 transition-colors">
                                <FaBriefcase size={12} />
                            </div>
                            <select
                                name="role"
                                value={preferences.role}
                                onChange={handleChange}
                                className="w-full pl-9 pr-6 py-3 sm:py-2.5 bg-white border border-gray-200 rounded-xl sm:rounded-lg focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 outline-none transition-all text-sm sm:text-xs font-semibold text-gray-700 appearance-none cursor-pointer hover:border-gray-300"
                            >
                                {ROLES.map((roleOpt) => (
                                    <option key={roleOpt.value} value={roleOpt.value}>
                                        {roleOpt.label}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                            </div>
                        </div>
                    </div>

                    {/* College */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                            College
                        </label>
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-sky-600 transition-colors">
                                <FaUniversity size={12} />
                            </div>
                            <input
                                type="text"
                                name="college"
                                value={preferences.college}
                                onChange={handleChange}
                                placeholder="University Name"
                                className="w-full pl-9 pr-3 py-3 sm:py-2.5 bg-white border border-gray-200 rounded-xl sm:rounded-lg focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 outline-none transition-all text-sm sm:text-xs font-medium text-gray-800 placeholder:text-gray-400 hover:border-gray-300"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                        {/* Year */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                                Year
                            </label>
                            <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-sky-600 transition-colors">
                                    <FaCalendarAlt size={12} />
                                </div>
                                <input
                                    type="text"
                                    name="year"
                                    value={preferences.year}
                                    onChange={handleChange}
                                    placeholder="e.g. 3rd"
                                    className="w-full pl-9 pr-3 py-3 sm:py-2.5 bg-white border border-gray-200 rounded-xl sm:rounded-lg focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 outline-none transition-all text-sm sm:text-xs font-medium text-gray-800 placeholder:text-gray-400 hover:border-gray-300"
                                />
                            </div>
                        </div>

                        {/* Location */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                                Location
                            </label>
                            <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-sky-600 transition-colors">
                                    <FaMapMarkerAlt size={12} />
                                </div>
                                <input
                                    type="text"
                                    name="location"
                                    value={preferences.location}
                                    onChange={handleChange}
                                    placeholder="City"
                                    className="w-full pl-9 pr-3 py-3 sm:py-2.5 bg-white border border-gray-200 rounded-xl sm:rounded-lg focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 outline-none transition-all text-sm sm:text-xs font-medium text-gray-800 placeholder:text-gray-400 hover:border-gray-300"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Skills */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                            Skills
                        </label>
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-sky-600 transition-colors">
                                <FaCode size={12} />
                            </div>
                            <input
                                type="text"
                                name="skills"
                                value={preferences.skills}
                                onChange={handleChange}
                                placeholder="React, Node.js, Python..."
                                className="w-full pl-9 pr-3 py-3 sm:py-2.5 bg-white border border-gray-200 rounded-xl sm:rounded-lg focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 outline-none transition-all text-sm sm:text-xs font-medium text-gray-800 placeholder:text-gray-400 hover:border-gray-300"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 sm:p-4 border-t border-gray-50 bg-white flex gap-3 pb-8 sm:pb-4 safe-area-pb">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 sm:py-2.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl sm:rounded-lg transition-colors active:scale-[0.98]"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleJoinQueue}
                        disabled={loading}
                        className="flex-1 py-3 sm:py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl sm:rounded-lg font-bold shadow-lg shadow-sky-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-xs"
                    >
                        {loading ? (
                            <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></span>
                        ) : (
                            <>
                                <span>Find Teammates</span>
                                <FaBolt className="text-sky-200" size={12} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

AutoTeamModal.propTypes = {
    eventId: PropTypes.string.isRequired,
    user: PropTypes.shape({
        college: PropTypes.string,
        location: PropTypes.string,
        year: PropTypes.string,
        skills: PropTypes.arrayOf(PropTypes.string)
    }).isRequired,
    onClose: PropTypes.func.isRequired,
    onJoined: PropTypes.func
};

export default AutoTeamModal;
