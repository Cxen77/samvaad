import React, { useEffect, useState } from 'react';
import { HiBell, HiCheck, HiX } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { formatDistanceToNow } from 'date-fns';
import { useSocket } from '../../context/SocketContext';

const NotificationDropdown = ({ isOpen, onClose }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const { socket } = useSocket();

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    useEffect(() => {
        if (!socket) return;
        const handleNewNotification = (newNotif) => {
            setNotifications(prev => [newNotif, ...prev]);
        };
        socket.on('notification:new', handleNewNotification);
        return () => socket.off('notification:new', handleNewNotification);
    }, [socket]);

    const fetchNotifications = async () => {
        try {
            const { data } = await api.get('/notifications');
            setNotifications(data);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        } finally {
            setLoading(false);
        }
    };

    const handleNotificationClick = async (notification) => {
        try {
            if (!notification.read) {
                await api.put(`/notifications/${notification._id}/read`);
                // Update local state to mark as read
                setNotifications(prev =>
                    prev.map(n => n._id === notification._id ? { ...n, read: true } : n)
                );
            }

            // Navigate based on type
            // Navigate based on type
            if (notification.post) {
                navigate(`/post/${notification.post._id || notification.post}`);
            } else if (notification.team) {
                const teamId = notification.team._id || notification.team;
                navigate(`/teams/${teamId}`);
            } else if (notification.event) {
                navigate(`/events/${notification.event._id || notification.event}`);
            } else if (notification.sender) {
                navigate(`/users/${notification.sender.username}`);
            }
            // Removed redundant check for type === 'match' processing since 'notification.team' handles it above.

            onClose();

            onClose();
        } catch (error) {
            console.error("Failed to handle notification click", error);
        }
    };

    const markAllAsRead = async () => {
        // Implement if backend supports it, or loop through unread
        // For now, just a placeholder or individual click
    };

    if (!isOpen) return null;

    return (
        <div className="fixed top-[72px] left-4 right-4 md:absolute md:top-full md:right-0 md:left-auto md:w-96 bg-white dark:bg-[#121212] rounded-xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-[#121212]">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <HiBell className="text-sky-600 dark:text-sky-500" />
                    Notifications
                </h3>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500 dark:text-gray-400"
                >
                    <HiX className="w-5 h-5" />
                </button>
            </div>

            {/* List */}
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {loading ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        <div className="animate-spin w-6 h-6 border-2 border-sky-600 dark:border-sky-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                        Loading...
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center">
                        <HiBell className="w-12 h-12 text-gray-200 dark:text-gray-700 mb-2" />
                        <p>No notifications yet</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
                        {notifications.map((notification) => (
                            <div
                                key={notification._id}
                                onClick={() => handleNotificationClick(notification)}
                                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer flex gap-3 ${!notification.read ? 'bg-sky-50/30 dark:bg-transparent' : ''
                                    }`}
                            >
                                {/* Avatar */}
                                <img
                                    src={notification.sender?.profilePic || `https://ui-avatars.com/api/?name=${notification.sender?.name}&background=random`}
                                    alt=""
                                    className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-gray-200 dark:border-gray-700"
                                />

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-900 dark:text-gray-200 leading-snug">
                                        {notification.message ? (
                                            <span>{notification.message}</span>
                                        ) : (
                                            <>
                                                <span className="font-semibold text-gray-900 dark:text-white">{notification.sender?.name}</span>
                                                {' '}
                                                {notification.type === 'like' && 'liked your post'}
                                                {notification.type === 'comment' && 'commented on your post'}
                                                {notification.type === 'follow' && 'started following you'}
                                                {notification.type === 'invite' && (notification.team?.name ? `invited you to join ${notification.team.name}` : 'invited you to a team')}
                                                {notification.type === 'join' && 'joined your team'}
                                                {notification.type === 'reply' && 'replied to your comment'}
                                                {notification.type === 'join_request' && (notification.team?.name ? `requested to join ${notification.team.name}` : 'requested to join your team')}
                                                {notification.type === 'join_accepted' && (notification.team?.name ? `accepted your request to join ${notification.team.name}` : 'accepted your request to join the team')}
                                                {notification.type === 'join_rejected' && (notification.team?.name ? `declined your request to join ${notification.team.name}` : 'declined your request to join the team')}
                                                {notification.type === 'ownership_transfer' && (notification.team?.name ? `transferred ownership of ${notification.team.name} to you` : 'transferred a team\'s ownership to you')}
                                                {notification.type === 'match' && (
                                                    <span className="text-green-600 font-bold">
                                                        found a match for your team! 🎉
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                    </p>
                                </div>

                                {/* Unread Indicator */}
                                {!notification.read && (
                                    <div className="w-2 h-2 bg-[#3B82F6] rounded-full mt-2 flex-shrink-0"></div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationDropdown;
