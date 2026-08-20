import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import SystemSettings from '../models/SystemSettings.js';
import { initSamvaadSocket } from './samvaadSocket.js';
import { initDirectCallSocket } from './directCallSocket.js';

let io;
const onlineUsers = new Map(); // userId -> Set<socketId>
const typingTimeouts = new Map(); // `${userId}:${chatId}` -> timeoutId

export const initSocket = (httpServer) => {
    const allowedOrigins = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "https://fuseon.in",
        "https://www.fuseon.in",
        process.env.CLIENT_URL
    ].filter(Boolean);

    io = new Server(httpServer, {
        cors: {
            origin: (origin, callback) => {
                if (!origin) return callback(null, true);
                if (
                    allowedOrigins.includes(origin) ||
                    origin.endsWith('.fuseon.in') ||
                    origin.includes('vercel.app') ||
                    origin.includes('render.com') ||
                    process.env.NODE_ENV === 'development'
                ) {
                    callback(null, true);
                } else {
                    callback(null, true); // Allow connection with credentials fallback
                }
            },
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    // Middleware for Auth
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }

            // Verify Custom JWT (matches authMiddleware)
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Fetch full user from Mongo
            const user = await User.findById(decoded.userId).select('-password');
            if (!user) {
                return next(new Error('User not found in database'));
            }
            socket.mongoUser = user;

            // Check if chat is disabled or role restricted
            const settings = await SystemSettings.getSettings();
            const chatFeature = settings.features?.get('chat');
            if (!chatFeature?.enabled) {
                return next(new Error('Chat is currently disabled'));
            }
            if (chatFeature.rolesAllowed && chatFeature.rolesAllowed.length > 0) {
                if (!chatFeature.rolesAllowed.includes(user.role)) {
                    return next(new Error('Chat access denied for your role'));
                }
            }

            // Check if user is suspended
            if (user.isSuspended) {
                return next(new Error('Account suspended'));
            }

            next();
        } catch (error) {
            console.error('Socket Auth Error:', error.message);
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', async (socket) => {
        const userId = socket.mongoUser._id.toString();

        // Init Samvaad custom handlers
        initSamvaadSocket(io, socket);
        initDirectCallSocket(io, socket);

        // Join user-specific room
        socket.join(`user:${userId}`);

        // Track Socket ID
        if (!onlineUsers.has(userId)) {
            onlineUsers.set(userId, new Set());
        } else {
            // console.log(`[Socket] Adding socket ${socket.id} to existing user ${userId}`);
        }
        const userSockets = onlineUsers.get(userId);
        userSockets.add(socket.id);

        // Send existing online users map to the new client (Initial Sync)
        const activeUserIds = Array.from(onlineUsers.keys());
        socket.emit('online:users', activeUserIds);

        // If this is the FIRST connection for this user, broadcast Online
        if (userSockets.size === 1) {
            io.emit('user:presence', { userId, status: 'online' });
        } else {
            // console.log(`User ${userId} connected another tab (Active: ${userSockets.size})`);
        }

        // Handle joining a chat room — SECURITY: verify membership
        socket.on('join:conversation', async (conversationId) => {
            if (!socket.mongoUser || !conversationId) return;
            try {
                const Chat = (await import('../models/Chat.js')).default;
                const isMember = await Chat.exists({
                    _id: conversationId,
                    participants: socket.mongoUser._id
                });
                if (!isMember) {
                    socket.emit('error', { message: 'Not a member of this chat' });
                    return;
                }
                socket.join(conversationId);
            } catch (err) {
                console.error('[Socket] join:conversation error:', err.message);
            }
        });

        // Handle leaving a chat room
        socket.on('leave:conversation', (conversationId) => {
            socket.leave(conversationId);
        });

        // Handle typing:start
        socket.on('typing:start', ({ conversationId }) => {
            if (!conversationId) return;
            const timeoutKey = `${userId}:${conversationId}`;
            
            // Clear existing timeout if any
            if (typingTimeouts.has(timeoutKey)) {
                clearTimeout(typingTimeouts.get(timeoutKey));
            }
            
            // Broadcast to chat room
            socket.to(conversationId).emit('typing:start', { userId: socket.mongoUser._id.toString() });
            
            // Set auto-timeout for 3 seconds
            const timeoutId = setTimeout(() => {
                socket.to(conversationId).emit('typing:stop', { userId: socket.mongoUser._id.toString() });
                typingTimeouts.delete(timeoutKey);
            }, 3000);
            
            typingTimeouts.set(timeoutKey, timeoutId);
        });

        // Handle typing:stop
        socket.on('typing:stop', ({ conversationId }) => {
            if (!conversationId) return;
            const timeoutKey = `${userId}:${conversationId}`;
            
            if (typingTimeouts.has(timeoutKey)) {
                clearTimeout(typingTimeouts.get(timeoutKey));
                typingTimeouts.delete(timeoutKey);
            }
            
            socket.to(conversationId).emit('typing:stop', { userId: socket.mongoUser._id.toString() });
        });

        // Handle message:send natively over sockets
        socket.on('message:send', async (payload) => {
            if (!payload || !socket.mongoUser || !payload.conversationId) return;

            let { conversationId, text, encryptedContent, iv, authTag, attachments } = payload;

            // Defensive: If client passed E2EE payload inside attachments object
            if (!encryptedContent && attachments && typeof attachments === 'object' && !Array.isArray(attachments)) {
                encryptedContent = attachments.encryptedContent;
                iv = attachments.iv;
                authTag = attachments.authTag;
                attachments = Array.isArray(attachments.attachments) ? attachments.attachments : [];
            }

            if (!text && !encryptedContent) return;

            try {
                const Chat = (await import('../models/Chat.js')).default;
                const Message = (await import('../models/Message.js')).default;
                const User = (await import('../models/User.js')).default;

                const isMember = await Chat.exists({
                    _id: conversationId,
                    participants: socket.mongoUser._id
                });

                if (!isMember) {
                    socket.emit('error', { message: 'Not authorized for this conversation' });
                    return;
                }

                // Ensure attachments is strictly an array of valid strings (URLs/paths)
                const safeAttachments = Array.isArray(attachments)
                    ? attachments.filter(a => typeof a === 'string')
                    : [];

                let messageData = {
                    senderId: socket.mongoUser._id,
                    chatId: conversationId,
                    text: encryptedContent ? '[Encrypted Direct Message]' : (text || ''),
                    attachments: safeAttachments,
                    readBy: [socket.mongoUser._id]
                };

                if (encryptedContent && iv && authTag) {
                    messageData.encryptedContent = encryptedContent;
                    messageData.iv = iv;
                    messageData.authTag = authTag;
                }

                let message = await Message.create(messageData);

                // Populate dependencies for UI rendering on the receiver's end
                message = await message.populate('senderId', 'name profilePic role email');
                message = await message.populate('chatId');
                message = await User.populate(message, {
                    path: 'chatId.participants',
                    select: 'name profilePic email status pushToken',
                });

                // Store in Chat Model natively
                await Chat.findByIdAndUpdate(conversationId, {
                    lastMessage: message._id,
                    $set: { deletedBy: [] } // Revive if hidden
                });

                // Broadcast directly to chat room
                io.to(conversationId).emit('message:new', message);
            } catch (err) {
                console.error('[Socket] message:send error:', err);
                socket.emit('error', { message: 'Failed to send message: ' + (err.message || 'Server error') });
            }
        });

        // ============================================================
        // AICTE SAMVAAD: Meeting Chat Socket Events
        // ============================================================

        // Handle joining a meeting chat room — verified against Chat model
        socket.on('join:meeting-chat', async ({ meetingId }) => {
            if (!socket.mongoUser || !meetingId) return;
            try {
                const Chat = (await import('../models/Chat.js')).default;
                const chat = await Chat.findOne({
                    meetingId,
                    chatType: 'meeting',
                    participants: socket.mongoUser._id
                });

                if (!chat) {
                    socket.emit('error', { message: 'Not a participant of this meeting chat' });
                    return;
                }

                socket.join(`meeting-chat:${meetingId}`);
                // console.log(`[Socket] User ${socket.mongoUser.name} joined meeting-chat:${meetingId}`);
            } catch (err) {
                console.error('[Socket] join:meeting-chat error:', err.message);
            }
        });

        // Handle leaving a meeting chat room
        socket.on('leave:meeting-chat', ({ meetingId }) => {
            if (!meetingId) return;
            socket.leave(`meeting-chat:${meetingId}`);
        });

        // Handle sending a message in meeting chat (with encryption)
        socket.on('meeting-chat:send', async ({ meetingId, text, messageType, attachments }) => {
            if (!text || !socket.mongoUser || !meetingId) return;
            try {
                const Chat = (await import('../models/Chat.js')).default;
                const Message = (await import('../models/Message.js')).default;
                const { encryptMessage, decryptMessage, unwrapMeetingKey } = await import('../services/encryptionService.js');
                const { logChatEvent } = await import('../services/chatAuditService.js');
                const { getMeetingStatus } = await import('../controllers/samvaadController.js');

                // AICTE SAMVAAD: Check if meeting is sealed
                const meetingStatus = getMeetingStatus(meetingId);
                if (meetingStatus === 'ENDED' || meetingStatus === 'completed') {
                    socket.emit('error', { message: 'Meeting chat is sealed (read-only).' });
                    return;
                }

                const chat = await Chat.findOne({
                    meetingId,
                    chatType: 'meeting',
                    participants: socket.mongoUser._id
                }).select('_id isEncrypted encryptedChatKey chatKeyIv chatKeyAuthTag chatKeyVersion').lean();

                if (!chat) return;

                // Build message data with encryption
                const messageData = {
                    senderId: socket.mongoUser._id,
                    chatId: chat._id,
                    attachments: attachments || [],
                    readBy: [socket.mongoUser._id],
                    messageType: messageType || 'user'
                };

                if (chat.isEncrypted && chat.encryptedChatKey) {
                    const meetingKeyHex = unwrapMeetingKey(chat.encryptedChatKey, chat.chatKeyIv, chat.chatKeyAuthTag);
                    const { encryptedContent, iv, authTag } = encryptMessage(text, meetingKeyHex);
                    messageData.text = '[Encrypted]';
                    messageData.encryptedContent = encryptedContent;
                    messageData.iv = iv;
                    messageData.authTag = authTag;
                    messageData.keyVersion = chat.chatKeyVersion || 1;
                } else if (chat.isEncrypted) {
                    console.error('[Socket] meeting-chat:send error: Meeting encryption key unavailable');
                    socket.emit('error', { message: 'Meeting encryption key unavailable. Message not sent.' });
                    return;
                } else {
                    messageData.text = text;
                }

                let message = await Message.create(messageData);
                message = await message.populate('senderId', 'name profilePic');

                // Update Chat lastMessage
                await Chat.findByIdAndUpdate(chat._id, {
                    lastMessage: message._id,
                    $set: { deletedBy: [] }
                });

                // Build response with decrypted text for broadcast
                const broadcastMsg = message.toObject();
                broadcastMsg.text = text; // Send plaintext to authorized room members
                delete broadcastMsg.encryptedContent;
                delete broadcastMsg.iv;
                delete broadcastMsg.authTag;
                broadcastMsg.meetingId = meetingId;

                // Broadcast to meeting chat room
                io.to(`meeting-chat:${meetingId}`).emit('meeting-chat:message', broadcastMsg);

                // Audit log
                logChatEvent('MESSAGE_SENT', {
                    chatId: chat._id,
                    userId: socket.mongoUser._id,
                    messageId: message._id,
                    meetingId
                });
            } catch (err) {
                console.error('[Socket] meeting-chat:send error:', err.message);
            }
        });

        // Handle system messages in meeting chat
        socket.on('meeting-chat:system', async ({ meetingId, text }) => {
            if (!text || !meetingId) return;
            try {
                const Chat = (await import('../models/Chat.js')).default;
                const Message = (await import('../models/Message.js')).default;
                const { encryptMessage, unwrapMeetingKey } = await import('../services/encryptionService.js');
                const { logChatEvent } = await import('../services/chatAuditService.js');

                const chat = await Chat.findOne({ meetingId, chatType: 'meeting' })
                    .select('_id isEncrypted encryptedChatKey chatKeyIv chatKeyAuthTag chatKeyVersion').lean();
                if (!chat) return;

                const senderId = socket.mongoUser?._id;
                if (!senderId) return;

                const messageData = {
                    senderId,
                    chatId: chat._id,
                    messageType: 'system',
                    readBy: []
                };

                if (chat.isEncrypted && chat.encryptedChatKey) {
                    const meetingKeyHex = unwrapMeetingKey(chat.encryptedChatKey, chat.chatKeyIv, chat.chatKeyAuthTag);
                    const { encryptedContent, iv, authTag } = encryptMessage(text, meetingKeyHex);
                    messageData.text = '[Encrypted]';
                    messageData.encryptedContent = encryptedContent;
                    messageData.iv = iv;
                    messageData.authTag = authTag;
                    messageData.keyVersion = chat.chatKeyVersion || 1;
                } else if (chat.isEncrypted) {
                    console.error('[Socket] meeting-chat:system error: Meeting encryption key unavailable');
                    return;
                } else {
                    messageData.text = text;
                }

                const message = await Message.create(messageData);

                // Broadcast system message with plaintext
                const broadcastMsg = message.toObject();
                broadcastMsg.text = text;
                delete broadcastMsg.encryptedContent;
                delete broadcastMsg.iv;
                delete broadcastMsg.authTag;
                broadcastMsg.meetingId = meetingId;

                io.to(`meeting-chat:${meetingId}`).emit('meeting-chat:message', broadcastMsg);

                logChatEvent('SYSTEM_MESSAGE', {
                    chatId: chat._id,
                    userId: senderId,
                    messageId: message._id,
                    meetingId,
                    metadata: { systemText: text }
                });
            } catch (err) {
                console.error('[Socket] meeting-chat:system error:', err.message);
            }
        });

        // Handle disconnect
        socket.on('disconnect', async () => {
            if (onlineUsers.has(userId)) {
                const userSockets = onlineUsers.get(userId);
                userSockets.delete(socket.id);

                // If NO connections remaining, mark as Offline
                if (userSockets.size === 0) {
                    onlineUsers.delete(userId);

                    // Update last seen in DB
                    try {
                        await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
                    } catch (err) {
                        console.error('Error updating lastSeen:', err);
                    }

                    io.emit('user:presence', { userId, status: 'offline', lastSeen: new Date() });
                } else {
                    // console.log(`User ${userId} closed a tab (Remaining: ${userSockets.size})`);
                }
            }
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

// Helper to get online users for API
export const getOnlineUserIds = () => Array.from(onlineUsers.keys());

// Helper to check if specific user is online
export const isUserOnline = (userId) => onlineUsers.has(userId.toString());
