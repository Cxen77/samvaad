import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import { getAccessToken } from '../api/axios';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const { currentUser } = useAuth();
    // Track which conversation the user is currently viewing (for reconnect re-join)
    const activeConversationRef = useRef(null);

    // Expose a way for chat components to register their active conversation
    const setActiveConversation = (conversationId) => {
        activeConversationRef.current = conversationId;
    };

    useEffect(() => {
        let newSocket;

        const initSocket = async () => {
            if (currentUser) {
                const token = getAccessToken();

                // Clean and normalize socket server URL (strips leading spaces, quotes, and /api subpaths)
                const rawSocketUrl = (import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || '').trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
                const SERVER_URL = rawSocketUrl
                    ? rawSocketUrl.replace(/\/api(\/v1)?\/?$/, '')
                    : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');

                console.log('[Socket] Connecting to:', SERVER_URL);

                newSocket = io(SERVER_URL, {
                    auth: { token },
                    // Polling first — Render free tier often fails initial WebSocket upgrade during cold start
                    transports: ['polling', 'websocket'],
                    upgrade: true,
                    withCredentials: true,
                    reconnection: true,
                    reconnectionAttempts: 20,
                    reconnectionDelay: 1000,
                    reconnectionDelayMax: 10000,
                    timeout: 45000
                });

                newSocket.on('connect', () => {
                    console.log('[Socket] Connected:', newSocket.id);
                    // Re-join active conversation after connect/reconnect
                    if (activeConversationRef.current) {
                        newSocket.emit('join:conversation', activeConversationRef.current);
                    }
                });

                newSocket.on('disconnect', (reason) => {
                    console.warn('[Socket] Disconnected:', reason);
                });

                newSocket.on('connect_error', (err) => {
                    console.error('[Socket] Connection error:', err.message);
                });

                newSocket.io.on('reconnect', (attempt) => {
                    console.log('[Socket] Reconnected after', attempt, 'attempts');
                });

                newSocket.io.on('reconnect_attempt', (attempt) => {
                    console.log('[Socket] Reconnect attempt:', attempt);
                });

                newSocket.io.on('reconnect_error', (err) => {
                    console.error('[Socket] Reconnect error:', err.message);
                });

                // INITIAL SYNC: Receive full list of online users
                newSocket.on('online:users', (userIds) => {
                    setOnlineUsers(new Set(userIds));
                });

                newSocket.on('user:presence', ({ userId, status }) => {
                    setOnlineUsers(prev => {
                        const newSet = new Set(prev);
                        if (status === 'online') {
                            newSet.add(userId);
                        } else {
                            newSet.delete(userId);
                        }
                        return newSet;
                    });
                });

                setSocket(newSocket);
            }
        };

        if (currentUser) {
            initSocket();
        }

        return () => {
            if (newSocket) newSocket.disconnect();
        };
    }, [currentUser]);

    return (
        <SocketContext.Provider value={{ socket, onlineUsers, setActiveConversation }}>
            {children}
        </SocketContext.Provider>
    );
};
