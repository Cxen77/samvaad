import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const CHANNEL_NAME = 'synapse_cross_tab_chat_v1';

/**
 * Hook to synchronize "Active Chat" state across multiple browser tabs.
 * Returns a function `isChatActiveGlobal(chatId)` that returns true if ANY tab is viewing that chat.
 */
export const useCrossTabActiveChat = () => {
    const location = useLocation();
    // Map of TabID -> ActiveChatID
    const [remoteActiveChats, setRemoteActiveChats] = useState(new Map());

    const channelRef = useRef(null);
    // Generate a unique ID for this tab session
    const myTabIdRef = useRef(Math.random().toString(36).substring(2, 9) + Date.now().toString(36));

    // Helper: Extract Chat ID from current path
    const getChatId = (path) => {
        const match = path.match(/^\/chat\/([^/]+)$/);
        // Ensure we don't match just "/chat"
        return match ? match[1] : null;
    };

    const myActiveChatId = getChatId(location.pathname);

    // Broadcast my current status to the channel
    const broadcastUpdate = (type = 'UPDATE') => {
        if (!channelRef.current) return;

        channelRef.current.postMessage({
            type,
            tabId: myTabIdRef.current,
            chatId: getChatId(window.location.pathname) // Always read fresh URL
        });
    };

    useEffect(() => {
        const channel = new BroadcastChannel(CHANNEL_NAME);
        channelRef.current = channel;

        channel.onmessage = (event) => {
            const { type, tabId, chatId } = event.data;
            if (tabId === myTabIdRef.current) return; // Ignore messages from self

            if (type === 'UPDATE') {
                // Peer updated their status
                setRemoteActiveChats(prev => {
                    const next = new Map(prev);
                    if (chatId) {
                        next.set(tabId, chatId);
                    } else {
                        next.delete(tabId);
                    }
                    return next;
                });
            } else if (type === 'QUERY') {
                // New tab asked for status -> reply with mine
                broadcastUpdate('UPDATE');
            } else if (type === 'LEAVE') {
                // Peer closed tab
                setRemoteActiveChats(prev => {
                    const next = new Map(prev);
                    next.delete(tabId);
                    return next;
                });
            }
        };

        // 1. Ask others what they are doing
        broadcastUpdate('QUERY');
        // 2. Announce presence immediately
        broadcastUpdate('UPDATE');

        // Cleanup on unmount (or close)
        const handleUnload = () => broadcastUpdate('LEAVE');
        window.addEventListener('beforeunload', handleUnload);

        return () => {
            window.removeEventListener('beforeunload', handleUnload);
            broadcastUpdate('LEAVE');
            channel.close();
            channelRef.current = null;
        };
    }, []);

    // Broadcast update whenever my local chat ID changes
    useEffect(() => {
        broadcastUpdate('UPDATE');
    }, [myActiveChatId]);

    /**
     * Check if a specific Chat ID is currently open in ANY tab (including this one).
     */
    const isChatActiveGlobal = (targetChatId) => {
        // 1. Check local tab
        if (myActiveChatId === targetChatId) return true;

        // 2. Check remote tabs
        for (const activeId of remoteActiveChats.values()) {
            if (activeId === targetChatId) return true;
        }

        return false;
    };

    return { isChatActiveGlobal };
};
