import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

// Hook for fetching list of chats
export const useChats = () => {
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const { socket } = useSocket();

    const fetchChats = useCallback(async () => {
        try {
            const { data } = await api.get('/chat');
            setChats(Array.isArray(data) ? data : []);
            return data;
        } catch (err) {
            console.error('Error fetching chats:', err);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchChats();
    }, [fetchChats]);

    const addOrUpdateChat = useCallback((chatData) => {
        if (!chatData || !chatData._id) return;
        setChats(prev => {
            const existingIndex = prev.findIndex(c => c._id === chatData._id);
            if (existingIndex > -1) {
                const updated = [...prev];
                updated[existingIndex] = { ...updated[existingIndex], ...chatData };
                return updated;
            }
            return [chatData, ...prev];
        });
    }, []);

    const accessChat = async (userId) => {
        try {
            const { data } = await api.post('/chat', { userId });
            addOrUpdateChat(data);
            return data;
        } catch (error) {
            console.error("Error accessing chat:", error);
            throw error;
        }
    };

    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = async (newMessage) => {
            if (!newMessage) return;
            // Normalize chatId
            const msgChatId = newMessage.chatId?._id || newMessage.chatId;
            if (!msgChatId) return;

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
            try {
                const { data } = await api.get(`/chat/${msgChatId}`);
                if (data && data._id) {
                    addOrUpdateChat(data);
                }
            } catch (err) {
                // Silently ignore if not found or unauthorized
            }
        };

        socket.on('message:new', handleNewMessage);
        return () => socket.off('message:new', handleNewMessage);
    }, [socket, addOrUpdateChat]);

    return { 
        chats, 
        loading, 
        accessChat, 
        refetchChats: fetchChats, 
        addOrUpdateChat,
        setChats 
    };
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

    const sendMessage = async (text, options = {}) => {
        // Sending natively over sockets with support for E2EE encrypted payloads and attachments
        if (socket && chatId) {
            let payload = {
                conversationId: chatId,
                text
            };

            if (Array.isArray(options)) {
                payload.attachments = options;
            } else if (options && typeof options === 'object') {
                if (options.encryptedContent) payload.encryptedContent = options.encryptedContent;
                if (options.iv) payload.iv = options.iv;
                if (options.authTag) payload.authTag = options.authTag;
                payload.attachments = Array.isArray(options.attachments) ? options.attachments : [];
            }

            socket.emit('message:send', payload);
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
