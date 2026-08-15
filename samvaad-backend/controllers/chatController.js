import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import Team from '../models/Team.js';
import { getIO, isUserOnline } from '../socket/socketServer.js';
import { admin } from '../config/firebaseAdmin.js';
import { encryptMessage, decryptMessage, generateMeetingKey, wrapMeetingKey, unwrapMeetingKey } from '../services/encryptionService.js';
import { logChatEvent } from '../services/chatAuditService.js';
import { getMeetingStatus } from './samvaadController.js';

// @desc    Get all chats for current user
// @route   GET /api/chat
// @access  Private
export const getChats = async (req, res) => {
    try {
        const chats = await Chat.find({
            participants: req.user._id,
            deletedBy: { $ne: req.user._id }
        })
            .populate('participants', 'name email profilePic status lastSeen')
            .populate('lastMessage')
            .populate('groupAdmin', 'name profilePic')
            .sort({ updatedAt: -1 });

        res.json(chats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Access or create a one-on-one direct chat
// @route   POST /api/chat/direct/:userId
// @access  Private
export const accessDirectChat = async (req, res) => {
    const { userId } = req.params;

    if (!userId || userId === req.user._id.toString()) {
        return res.status(400).json({ message: "Invalid target user ID" });
    }

    try {
        let isChat = await Chat.find({
            isGroupChat: false,
            participants: { $all: [req.user._id, userId] }
        })
            .populate("participants", "name email profilePic role college publicKey statusMessage presenceStatus")
            .populate("lastMessage");

        isChat = await User.populate(isChat, {
            path: "lastMessage.senderId",
            select: "name profilePic email",
        });

        if (isChat.length > 0) {
            const exactMatch = isChat.find(c => c.participants.length === 2 && c.chatType !== 'meeting');
            if (exactMatch) {
                // Ensure chatType is set to 'direct'
                if (!exactMatch.chatType || exactMatch.chatType === 'general') {
                    exactMatch.chatType = 'direct';
                    await Chat.findByIdAndUpdate(exactMatch._id, { chatType: 'direct' });
                }
                // REVIVE CHAT if it was deleted
                if (exactMatch.deletedBy?.includes(req.user._id)) {
                    await Chat.findByIdAndUpdate(exactMatch._id, {
                        $pull: { deletedBy: req.user._id }
                    });
                }
                return res.status(200).send(exactMatch);
            }
        }

        // Create new direct chat
        const chatData = {
            chatType: 'direct',
            isGroupChat: false,
            teamId: null,
            participants: [req.user._id, userId],
            unreadCounts: {
                [req.user._id]: 0,
                [userId]: 0
            }
        };

        const createdChat = await Chat.create(chatData);
        const fullChat = await Chat.findOne({ _id: createdChat._id }).populate(
            "participants",
            "name email profilePic role college publicKey statusMessage presenceStatus"
        );

        logChatEvent('DIRECT_CHAT_CREATED', {
            chatId: createdChat._id,
            userId: req.user._id,
            metadata: { targetUserId: userId }
        });

        res.status(200).send(fullChat);

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Access or create a team chat
// @route   POST /api/chat/team/:teamId
// @access  Private
export const accessTeamChat = async (req, res) => {
    const { teamId } = req.params;

    if (!teamId) {
        return res.status(400).json({ message: "TeamId param not sent in request" });
    }

    try {
        // Validate team exists
        const team = await Team.findById(teamId);
        if (!team) {
            return res.status(404).json({ message: "Team not found" });
        }

        // Verify requesting user is a member/owner
        const currentUserIdStr = req.user._id.toString();
        const isOwner = team.createdBy?.toString() === currentUserIdStr;
        const isMember = team.members.some(m => m.toString() === currentUserIdStr);

        if (!isOwner && !isMember) {
            return res.status(403).json({ message: "Only team members can access its chat" });
        }

        // Search for existing team chat
        let existingChat = await Chat.findOne({
            teamId: team._id,
            isGroupChat: true
        })
            .populate("participants", "name email profilePic")
            .populate("lastMessage");

        existingChat = await User.populate(existingChat, {
            path: "lastMessage.senderId",
            select: "name profilePic email",
        });

        if (existingChat) {
            return res.status(200).send(existingChat);
        }

        // Create new team chat using active members
        const uniqueUsers = [...new Set([
            team.createdBy?.toString(),
            ...team.members.map(m => m.toString())
        ])].filter(Boolean); // Clean any nulls/undefined

        var chatData = {
            chatName: team.name,
            isGroupChat: true,
            teamId: team._id,
            groupAdmin: team.createdBy,
            participants: uniqueUsers,
            unreadCounts: uniqueUsers.reduce((acc, currentId) => ({ ...acc, [currentId]: 0 }), {})
        };

        const createdChat = await Chat.create(chatData);
        const fullChat = await Chat.findOne({ _id: createdChat._id }).populate(
            "participants",
            "name email profilePic"
        );
        res.status(200).send(fullChat);

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get chat history
// @route   GET /api/chat/history/:chatId
// @access  Private
export const getChatHistory = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { limit = 30, cursor } = req.query;

        // SECURITY: Verify requester is a participant
        const chat = await Chat.findById(chatId).select('participants isEncrypted encryptedChatKey chatKeyIv chatKeyAuthTag').lean();
        if (!chat || !chat.participants.some(p => p.toString() === req.user._id.toString())) {
            return res.status(403).json({ message: 'Not a member of this chat' });
        }

        const cappedLimit = Math.min(parseInt(limit) || 30, 100);

        const query = { chatId };
        if (cursor) {
            query.createdAt = { $lt: cursor };
        }

        const messages = await Message.find(query)
            .sort({ createdAt: -1 })
            .limit(cappedLimit)
            .populate('senderId', 'name profilePic');

        // Unwrap meeting key once if available
        let meetingKeyHex = null;
        if (chat.isEncrypted && chat.encryptedChatKey) {
            meetingKeyHex = unwrapMeetingKey(chat.encryptedChatKey, chat.chatKeyIv, chat.chatKeyAuthTag);
        }

        // Decrypt messages if chat is encrypted
        const decryptedMessages = messages.map(msg => {
            const msgObj = msg.toObject();
            if (msgObj.encryptedContent && msgObj.iv && msgObj.authTag) {
                const keyToUse = msgObj.keyVersion ? meetingKeyHex : null;
                msgObj.text = decryptMessage(msgObj.encryptedContent, msgObj.iv, msgObj.authTag, keyToUse);
                // Don't send encryption internals to the client
                delete msgObj.encryptedContent;
                delete msgObj.iv;
                delete msgObj.authTag;
            }
            return msgObj;
        });

        res.json(decryptedMessages.reverse());
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Send a message
// @route   POST /api/chat/send
// @access  Private
export const sendMessage = async (req, res) => {
    const { chatId, text, attachments, messageType } = req.body;

    if (!chatId || !text) {
        return res.status(400).json({ message: "Invalid data passed into request" });
    }

    try {
        // SECURITY: Verify sender is a participant
        const targetChat = await Chat.findById(chatId).select('participants isEncrypted meetingId encryptedChatKey chatKeyIv chatKeyAuthTag chatKeyVersion').lean();
        if (!targetChat || !targetChat.participants.some(p => p.toString() === req.user._id.toString())) {
            logChatEvent('CHAT_ACCESS_DENIED', { chatId, userId: req.user._id, meetingId: targetChat?.meetingId });
            return res.status(403).json({ message: 'Not a member of this chat' });
        }

        // AICTE SAMVAAD: If associated meeting has ended, chat is sealed (read-only)
        if (targetChat.meetingId) {
            const status = getMeetingStatus(targetChat.meetingId);
            if (status === 'ENDED' || status === 'completed') {
                return res.status(403).json({ message: 'Meeting chat is sealed (read-only).' });
            }
        }

        // Build message data
        const messageData = {
            senderId: req.user._id,
            chatId,
            attachments: attachments || [],
            readBy: [req.user._id],
            messageType: messageType || 'user'
        };

        // Encrypt if the chat has encryption enabled
        if (targetChat.isEncrypted && targetChat.encryptedChatKey) {
            const meetingKeyHex = unwrapMeetingKey(targetChat.encryptedChatKey, targetChat.chatKeyIv, targetChat.chatKeyAuthTag);
            const { encryptedContent, iv, authTag } = encryptMessage(text, meetingKeyHex);
            messageData.text = '[Encrypted]';
            messageData.encryptedContent = encryptedContent;
            messageData.iv = iv;
            messageData.authTag = authTag;
            messageData.keyVersion = targetChat.chatKeyVersion || 1;
        } else if (targetChat.isEncrypted) {
            // Missing encryption key for encrypted chat
            logChatEvent('CHAT_KEY_ACCESS_DENIED', { chatId, userId: req.user._id, meetingId: targetChat.meetingId });
            return res.status(500).json({ message: 'Meeting encryption key unavailable. Message was not sent.' });
        } else {
            messageData.text = text;
        }

        let message = await Message.create(messageData);

        // Populate sender info for immediate UI update
        message = await message.populate("senderId", "name profilePic");
        message = await message.populate("chatId");

        // Populate participants in the chat object inside message
        message = await User.populate(message, {
            path: "chatId.participants",
            select: "name profilePic email status pushToken",
        });

        // Verify chat exists and update lastMessage
        // KEY CHANGE: Revive chat for anyone who "deleted" it
        await Chat.findByIdAndUpdate(chatId, {
            lastMessage: message,
            $set: { deletedBy: [] } // Simple revive for everyone
        });

        // Update Chat: lastMessage and increment unread count for OTHERS
        const chat = await Chat.findById(chatId);
        if (!chat) return res.status(404).json({ message: "Chat not found" });

        // Increment unread for all participants except sender
        chat.participants.forEach(p => {
            if (p.toString() !== req.user._id.toString()) {
                const currentUnread = chat.unreadCounts.get(p.toString()) || 0;
                chat.unreadCounts.set(p.toString(), currentUnread + 1);
            }
        });
        await chat.save(); // Save unread counts

        // For encrypted chats, return the decrypted text to the sender's response
        const responseMessage = message.toObject();
        if (targetChat.isEncrypted && responseMessage.encryptedContent) {
            responseMessage.text = text; // Original plaintext for sender
            delete responseMessage.encryptedContent;
            delete responseMessage.iv;
            delete responseMessage.authTag;
        }

        res.status(201).json({ message: responseMessage });

        // Audit log (fire-and-forget)
        logChatEvent('MESSAGE_SENT', {
            chatId,
            userId: req.user._id,
            messageId: message._id,
            meetingId: targetChat.meetingId
        });

        // Emit socket event to all participants
        const io = getIO();
        io.to(`chat:${chat._id}`).emit('message:new', message);

        chat.participants.forEach(async (participantId) => {
            const partIdStr = participantId.toString();

            // Emit to User Room (for In-App Toasts)
            // Skip sender to avoid self-toast (handled on frontend too, but good for bandwidth)
            if (partIdStr !== req.user._id.toString()) {
                io.to(`user:${partIdStr}`).emit('message:new', message);
            }

            // PUSH NOTIFICATION LOGIC
            if (partIdStr !== req.user._id.toString()) {
                const isOnline = isUserOnline(partIdStr);

                // Fetch full participant to get pushToken
                // We could have populated it in the loop above or fetched here
                // Optimization: fetch token only if offline
                if (!isOnline) {
                    try {
                        const user = await User.findById(participantId).select('pushToken name');
                        if (user && user.pushToken) {
                            await admin.messaging().send({
                                token: user.pushToken,
                                notification: {
                                    title: req.user.name,
                                    body: text.length > 50 ? text.substring(0, 50) + "..." : text,
                                },
                                data: {
                                    type: 'MESSAGE',
                                    chatId: chat._id.toString(),
                                    senderId: req.user._id.toString()
                                }
                            });
                        }
                    } catch (pushErr) {
                        console.error(`[Push Error] Failed to send to user ${partIdStr}:`, pushErr.message);
                    }
                }
            }
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark messages as read
// @route   POST /api/chat/read
// @access  Private
export const markRead = async (req, res) => {
    try {
        const { chatId } = req.body;
        const userId = req.user._id;

        // Update messages
        await Message.updateMany(
            { chatId, readBy: { $ne: userId } },
            { $addToSet: { readBy: userId } }
        );

        // Reset unread count for this user in the Chat model
        const chat = await Chat.findById(chatId);
        if (chat) {
            chat.unreadCounts.set(userId.toString(), 0);
            await chat.save();
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single chat by ID
// @route   GET /api/chat/:chatId
// @access  Private
export const getChatById = async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.chatId)
            .populate('participants', 'name email profilePic status lastSeen')
            .populate('lastMessage');

        if (!chat) return res.status(404).json({ message: "Chat not found" });

        // REVIVE CHAT if it was deleted by this user but they are visiting it directly now
        if (chat.deletedBy?.includes(req.user._id)) {
            await Chat.findByIdAndUpdate(chat._id, {
                $pull: { deletedBy: req.user._id }
            });
        }

        // SECURITY: Verify requester is a participant
        if (!chat.participants.some(p => p._id.toString() === req.user._id.toString())) {
            return res.status(403).json({ message: 'Not a member of this chat' });
        }

        await User.populate(chat, {
            path: "lastMessage.senderId",
            select: "name profilePic email",
        });

        res.json(chat);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// @desc    Create Group Chat
// @route   POST /api/chat/group
// @access  Private
export const createGroupChat = async (req, res) => {
    const { name, users: rawUsers, description } = req.body;
    if (!rawUsers || !name) {
        return res.status(400).json({ message: "Group name and members are required" });
    }

    let users = [];
    if (typeof rawUsers === 'string') {
        try { users = JSON.parse(rawUsers); } catch { users = [rawUsers]; }
    } else if (Array.isArray(rawUsers)) {
        users = rawUsers;
    }

    if (users.length < 1) {
        return res.status(400).json({ message: "At least 1 other member is required to form a group chat" });
    }

    const adminId = req.user._id.toString();
    const uniqueUsers = [...new Set([...users, adminId])];

    try {
        const groupChat = await Chat.create({
            chatName: name,
            description: description || '',
            chatType: 'group',
            isGroupChat: true,
            groupAdmin: req.user._id,
            participants: uniqueUsers,
            groupKeyVersion: 1,
            unreadCounts: uniqueUsers.reduce((acc, userId) => ({ ...acc, [userId]: 0 }), {})
        });

        const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
            .populate("participants", "-password")
            .populate("groupAdmin", "-password");

        logChatEvent('GROUP_CREATED', {
            chatId: groupChat._id,
            userId: req.user._id,
            metadata: { groupName: name, memberCount: uniqueUsers.length }
        });

        res.status(200).json(fullGroupChat);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Rename Group
// @route   PUT /api/chat/rename
// @access  Private
export const renameGroup = async (req, res) => {
    const { chatId, chatName, description } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) {
        return res.status(404).json({ message: "Chat Not Found" });
    }
    if (!chat.groupAdmin || chat.groupAdmin.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Only group admin can rename the group' });
    }

    chat.chatName = chatName || chat.chatName;
    if (description !== undefined) chat.description = description;
    await chat.save();

    logChatEvent('GROUP_RENAMED', {
        chatId: chat._id,
        userId: req.user._id,
        metadata: { newName: chat.chatName }
    });

    const updatedChat = await Chat.findById(chatId)
        .populate("participants", "-password")
        .populate("groupAdmin", "-password");

    res.json(updatedChat);
};

// @desc    Add user to Group
// @route   PUT /api/chat/groupadd
// @access  Private
export const addToGroup = async (req, res) => {
    const { chatId, userId } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) {
        return res.status(404).json({ message: "Chat Not Found" });
    }
    if (!chat.groupAdmin || chat.groupAdmin.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Only group admin can add members' });
    }

    const added = await Chat.findByIdAndUpdate(
        chatId,
        {
            $addToSet: { participants: userId },
            $inc: { groupKeyVersion: 1 }
        },
        { new: true }
    )
        .populate("participants", "-password")
        .populate("groupAdmin", "-password");

    logChatEvent('GROUP_MEMBER_ADDED', {
        chatId: chat._id,
        userId: req.user._id,
        metadata: { addedUserId: userId }
    });

    res.json(added);
};

// @desc    Remove user from Group
// @route   PUT /api/chat/groupremove
// @access  Private
export const removeFromGroup = async (req, res) => {
    const { chatId, userId } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) {
        return res.status(404).json({ message: "Chat Not Found" });
    }
    if (!chat.groupAdmin || chat.groupAdmin.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Only group admin can remove members' });
    }

    const removed = await Chat.findByIdAndUpdate(
        chatId,
        {
            $pull: { participants: userId },
            $unset: { [`unreadCounts.${userId}`]: "" },
            $inc: { groupKeyVersion: 1 }
        },
        { new: true }
    )
        .populate("participants", "-password")
        .populate("groupAdmin", "-password");

    logChatEvent('GROUP_MEMBER_REMOVED', {
        chatId: chat._id,
        userId: req.user._id,
        metadata: { removedUserId: userId }
    });

    res.json(removed);
};


// @desc    Leave Group (User removes self)
// @route   PUT /api/chat/leave
// @access  Private
export const leaveGroup = async (req, res) => {
    const { chatId } = req.body;

    // remove self from participants
    const removed = await Chat.findByIdAndUpdate(
        chatId,
        { $pull: { participants: req.user._id } },
        { new: true }
    );

    if (!removed) {
        res.status(404);
        throw new Error("Chat Not Found");
    }

    res.json({ message: "Left Group Successfully", chatId });
};

// @desc    Delete Chat (Hide from user)
// @route   PUT /api/chat/delete
// @access  Private
export const deleteChat = async (req, res) => {
    const { chatId } = req.body;

    const hidden = await Chat.findByIdAndUpdate(
        chatId,
        { $addToSet: { deletedBy: req.user._id } },
        { new: true }
    );

    if (!hidden) {
        res.status(404);
        throw new Error("Chat Not Found");
    }

    res.json({ message: "Chat Deleted (Hidden)", chatId });
};

// ============================================================
// AICTE SAMVAAD: Meeting Chat Functions
// ============================================================

// @desc    Access or create a meeting-specific chat
// @route   POST /api/chat/meeting/:meetingId
// @access  Private
export const accessMeetingChat = async (req, res) => {
    const { meetingId } = req.params;
    const { meetingTitle, participants: participantIds } = req.body;

    if (!meetingId) {
        return res.status(400).json({ message: 'meetingId is required' });
    }

    try {
        // Check if meeting chat already exists
        let existingChat = await Chat.findOne({
            meetingId,
            chatType: 'meeting'
        })
            .populate('participants', 'name email profilePic')
            .populate('lastMessage');

        if (existingChat) {
            // Verify requesting user is a participant
            const isParticipant = existingChat.participants.some(
                p => p._id.toString() === req.user._id.toString()
            );

            if (!isParticipant) {
                // Add user to the meeting chat if they provide valid participant list
                existingChat = await Chat.findByIdAndUpdate(
                    existingChat._id,
                    { $addToSet: { participants: req.user._id } },
                    { new: true }
                )
                    .populate('participants', 'name email profilePic')
                    .populate('lastMessage');

                logChatEvent('MEETING_CHAT_JOINED', {
                    meetingId,
                    chatId: existingChat._id,
                    userId: req.user._id
                });
            }

            return res.status(200).json(existingChat);
        }

        // Create new meeting chat
        const chatParticipants = participantIds && participantIds.length > 0
            ? [...new Set([req.user._id.toString(), ...participantIds])]
            : [req.user._id.toString()];
            
        const meetingKey = generateMeetingKey();
        const wrappedKey = wrapMeetingKey(meetingKey);

        const chatData = {
            chatName: meetingTitle || `Meeting: ${meetingId}`,
            isGroupChat: true,
            chatType: 'meeting',
            meetingId,
            isEncrypted: true,
            ...wrappedKey,
            chatKeyVersion: 1,
            groupAdmin: req.user._id,
            participants: chatParticipants,
            unreadCounts: chatParticipants.reduce((acc, uid) => ({ ...acc, [uid]: 0 }), {})
        };

        const createdChat = await Chat.create(chatData);
        const fullChat = await Chat.findById(createdChat._id)
            .populate('participants', 'name email profilePic');

        logChatEvent('MEETING_CHAT_KEY_CREATED', {
            meetingId,
            chatId: createdChat._id,
            userId: req.user._id,
            metadata: { keyVersion: 1 }
        });

        logChatEvent('CHAT_CREATED', {
            meetingId,
            chatId: createdChat._id,
            userId: req.user._id,
            metadata: { chatType: 'meeting', meetingTitle }
        });

        res.status(201).json(fullChat);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get chat history for a meeting
// @route   GET /api/chat/meeting/:meetingId/history
// @access  Private
export const getMeetingChatHistory = async (req, res) => {
    try {
        const { meetingId } = req.params;
        const { limit = 50, cursor } = req.query;

        // Find the meeting chat
        const chat = await Chat.findOne({
            meetingId,
            chatType: 'meeting'
        }).select('_id participants isEncrypted encryptedChatKey chatKeyIv chatKeyAuthTag').lean();

        if (!chat) {
            return res.status(404).json({ message: 'Meeting chat not found' });
        }

        // SECURITY: Verify requester is a participant
        if (!chat.participants.some(p => p.toString() === req.user._id.toString())) {
            logChatEvent('CHAT_ACCESS_DENIED', {
                meetingId,
                chatId: chat._id,
                userId: req.user._id
            });
            return res.status(403).json({ message: 'Not a participant of this meeting' });
        }

        const cappedLimit = Math.min(parseInt(limit) || 50, 100);
        const query = { chatId: chat._id };
        if (cursor) {
            query.createdAt = { $lt: cursor };
        }

        const messages = await Message.find(query)
            .sort({ createdAt: -1 })
            .limit(cappedLimit)
            .populate('senderId', 'name profilePic');

        // Unwrap meeting key once if available
        let meetingKeyHex = null;
        if (chat.isEncrypted && chat.encryptedChatKey) {
            meetingKeyHex = unwrapMeetingKey(chat.encryptedChatKey, chat.chatKeyIv, chat.chatKeyAuthTag);
        }

        // Decrypt messages
        const decryptedMessages = messages.map(msg => {
            const msgObj = msg.toObject();
            if (msgObj.encryptedContent && msgObj.iv && msgObj.authTag) {
                const keyToUse = msgObj.keyVersion ? meetingKeyHex : null;
                msgObj.text = decryptMessage(msgObj.encryptedContent, msgObj.iv, msgObj.authTag, keyToUse);
                delete msgObj.encryptedContent;
                delete msgObj.iv;
                delete msgObj.authTag;
            }
            return msgObj;
        });

        res.json({
            chatId: chat._id,
            meetingId,
            messages: decryptedMessages.reverse()
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
