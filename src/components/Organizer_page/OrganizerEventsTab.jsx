import React, { useState, useEffect } from 'react';
import { FiCalendar, FiMapPin, FiUsers, FiShare2 } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';

export default function OrganizerEventsTab() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await api.get('/organizer/events/my');
                setEvents(res.data);
            } catch (err) {
                console.error("Failed to fetch organizer events", err);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    const handleShare = (e, event) => {
        e.stopPropagation();
        const shareUrl = `${window.location.origin}/events/${event._id}`;
        const shareData = {
            title: event.title,
            text: event.description || `Check out this event: ${event.title}`,
            url: shareUrl,
        };

        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
            navigator.share(shareData).catch(err => {
                if (err.name !== 'AbortError') {
                    console.error('Share failed:', err);
                    copyToClipboard(shareUrl);
                }
            });
        } else {
            copyToClipboard(shareUrl);
        }
    };

    const copyToClipboard = async (url) => {
        try {
            await navigator.clipboard.writeText(url);
            toast.success('Link copied to clipboard!');
        } catch (err) {
            console.error('Clipboard failed:', err);
            toast.error('Failed to copy link');
        }
    };

    if (loading) {
        return <div className="text-gray-400 dark:text-gray-500 p-8 text-center animate-pulse">Loading events...</div>;
    }

    if (events.length === 0) {
        return (
            <div className="bg-white dark:bg-[#121212] border border-gray-100 dark:border-gray-800 rounded-2xl p-8 text-center">
                <p className="text-gray-400 dark:text-gray-500">You haven't created any events yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">My Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                    <div key={event._id} className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden hover:border-sky-500/50 transition duration-300 shadow-sm hover:shadow-md">
                        <div className="h-40 relative group/img overflow-hidden bg-gray-100 dark:bg-gray-800">
                            {event.imageUrl ? (
                                <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-sky-900/40 to-slate-900">
                                    <FiCalendar className="w-10 h-10 text-sky-500/50" />
                                </div>
                            )}
                            {/* Share button overlay */}
                            <button
                                onClick={(e) => handleShare(e, event)}
                                className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full text-gray-700 hover:text-sky-600 shadow-sm opacity-0 group-hover/img:opacity-100 transition-all duration-200"
                                title="Share Event"
                            >
                                <FiShare2 className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-5">
                            <span className="inline-block px-2 py-1 bg-sky-500/20 text-sky-400 text-xs font-semibold rounded mb-3">
                                {event.category}
                            </span>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">{event.title}</h3>
                            <div className="space-y-2 text-sm text-gray-400 dark:text-gray-500">
                                <div className="flex items-center gap-2">
                                    <FiCalendar className="shrink-0" />
                                    <span>{new Date(event.date).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <FiMapPin className="shrink-0" />
                                    <span className="line-clamp-1">{event.location}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <FiUsers className="shrink-0" />
                                    <span>{event.attendees?.length || 0} Registered</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
