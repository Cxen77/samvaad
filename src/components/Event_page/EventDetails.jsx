import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaMapMarkerAlt, FaTrophy, FaArrowLeft } from 'react-icons/fa';
import { FiShare2 } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';
import Avatar from '../common/Avatar';
import AutoTeamModal from './AutoTeamModal';
import EventPassModal from './EventPassModal';
import USNPromptModal from './USNPromptModal';
import { useAuth } from '../../context/AuthContext';
import MatchFoundModal from './MatchFoundModal';
import { useSocket } from '../../context/SocketContext';

const EventDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser, loading: authLoading } = useAuth(); // Get loading state from auth
    const { socket } = useSocket(); // Get socket instance
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isJoined, setIsJoined] = useState(false);
    const [isQueued, setIsQueued] = useState(null); // Initialize as null (loading)
    const [joinLoading, setJoinLoading] = useState(false);
    const [showAutoTeamModal, setShowAutoTeamModal] = useState(false);
    const [showPassModal, setShowPassModal] = useState(false);
    const [showUSNModal, setShowUSNModal] = useState(false);
    const [backendUser, setBackendUser] = useState(null);

    useEffect(() => {
        const fetchEventDetails = async () => {
            try {
                let fetchedEvent = null;
                // 1. Fetch Event
                // Try direct fetch first for better performance and reliability
                try {
                    const res = await api.get(`/events/${id}`);
                    fetchedEvent = res.data;
                    setEvent(fetchedEvent);
                } catch (err) {
                    // Fallback to list fetch if individual endpoint fails (or not implemented)
                    const { data } = await api.get(`/events`);
                    fetchedEvent = data.events?.find(e => e._id === id);
                    if (fetchedEvent) {
                        setEvent(fetchedEvent);
                    } else {
                        throw new Error("Event not found");
                    }
                }

                // 2. Check Event Attendance
                if (currentUser && fetchedEvent) {
                    // Re-check attendance from the fetched event data
                    const userIsAttending = fetchedEvent.attendees.some(att => (att._id || att) === currentUser._id);
                    setIsJoined(userIsAttending);
                } else {
                    setIsJoined(false); // Not logged in or event not found
                }

            } catch (err) {
                console.error("Failed to fetch event details", err);
                setError("Failed to load event details.");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchEventDetails();
    }, [id, currentUser]);

    // Fetch the backend user profile so we can display name/username/pic on the pass
    useEffect(() => {
        if (!currentUser) return;
        api.get('/users/me').then(res => setBackendUser(res.data)).catch(() => {});
    }, [currentUser]);

    // Separate effect for Queue Status to depend on currentUser (Auth)
    useEffect(() => {
        const checkQueue = async () => {
            if (authLoading) return; // Wait for auth to initialize

            if (currentUser && id) {
                try {
                    const qRes = await api.get(`/autoteam/${id}/status`);
                    setIsQueued(qRes.data.isQueued);
                } catch (qErr) {
                    console.error("Failed to check queue status", qErr);
                    setIsQueued(false);
                }
            } else {
                setIsQueued(false); // Not logged in -> Not queued
            }
        };
        checkQueue();
    }, [id, currentUser, authLoading]);

    const [matchData, setMatchData] = useState(null);
    const [showMatchModal, setShowMatchModal] = useState(false);

    // Listen for real-time match events
    useEffect(() => {
        if (!socket) return;

        const handleTeamFound = (data) => {
            // console.log("Team Found Socket Event:", data);
            if (data.teamId) {
                setMatchData(data);
                setShowMatchModal(true);
                // Also update queue state
                setIsQueued(false);
                setIsJoined(true); // Technically they are now in a team
            }
        };

        socket.on('team:found', handleTeamFound);

        return () => {
            socket.off('team:found', handleTeamFound);
        };
    }, [socket]);

    const handleJoin = async () => {
        if (isJoined || !currentUser) return;

        setJoinLoading(true);
        try {
            await api.put(`/events/${id}/join`);
            setIsJoined(true);
            setEvent(prev => ({ ...prev, attendees: [...prev.attendees, currentUser._id] }));
            toast.success('Joined event successfully!');
        } catch (error) {
            const status = error?.response?.status;
            const msg = error?.response?.data?.message || '';
            if (status === 422 && msg.toLowerCase().includes('usn')) {
                setShowUSNModal(true);
            } else {
                console.error('Failed to join event', error);
                toast.error(error?.response?.data?.message || 'Failed to join event');
            }
        } finally {
            setJoinLoading(false);
        }
    };

    const handleUSNConfirm = async () => {
        setShowUSNModal(false);
        setJoinLoading(true);
        try {
            await api.put(`/events/${id}/join`);
            setIsJoined(true);
            setEvent(prev => ({ ...prev, attendees: [...prev.attendees, currentUser._id] }));
            toast.success('Joined event successfully!');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to join event');
        } finally {
            setJoinLoading(false);
        }
    };

    const handleShare = async () => {
        const shareData = {
            title: event.title,
            text: event.description || `Check out this event: ${event.title}`,
            url: window.location.href,
        };

        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Share failed:', err);
                    copyToClipboard();
                }
            }
        } else {
            copyToClipboard();
        }
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            toast.success('Link copied to clipboard!');
        } catch (err) {
            console.error('Clipboard failed:', err);
            toast.error('Failed to copy link');
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
        </div>
    );

    if (error || !event) return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Event not found</h2>
            <p className="text-gray-600 mb-6">{error || "The event you're looking for doesn't exist."}</p>
            <button onClick={() => navigate('/events')} className="text-sky-600 hover:underline">
                Back to Events
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 pt-6 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => navigate('/events')}
                    className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition"
                >
                    <FaArrowLeft className="mr-2" /> Back to Events
                </button>

                <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
                    {/* Cover Image */}
                    <div className="h-64 sm:h-80 md:h-96 w-full relative bg-gray-100">
                        {event.imageUrl ? (
                            <img
                                src={event.imageUrl.includes('cloudinary.com') ? event.imageUrl.replace('/upload/', '/upload/q_auto,f_auto/') : event.imageUrl}
                                alt={event.title}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-sky-50 to-sky-50">
                                <div className="text-center">
                                    <div className="w-16 h-16 mx-auto bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                                        <svg className="w-8 h-8 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <span className="text-lg font-medium text-gray-400">No cover image</span>
                                </div>
                            </div>
                        )}
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-gray-800 shadow-sm">
                            {event.category}
                        </div>
                    </div>

                    <div className="p-6 sm:p-8">
                        <div className="max-w-3xl mx-auto">
                            {/* Title & Actions */}
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex-1 pr-4">{event.title}</h1>

                                {/* Action Buttons Row */}
                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        onClick={handleJoin}
                                        disabled={joinLoading || isJoined}
                                        className={`px-6 py-2 rounded-xl font-bold text-sm transition ${isJoined
                                            ? "bg-gray-100 dark:bg-[#262626] text-gray-900 dark:text-white cursor-default"
                                            : "bg-[#3B82F6] text-white hover:opacity-90"
                                            }`}
                                    >
                                        {joinLoading ? "Joining..." : isJoined ? "Going" : "Join Event"}
                                    </button>

                                    {/* Auto Match Button */}
                                    {!isJoined && isQueued !== null && (
                                        <button
                                            onClick={() => !isQueued && setShowAutoTeamModal(true)}
                                            disabled={isQueued}
                                            className={`px-5 py-2 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 ${isQueued
                                                ? "bg-gray-100 dark:bg-[#262626] text-gray-500 dark:text-gray-400 cursor-default"
                                                : "bg-gray-100 dark:bg-[#262626] text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-[#363636]"
                                                }`}
                                        >
                                            {isQueued ? "Searching..." : "Auto Match"}
                                        </button>
                                    )}
                                    {!isJoined && isQueued === null && (
                                        <div className="h-9 w-28 bg-gray-100 dark:bg-[#262626] rounded-xl animate-pulse"></div>
                                    )}

                                    {/* Share Button */}
                                    <button
                                        onClick={handleShare}
                                        className="p-2 sm:px-4 sm:py-2 rounded-xl font-bold text-sm bg-gray-100 dark:bg-[#262626] text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-[#363636] transition flex items-center gap-2"
                                        title="Share Event"
                                    >
                                        <FiShare2 className="w-4 h-4" />
                                        <span className="hidden sm:inline">Share</span>
                                    </button>

                                    {/* My Pass Button — shown only when joined */}
                                    {isJoined && (
                                        <button
                                            onClick={() => setShowPassModal(true)}
                                            className="px-4 py-2 rounded-xl font-bold text-sm bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/40 border border-sky-200 dark:border-sky-800 transition flex items-center gap-2"
                                            title="View My Pass"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                            </svg>
                                            <span className="hidden sm:inline">My Pass</span>
                                        </button>
                                    )}

                                    {/* Delete Button (Organizer Only) */}
                                    {currentUser && event.organizer && (currentUser._id === (event.organizer._id || event.organizer)) && (
                                        <button
                                            onClick={async () => {
                                                if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
                                                    try {
                                                        await api.delete(`/events/${id}`);
                                                        navigate('/events');
                                                    } catch (err) {
                                                        alert('Failed to delete event');
                                                        console.error(err);
                                                    }
                                                }
                                            }}
                                            className="px-5 py-2 rounded-xl font-bold text-sm text-red-600 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition"
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-3 mb-6">
                                <Avatar
                                    src={event.organizer?.profilePic}
                                    alt={event.organizer?.name || "Organizer"}
                                    size="sm"
                                    className="border border-gray-100 dark:border-gray-800"
                                />
                                <p className="text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">Hosted by </span>
                                    <span className="font-semibold text-gray-900 dark:text-white">{event.organizer?.name || "Unknown"}</span>
                                </p>
                            </div>

                            {/* Info Box (Date, Location, Prize) */}
                            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 sm:gap-6 text-sm text-gray-700 dark:text-gray-300 mb-8 pb-8 border-b border-gray-100 dark:border-gray-800/60">
                                <div className="flex items-center gap-2">
                                    <FaCalendarAlt className="text-gray-400 dark:text-gray-500" />
                                    {new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </div>
                                <div className="flex items-center gap-2">
                                    <FaMapMarkerAlt className="text-gray-400 dark:text-gray-500" />
                                    {event.location}
                                </div>
                                {event.prize && (
                                    <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500 font-medium">
                                        <FaTrophy />
                                        {event.prize}
                                    </div>
                                )}
                            </div>

                        </div>

                        {/* Description Section */}
                        <div className="pt-2">
                            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">About this event</h3>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap text-sm md:text-base">
                                {event.description}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {showUSNModal && (
                <USNPromptModal
                    onConfirm={handleUSNConfirm}
                    onClose={() => setShowUSNModal(false)}
                />
            )}

            {showAutoTeamModal && (
                <AutoTeamModal
                    eventId={id}
                    user={currentUser}
                    onClose={() => setShowAutoTeamModal(false)}
                    onJoined={() => setIsQueued(true)}
                />
            )}

            {showPassModal && event && (
                <EventPassModal
                    event={event}
                    user={backendUser || currentUser}
                    onClose={() => setShowPassModal(false)}
                />
            )}

            <MatchFoundModal
                isOpen={showMatchModal}
                onClose={() => setShowMatchModal(false)}
                matchData={matchData}
            />
        </div>
    );
};

export default EventDetails;
