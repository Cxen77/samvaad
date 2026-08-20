import Chat from '../models/Chat.js';
import User from '../models/User.js';
import Message from '../models/Message.js';
import CallHistory from '../models/CallHistory.js';

// In-memory Call state tracking
// activeCalls: callId -> { callId, conversationId, callerId, calleeId, callType, status, startedAt, timeoutTimer }
const activeCalls = new Map();
// userActiveCall: userId -> callId
const userActiveCall = new Map();

// Helper to format call duration into human readable string
const formatDuration = (seconds) => {
    if (!seconds || seconds <= 0) return '0 sec';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    if (m === 0) return `${s} sec`;
    return `${m} min ${s} sec`;
};

// Helper to clean call state
const cleanupCallState = (callId) => {
    const call = activeCalls.get(callId);
    if (call) {
        if (call.timeoutTimer) clearTimeout(call.timeoutTimer);
        userActiveCall.delete(call.callerId.toString());
        userActiveCall.delete(call.calleeId.toString());
        activeCalls.delete(callId);
    }
};

export const initDirectCallSocket = (io, socket) => {
    const userId = socket.mongoUser?._id?.toString();
    if (!userId) return;

    // 1. CALL_INITIATE
    socket.on('CALL_INITIATE', async ({ calleeId, conversationId, callType }) => {
        try {
            const calleeIdStr = (typeof calleeId === 'object' && calleeId?._id) ? calleeId._id.toString() : (calleeId?.toString() || '');

            if (!calleeIdStr || !conversationId || !['voice', 'video'].includes(callType)) {
                return socket.emit('CALL_ERROR', { message: 'Invalid call initiation parameters' });
            }

            if (calleeIdStr === userId) {
                return socket.emit('CALL_ERROR', { message: 'You cannot call yourself' });
            }

            // Security Authorization: Verify caller & callee belong to the direct conversation
            const chat = await Chat.findOne({
                _id: conversationId,
                participants: { $in: [userId] }
            });

            if (!chat) {
                return socket.emit('CALL_ERROR', { message: 'Not authorized to initiate call in this conversation' });
            }

            // Active call checks
            if (userActiveCall.has(userId)) {
                return socket.emit('CALL_ERROR', { message: 'You are already in an active call' });
            }

            const calleeUser = await User.findById(calleeIdStr).select('name profilePic role college');
            if (!calleeUser) {
                return socket.emit('CALL_ERROR', { message: 'Recipient user not found' });
            }

            if (userActiveCall.has(calleeId)) {
                // Callee is Busy
                const busyCallId = `CALL-BUSY-${Date.now()}`;
                await CallHistory.create({
                    callId: busyCallId,
                    conversationId,
                    callerId: userId,
                    calleeId,
                    callType,
                    status: 'BUSY',
                    duration: 0
                });

                // Emit busy to caller
                socket.emit('CALL_BUSY', {
                    callId: busyCallId,
                    callee: calleeUser,
                    message: `${calleeUser.name} is currently on another call`
                });

                // Post system message in chat
                const sysMsgText = callType === 'video' ? 'Missed video call (User busy)' : 'Missed voice call (User busy)';
                const sysMsg = await Message.create({
                    chatId: conversationId,
                    senderId: userId,
                    text: sysMsgText,
                    messageType: 'call'
                });
                io.to(conversationId).emit('message:new', sysMsg);
                return;
            }

            // Initiate Call
            const callId = `CALL-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

            // Ringing Timeout Timer (30s)
            const timeoutTimer = setTimeout(async () => {
                const ringingCall = activeCalls.get(callId);
                if (ringingCall && ringingCall.status === 'RINGING') {
                    // Record Missed Call
                    await CallHistory.create({
                        callId,
                        conversationId,
                        callerId: userId,
                        calleeId,
                        callType,
                        status: 'MISSED',
                        duration: 0
                    });

                    // Notify both sides of timeout
                    io.to(`user:${userId}`).emit('CALL_TIMEOUT', { callId, message: 'No answer' });
                    io.to(`user:${calleeId}`).emit('CALL_TIMEOUT', { callId, message: 'Missed call' });

                    // Post Chat Timeline System Message
                    const missedText = callType === 'video' ? 'Missed video call' : 'Missed voice call';
                    const sysMsg = await Message.create({
                        chatId: conversationId,
                        senderId: userId,
                        text: missedText,
                        messageType: 'call'
                    });
                    io.to(conversationId).emit('message:new', sysMsg);

                    cleanupCallState(callId);
                }
            }, 30000);

            const callObj = {
                callId,
                conversationId,
                callerId: userId,
                calleeId,
                callType,
                status: 'RINGING',
                startedAt: null,
                timeoutTimer
            };

            activeCalls.set(callId, callObj);
            userActiveCall.set(userId, callId);
            userActiveCall.set(calleeId, callId);

            const callerUser = {
                _id: socket.mongoUser._id,
                name: socket.mongoUser.name,
                profilePic: socket.mongoUser.profilePic,
                role: socket.mongoUser.role,
                college: socket.mongoUser.college
            };

            // Send Incoming Call signal to recipient's personal socket room
            io.to(`user:${calleeId}`).emit('CALL_INCOMING', {
                callId,
                conversationId,
                caller: callerUser,
                callType
            });

            // Ack Caller
            socket.emit('CALL_OUTGOING_ACK', {
                callId,
                conversationId,
                callee: calleeUser,
                callType
            });

        } catch (err) {
            console.error('[Socket DirectCall] CALL_INITIATE error:', err);
            socket.emit('CALL_ERROR', { message: 'Internal server error during call initiation' });
        }
    });

    // 2. CALL_ACCEPT
    socket.on('CALL_ACCEPT', async ({ callId }) => {
        try {
            const call = activeCalls.get(callId);
            if (!call || call.calleeId.toString() !== userId) {
                return socket.emit('CALL_ERROR', { message: 'Invalid call session' });
            }

            if (call.timeoutTimer) clearTimeout(call.timeoutTimer);
            call.status = 'CONNECTED';
            call.startedAt = new Date();

            // Notify caller that call is accepted
            io.to(`user:${call.callerId}`).emit('CALL_ACCEPTED', { callId });
        } catch (err) {
            console.error('[Socket DirectCall] CALL_ACCEPT error:', err);
        }
    });

    // 3. CALL_REJECT
    socket.on('CALL_REJECT', async ({ callId }) => {
        try {
            const call = activeCalls.get(callId);
            if (!call || call.calleeId.toString() !== userId) return;

            if (call.timeoutTimer) clearTimeout(call.timeoutTimer);

            await CallHistory.create({
                callId,
                conversationId: call.conversationId,
                callerId: call.callerId,
                calleeId: call.calleeId,
                callType: call.callType,
                status: 'REJECTED',
                duration: 0
            });

            // Notify caller
            io.to(`user:${call.callerId}`).emit('CALL_REJECTED', { callId, message: 'Call declined' });

            // Post System Message
            const rejText = call.callType === 'video' ? 'Missed video call (Declined)' : 'Missed voice call (Declined)';
            const sysMsg = await Message.create({
                chatId: call.conversationId,
                senderId: call.callerId,
                text: rejText,
                messageType: 'call'
            });
            io.to(call.conversationId).emit('message:new', sysMsg);

            cleanupCallState(callId);
        } catch (err) {
            console.error('[Socket DirectCall] CALL_REJECT error:', err);
        }
    });

    // 4. CALL_CANCEL
    socket.on('CALL_CANCEL', async ({ callId }) => {
        try {
            const call = activeCalls.get(callId);
            if (!call || call.callerId.toString() !== userId) return;

            if (call.timeoutTimer) clearTimeout(call.timeoutTimer);

            await CallHistory.create({
                callId,
                conversationId: call.conversationId,
                callerId: call.callerId,
                calleeId: call.calleeId,
                callType: call.callType,
                status: 'CANCELLED',
                duration: 0
            });

            // Notify callee
            io.to(`user:${call.calleeId}`).emit('CALL_CANCELLED', { callId, message: 'Call cancelled' });

            cleanupCallState(callId);
        } catch (err) {
            console.error('[Socket DirectCall] CALL_CANCEL error:', err);
        }
    });

    // 5. CALL_OFFER (WebRTC Signaling)
    socket.on('CALL_OFFER', ({ callId, sdp }) => {
        const call = activeCalls.get(callId);
        if (!call) return;
        const targetUserId = (userId === call.callerId.toString()) ? call.calleeId : call.callerId;
        io.to(`user:${targetUserId}`).emit('CALL_OFFER', { callId, sdp, senderId: userId });
    });

    // 6. CALL_ANSWER (WebRTC Signaling)
    socket.on('CALL_ANSWER', ({ callId, sdp }) => {
        const call = activeCalls.get(callId);
        if (!call) return;
        const targetUserId = (userId === call.callerId.toString()) ? call.calleeId : call.callerId;
        io.to(`user:${targetUserId}`).emit('CALL_ANSWER', { callId, sdp, senderId: userId });
    });

    // 7. CALL_ICE_CANDIDATE (WebRTC Signaling)
    socket.on('CALL_ICE_CANDIDATE', ({ callId, candidate }) => {
        const call = activeCalls.get(callId);
        if (!call) return;
        const targetUserId = (userId === call.callerId.toString()) ? call.calleeId : call.callerId;
        io.to(`user:${targetUserId}`).emit('CALL_ICE_CANDIDATE', { callId, candidate, senderId: userId });
    });

    // 8. CALL_CAMERA_TOGGLE
    socket.on('CALL_CAMERA_TOGGLE', ({ callId, enabled }) => {
        const call = activeCalls.get(callId);
        if (!call) return;
        const targetUserId = (userId === call.callerId.toString()) ? call.calleeId : call.callerId;
        io.to(`user:${targetUserId}`).emit('CALL_CAMERA_TOGGLE', { callId, enabled, senderId: userId });
    });

    // 9. CALL_MIC_TOGGLE
    socket.on('CALL_MIC_TOGGLE', ({ callId, enabled }) => {
        const call = activeCalls.get(callId);
        if (!call) return;
        const targetUserId = (userId === call.callerId.toString()) ? call.calleeId : call.callerId;
        io.to(`user:${targetUserId}`).emit('CALL_MIC_TOGGLE', { callId, enabled, senderId: userId });
    });

    // 10. CALL_END
    socket.on('CALL_END', async ({ callId }) => {
        try {
            const call = activeCalls.get(callId);
            if (!call) return;

            const targetUserId = (userId === call.callerId.toString()) ? call.calleeId : call.callerId;
            io.to(`user:${targetUserId}`).emit('CALL_ENDED', { callId, endedBy: userId });

            const endedAt = new Date();
            const duration = call.startedAt ? Math.floor((endedAt.getTime() - new Date(call.startedAt).getTime()) / 1000) : 0;

            await CallHistory.create({
                callId,
                conversationId: call.conversationId,
                callerId: call.callerId,
                calleeId: call.calleeId,
                callType: call.callType,
                status: 'COMPLETED',
                startedAt: call.startedAt,
                endedAt,
                duration
            });

            // Post Chat History Metadata Message
            const callName = call.callType === 'video' ? 'Video call' : 'Voice call';
            const callMsgText = `${callName} • ${formatDuration(duration)}`;
            const sysMsg = await Message.create({
                chatId: call.conversationId,
                senderId: userId,
                text: callMsgText,
                messageType: 'call'
            });
            io.to(call.conversationId).emit('message:new', sysMsg);

            cleanupCallState(callId);
        } catch (err) {
            console.error('[Socket DirectCall] CALL_END error:', err);
        }
    });

    // Handle Disconnect
    socket.on('disconnect', () => {
        const callId = userActiveCall.get(userId);
        if (callId) {
            const call = activeCalls.get(callId);
            if (call) {
                const targetUserId = (userId === call.callerId.toString()) ? call.calleeId : call.callerId;
                io.to(`user:${targetUserId}`).emit('CALL_ENDED', { callId, reason: 'Peer disconnected' });
                cleanupCallState(callId);
            }
        }
    });
};
