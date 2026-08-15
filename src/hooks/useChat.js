import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

// Hook for fetching list of chats
export const useChats = () => {
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const { socket } = useSocket();

    useEffect(() => {
        const fetchChats = async () => {
            try {
                const { data } = await api.get('/chat');
                setChats(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchChats();
    }, []);

    const accessChat = async (userId) => {
        try {
            const { data } = await api.post('/chat', { userId });

            // Check if chat already exists in list
            if (!chats.find(c => c._id === data._id)) {
                setChats(prev => [data, ...prev]);
            }
            return data;
        } catch (error) {
            console.error("Error accessing chat:", error);
            throw error;
        }
    };

    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = async (newMessage) => {
            // Normalize chatId
            const msgChatId = newMessage.chatId._id || newMessage.chatId;

            // Update chat list order and last message
            setChats(prev => {
                const chatIndex = prev.findIndex(c => c._id === msgChatId);
                if (chatIndex > -1) {
                    const updatedChat = {
                        ...prev[chatIndex],
                        lastMessage: newMessage,
                        updatedAt: newMessage.createdAt
                    };
                    // Move to top
                    const newChats = [...prev];
                    newChats.splice(chatIndex, 1);
                    return [updatedChat, ...newChats];
                }
                return prev;
            });

            // If chat was not found in the sync update above, fetch it
            // If chat was not found in the sync update above, fetch it
            // We do this check outside the setChats updater to allow async fetch
            // We do this check outside the setChats updater to allow async fetch
            const chatExists = chats.find(c => c._id === msgChatId);
            if (!chatExists) {
                try {
                    const { data } = await api.get(`/chat/${msgChatId}`);
                    setChats(prev => {
                        // Double check existence to prevent race conditions
                        if (prev.find(c => c._id === data._id)) return prev;
                        return [data, ...prev];
                    });
                } catch (err) {
                    console.error("Failed to fetch new chat", err);
                }
            }
        };

        socket.on('message:new', handleNewMessage);
        return () => socket.off('message:new', handleNewMessage);
    }, [socket]);

    return { chats, loading, accessChat };
};

// Hook for single chat interaction
export const useChatHistory = (chatId) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [typingUsers, setTypingUsers] = useState(new Set());

    const { socket } = useSocket();
    const { currentUser } = useAuth();

    // Pagination
    const fetchHistory = useCallback(async (cursor = null) => {
        if (!chatId || (!cursor && loading)) return; // Prevent double init

        setLoading(true);
        try {
            const params = { limit: 30 };
            if (cursor) params.cursor = cursor;

            const { data } = await api.get(`/chat/history/${chatId}`, { params });

            if (data.length < 30) setHasMore(false);

            setMessages(prev => cursor ? [...data, ...prev] : data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [chatId]);

    // Initial load
    useEffect(() => {
        if (chatId) {
            setMessages([]);
            setHasMore(true);
            fetchHistory();
        }
    }, [chatId, fetchHistory]);

    useEffect(() => {
        if (!socket || !chatId) return;

        // console.log('[useChat] Joining chat room:', chatId);
        socket.emit('join:conversation', chatId);

        const handleNewMessage = (msg) => {
            // console.log('[useChat] Received message:new event:', msg);

            // Handle both string and populated object chatId
            const msgChatId = msg.chatId._id || msg.chatId;

            if (msgChatId === chatId) {
                // console.log('[useChat] Message matches current chat, adding to state');
                setMessages(prev => {
                    // Check for duplicates
                    if (prev.some(m => m._id === msg._id)) {
                        // console.log('[useChat] Message already exists, skipping');
                        return prev;
                    }
                    return [...prev, msg];
                });
                // Mark read immediately if we see it
                api.post('/chat/read', { chatId });
            } else {
                // console.log('[useChat] Message is for different chat:', msgChatId);
            }
        };

        const handleTypingStart = ({ userId }) => {
            if (userId !== currentUser?._id) {
                setTypingUsers(prev => new Set(prev).add(userId));
            }
        };

        const handleTypingStop = ({ userId }) => {
            setTypingUsers(prev => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
            });
        };

        // console.log('[useChat] Attaching socket listeners');
        socket.on('message:new', handleNewMessage);
        socket.on('typing:start', handleTypingStart);
        socket.on('typing:stop', handleTypingStop);

        return () => {
            // console.log('[useChat] Cleaning up socket listeners');
            socket.emit('leave:conversation', chatId);
            socket.off('message:new', handleNewMessage);
            socket.off('typing:start', handleTypingStart);
            socket.off('typing:stop', handleTypingStop);
        };
    }, [socket, chatId]);

    const sendMessage = async (text, attachments = []) => {
        // Now sending natively over sockets instead of HTTP API to ensure realtime synchronization
        if (socket) {
            socket.emit('message:send', {
                conversationId: chatId,
                text,
                attachments
            });
            // We rely on handleNewMessage listener to instantly render our sent message
        }
    };

    const sendTypingStart = () => {
        if (socket) socket.emit('typing:start', { conversationId: chatId });
    };

    const sendTypingStop = () => {
        if (socket) socket.emit('typing:stop', { conversationId: chatId });
    };

    return {
        messages,
        loading,
        hasMore,
        loadMore: () => fetchHistory(messages[0]?.createdAt), // Cursor is oldest msg date
        sendMessage,
        sendTypingStart,
        sendTypingStop,
        typingUsers: Array.from(typingUsers)
    };
};

// Check online status
export const usePresence = (userId) => {
    const { onlineUsers } = useSocket();
    return onlineUsers.has(userId);
};
