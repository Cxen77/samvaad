import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import { getAccessToken } from '../api/axios';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const { currentUser } = useAuth();

    useEffect(() => {
        let newSocket;

        const initSocket = async () => {
            if (currentUser) {
                const token = getAccessToken();

                // Use environment variable for production, fallback to localhost for dev
                // Correct: Connect to root URL (e.g. localhost:5000 or api.fuseon.in)
                const SERVER_URL = import.meta.env.VITE_API_URL;

                newSocket = io(SERVER_URL, {
                    auth: { token },
                    reconnection: true,
                    reconnectionAttempts: 5,
                    reconnectionDelay: 1000
                });

                newSocket.on('connect', () => {
                    // console.log('[Socket] Connected:', newSocket.id);
                });

                newSocket.on('disconnect', (reason) => {
                    // console.log('[Socket] Disconnected:', reason);
                });

                newSocket.on('connect_error', (err) => {
                    console.error('[Socket] Connection error:', err.message);
                });

                // INITIAL SYNC: Receive full list of online users
                newSocket.on('online:users', (userIds) => {
                    // console.log('[Socket] Received initial online users:', userIds.length);
                    setOnlineUsers(new Set(userIds));
                });

                newSocket.on('user:presence', ({ userId, status }) => {
                    // console.log(`[SocketContext] Presence Update: User ${userId} is now ${status}`);
                    setOnlineUsers(prev => {
                        const newSet = new Set(prev);
                        if (status === 'online') {
                            newSet.add(userId);
                        } else {
                            newSet.delete(userId);
                        }
                        // console.log('[SocketContext] Updated Online Set:', [...newSet]);
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
        <SocketContext.Provider value={{ socket, onlineUsers }}>
            {children}
        </SocketContext.Provider>
    );
};
