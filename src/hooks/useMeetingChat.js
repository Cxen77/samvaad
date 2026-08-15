import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

/**
 * Hook for meeting-specific chat. Uses the meeting chat Socket.IO room
 * and the dedicated meeting chat API endpoints.
 * 
 * @param {string} meetingId - The Samvaad meeting ID (e.g., 'AICTE-2026-8F42K')
 * @param {string} meetingTitle - Display title for the meeting
 */
export const useMeetingChat = (meetingId, meetingTitle) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [chatId, setChatId] = useState(null);
    const [error, setError] = useState(null);

    const { socket } = useSocket();
    const { currentUser } = useAuth();

    // Initialize meeting chat — create or access existing
    const initChat = useCallback(async () => {
        if (!meetingId) return;
        setLoading(true);
        setError(null);

        try {
            // Access or create the meeting chat
            const { data } = await api.post(`/chat/meeting/${meetingId}`, {
                meetingTitle
            });
            setChatId(data._id);

            // Fetch existing history
            const historyRes = await api.get(`/chat/meeting/${meetingId}/history`);
            setMessages(historyRes.data.messages || []);
        } catch (err) {
            console.error('[useMeetingChat] Init error:', err);
            setError(err.response?.data?.message || 'Failed to load meeting chat');
        } finally {
            setLoading(false);
        }
    }, [meetingId, meetingTitle]);

    // Initialize on mount
    useEffect(() => {
        initChat();
    }, [initChat]);

    // Socket room management and real-time listeners
    useEffect(() => {
        if (!socket || !meetingId || !chatId) return;

        // Join the meeting chat socket room
        socket.emit('join:meeting-chat', { meetingId });

        // Listen for new messages
        const handleNewMessage = (msg) => {
            if (msg.meetingId !== meetingId) return;

            setMessages(prev => {
                // Deduplicate
                if (prev.some(m => m._id === msg._id)) return prev;
                return [...prev, msg];
            });
        };

        socket.on('meeting-chat:message', handleNewMessage);

        return () => {
            socket.emit('leave:meeting-chat', { meetingId });
            socket.off('meeting-chat:message', handleNewMessage);
        };
    }, [socket, meetingId, chatId]);

    // Send a user message
    const sendMessage = useCallback((text) => {
        if (!socket || !meetingId || !text.trim()) return;

        socket.emit('meeting-chat:send', {
            meetingId,
            text: text.trim(),
            messageType: 'user'
        });
    }, [socket, meetingId]);

    // Send a system message
    const sendSystemMessage = useCallback((text) => {
        if (!socket || !meetingId || !text) return;

        socket.emit('meeting-chat:system', {
            meetingId,
            text
        });
    }, [socket, meetingId]);

    return {
        messages,
        loading,
        chatId,
        error,
        sendMessage,
        sendSystemMessage,
        currentUser
    };
};
