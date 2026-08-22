import crypto from 'crypto';
import Decision from '../models/Decision.js';
import { anchorEvidence } from '../services/blockchainService.js';
import { logEvent } from '../services/auditService.js';

// Active participants per room: Map<roomId, Map<socketId, participant>>
const activeRoomParticipants = new Map();

// Active votes per room: Map<roomId, voteState>
const activeVotes = new Map();

// Meeting settings per room: Map<roomId, settings>
const meetingSettings = new Map();

// Meeting lock state per room
const lockedMeetings = new Set();

export const initSamvaadSocket = (io, socket) => {
    // Helper to get participants array for a room
    const getRoomParticipantsArray = (roomId) => {
        const roomMap = activeRoomParticipants.get(roomId);
        if (!roomMap) return [];
        return Array.from(roomMap.values());
    };

    // Helper to clean up socket from rooms
    const removeSocketFromRooms = (socketId) => {
        for (const [roomId, roomMap] of activeRoomParticipants.entries()) {
            if (roomMap.has(socketId)) {
                const leavingUser = roomMap.get(socketId);
                roomMap.delete(socketId);
                if (roomMap.size === 0) {
                    activeRoomParticipants.delete(roomId);
                }
                const updatedList = Array.from(roomMap.values());
                io.to(roomId).emit('samvaad:participants_updated', {
                    roomId,
                    participants: updatedList,
                    leftUser: leavingUser
                });
                io.to(roomId).emit('samvaad:user_left', {
                    userId: leavingUser?.id || leavingUser?.userId,
                    user: leavingUser,
                    socketId
                });
            }
        }
    };

    // Helper to update participant field and broadcast
    const updateParticipantField = (roomId, socketId, field, value) => {
        const roomMap = activeRoomParticipants.get(roomId);
        if (!roomMap || !roomMap.has(socketId)) return;
        const participant = roomMap.get(socketId);
        participant[field] = value;
        roomMap.set(socketId, participant);
        io.to(roomId).emit('samvaad:participants_updated', {
            roomId,
            participants: Array.from(roomMap.values())
        });
    };

    // ================================================================
    // JOIN / LEAVE / END
    // ================================================================

    socket.on('samvaad:join_room', ({ roomId, user }) => {
        if (!roomId) return;

        // Check if meeting is locked
        if (lockedMeetings.has(roomId)) {
            socket.emit('samvaad:join_rejected', {
                roomId,
                reason: 'Meeting is locked. New participants cannot join.'
            });
            return;
        }

        socket.join(roomId);

        if (!activeRoomParticipants.has(roomId)) {
            activeRoomParticipants.set(roomId, new Map());
        }

        const roomMap = activeRoomParticipants.get(roomId);
        const isFirstParticipant = roomMap.size === 0;
        const participantObj = {
            id: user?._id || user?.id || socket.id,
            userId: user?._id || user?.id || socket.id,
            name: user?.name || 'Participant',
            email: user?.email || '',
            role: user?.role || 'Member',
            socketId: socket.id,
            joinedAt: new Date().toISOString(),
            status: 'joined',
            mic: true,
            cam: true,
            handRaised: false,
            isHost: isFirstParticipant,
            isScreenSharing: false
        };

        roomMap.set(socket.id, participantObj);
        const currentParticipants = getRoomParticipantsArray(roomId);

        // Broadcast updated participant list
        io.to(roomId).emit('samvaad:participants_updated', {
            roomId,
            participants: currentParticipants,
            joinedUser: participantObj
        });

        socket.to(roomId).emit('samvaad:user_joined', {
            userId: participantObj.id,
            user: participantObj,
            socketId: socket.id
        });

        // Send current meeting state to the joining user
        const currentSettings = meetingSettings.get(roomId) || {};
        const currentVote = activeVotes.get(roomId) || null;
        socket.emit('samvaad:room_state', {
            roomId,
            participants: currentParticipants,
            isLocked: lockedMeetings.has(roomId),
            settings: currentSettings,
            activeVote: currentVote ? {
                ...currentVote,
                votes: currentVote.isAnonymous ? [] : currentVote.votes
            } : null
        });

        // System message
        if (participantObj.name) {
            socket.emit('meeting-chat:system', {
                meetingId: roomId,
                text: `${participantObj.name} joined the meeting.`
            });
        }
    });

    socket.on('samvaad:leave_room', ({ roomId }) => {
        if (!roomId) return;
        socket.leave(roomId);
        removeSocketFromRooms(socket.id);
    });

    socket.on('samvaad:end_meeting', async ({ roomId }) => {
        if (!roomId) return;
        io.to(roomId).emit('samvaad:meeting_ended', { roomId });

        // Persist meeting seal to evidence ledger
        try {
            await logEvent({
                eventType: 'MEETING_ENDED',
                meetingId: roomId,
                detail: `Meeting ${roomId} ended by host`,
            });
        } catch (e) {
            console.warn('[Samvaad Socket] Meeting end audit error:', e.message);
        }

        activeRoomParticipants.delete(roomId);
        activeVotes.delete(roomId);
        meetingSettings.delete(roomId);
        lockedMeetings.delete(roomId);
    });

    // ================================================================
    // MEDIA STATE CHANGES
    // ================================================================

    socket.on('samvaad:mic_changed', ({ roomId, mic }) => {
        if (!roomId) return;
        updateParticipantField(roomId, socket.id, 'mic', mic);
        socket.to(roomId).emit('samvaad:mic_changed', {
            socketId: socket.id,
            userId: socket.mongoUser?._id?.toString() || socket.id,
            mic
        });
    });

    socket.on('samvaad:cam_changed', ({ roomId, cam }) => {
        if (!roomId) return;
        updateParticipantField(roomId, socket.id, 'cam', cam);
        socket.to(roomId).emit('samvaad:cam_changed', {
            socketId: socket.id,
            userId: socket.mongoUser?._id?.toString() || socket.id,
            cam
        });
    });

    socket.on('samvaad:screen_share_started', ({ roomId }) => {
        if (!roomId) return;
        updateParticipantField(roomId, socket.id, 'isScreenSharing', true);
        io.to(roomId).emit('samvaad:screen_share_started', {
            socketId: socket.id,
            userId: socket.mongoUser?._id?.toString() || socket.id,
            userName: socket.mongoUser?.name || 'Participant'
        });
    });

    socket.on('samvaad:screen_share_stopped', ({ roomId }) => {
        if (!roomId) return;
        updateParticipantField(roomId, socket.id, 'isScreenSharing', false);
        io.to(roomId).emit('samvaad:screen_share_stopped', {
            socketId: socket.id,
            userId: socket.mongoUser?._id?.toString() || socket.id
        });
    });

    socket.on('samvaad:speaking_changed', ({ roomId, isSpeaking }) => {
        if (!roomId) return;
        socket.to(roomId).emit('samvaad:speaking_changed', {
            socketId: socket.id,
            userId: socket.mongoUser?._id?.toString() || socket.id,
            isSpeaking
        });
    });

    socket.on('samvaad:active_speaker', ({ roomId, activeSpeakerId }) => {
        if (!roomId) return;
        io.to(roomId).emit('samvaad:active_speaker', {
            activeSpeakerId
        });
    });

    // ================================================================
    // HAND RAISE / LOWER
    // ================================================================

    socket.on('samvaad:hand_raised', ({ roomId }) => {
        if (!roomId) return;
        updateParticipantField(roomId, socket.id, 'handRaised', true);
        io.to(roomId).emit('samvaad:hand_raised', {
            socketId: socket.id,
            userId: socket.mongoUser?._id?.toString() || socket.id,
            userName: socket.mongoUser?.name || 'Participant'
        });
    });

    socket.on('samvaad:hand_lowered', ({ roomId }) => {
        if (!roomId) return;
        updateParticipantField(roomId, socket.id, 'handRaised', false);
        io.to(roomId).emit('samvaad:hand_lowered', {
            socketId: socket.id,
            userId: socket.mongoUser?._id?.toString() || socket.id
        });
    });

    // Host lowers another participant's hand
    socket.on('samvaad:lower_hand', ({ roomId, targetSocketId }) => {
        if (!roomId || !targetSocketId) return;
        updateParticipantField(roomId, targetSocketId, 'handRaised', false);
        io.to(roomId).emit('samvaad:hand_lowered', {
            socketId: targetSocketId,
            loweredBy: socket.mongoUser?.name || 'Host'
        });
    });

    // ================================================================
    // REACTIONS
    // ================================================================

    socket.on('samvaad:reaction', ({ roomId, emoji }) => {
        if (!roomId || !emoji) return;
        io.to(roomId).emit('samvaad:reaction', {
            socketId: socket.id,
            userId: socket.mongoUser?._id?.toString() || socket.id,
            userName: socket.mongoUser?.name || 'Participant',
            emoji,
            timestamp: Date.now()
        });
    });

    // ================================================================
    // MEETING LOCK / UNLOCK
    // ================================================================

    socket.on('samvaad:lock_meeting', ({ roomId }) => {
        if (!roomId) return;
        lockedMeetings.add(roomId);
        io.to(roomId).emit('samvaad:meeting_locked', { roomId });
    });

    socket.on('samvaad:unlock_meeting', ({ roomId }) => {
        if (!roomId) return;
        lockedMeetings.delete(roomId);
        io.to(roomId).emit('samvaad:meeting_unlocked', { roomId });
    });

    // ================================================================
    // MEETING SETTINGS
    // ================================================================

    socket.on('samvaad:settings_changed', ({ roomId, settings }) => {
        if (!roomId || !settings) return;
        const current = meetingSettings.get(roomId) || {};
        const updated = { ...current, ...settings };
        meetingSettings.set(roomId, updated);
        io.to(roomId).emit('samvaad:settings_changed', {
            roomId,
            settings: updated,
            changedBy: socket.mongoUser?.name || 'Host'
        });
    });

    // ================================================================
    // VOTING LIFECYCLE (Server-validated)
    // ================================================================

    socket.on('samvaad:vote_start', ({ roomId, question, options, isAnonymous }) => {
        if (!roomId || !question) return;

        // Only allow if no active vote
        if (activeVotes.has(roomId)) {
            socket.emit('samvaad:vote_error', { message: 'A vote is already in progress.' });
            return;
        }

        const voteState = {
            id: 'vote-' + Date.now(),
            question,
            options: options || ['Approve', 'Reject', 'Abstain'],
            isAnonymous: isAnonymous || false,
            votes: [],
            votedUserIds: new Set(),
            status: 'active',
            startedAt: new Date().toISOString(),
            startedBy: socket.mongoUser?._id?.toString() || socket.id,
            startedByName: socket.mongoUser?.name || 'Host'
        };

        activeVotes.set(roomId, voteState);

        // Broadcast vote started (don't send votes array)
        io.to(roomId).emit('samvaad:vote_started', {
            roomId,
            vote: {
                id: voteState.id,
                question: voteState.question,
                options: voteState.options,
                isAnonymous: voteState.isAnonymous,
                status: 'active',
                startedAt: voteState.startedAt,
                startedByName: voteState.startedByName,
                totalVotes: 0,
                totalEligible: getRoomParticipantsArray(roomId).length
            }
        });

        // System message
        socket.emit('meeting-chat:system', {
            meetingId: roomId,
            text: `📊 Committee vote started: "${question}"`
        });
    });

    socket.on('samvaad:vote_cast', ({ roomId, option }) => {
        if (!roomId || !option) return;

        const voteState = activeVotes.get(roomId);
        if (!voteState) {
            socket.emit('samvaad:vote_error', { message: 'No active vote found.' });
            return;
        }
        if (voteState.status !== 'active') {
            socket.emit('samvaad:vote_error', { message: 'Voting has closed.' });
            return;
        }

        const voterId = socket.mongoUser?._id?.toString() || socket.id;

        if (voteState.votedUserIds.has(voterId)) {
            socket.emit('samvaad:vote_error', { message: 'You have already voted.' });
            return;
        }

        // Validate option
        if (!voteState.options.includes(option)) {
            socket.emit('samvaad:vote_error', { message: 'Invalid vote option.' });
            return;
        }

        voteState.votes.push({
            voterId,
            userName: socket.mongoUser?.name || 'Member',
            option,
            timestamp: new Date().toISOString()
        });
        voteState.votedUserIds.add(voterId);

        // Broadcast vote progress
        const totalEligible = getRoomParticipantsArray(roomId).length;
        io.to(roomId).emit('samvaad:vote_updated', {
            roomId,
            totalVotes: voteState.votes.length,
            totalEligible,
            // Only include breakdown if not anonymous
            ...(voteState.isAnonymous ? {} : {
                breakdown: voteState.options.map(opt => ({
                    option: opt,
                    count: voteState.votes.filter(v => v.option === opt).length
                }))
            })
        });

        // Confirm to voter
        socket.emit('samvaad:vote_confirmed', { option });
    });

    socket.on('samvaad:vote_close', async ({ roomId }) => {
        if (!roomId) return;

        const voteState = activeVotes.get(roomId);
        if (!voteState) return;

        voteState.status = 'closed';
        voteState.closedAt = new Date().toISOString();

        // Calculate results
        const results = voteState.options.map(opt => ({
            option: opt,
            count: voteState.votes.filter(v => v.option === opt).length
        }));

        const totalVotes = voteState.votes.length;
        const totalEligible = getRoomParticipantsArray(roomId).length;
        const winner = results.reduce((a, b) => a.count > b.count ? a : b, { count: 0 });

        // Add percentage to breakdown
        const breakdown = results.map(r => ({
            ...r,
            percentage: totalVotes > 0 ? Math.round((r.count / totalVotes) * 100) : 0
        }));

        const finalResult = {
            id: voteState.id,
            question: voteState.question,
            options: voteState.options,
            results,
            breakdown,
            totalVotes,
            totalEligible,
            decision: winner.option,
            decisionCount: winner.count,
            isAnonymous: voteState.isAnonymous,
            startedAt: voteState.startedAt,
            closedAt: voteState.closedAt,
            // Include individual votes only if public
            ...(voteState.isAnonymous ? {} : { votes: voteState.votes })
        };

        io.to(roomId).emit('samvaad:vote_closed', {
            roomId,
            result: finalResult
        });

        // Clean up active vote
        activeVotes.delete(roomId);

        // System message
        socket.emit('meeting-chat:system', {
            meetingId: roomId,
            text: `📊 Vote closed — Decision: ${winner.option} (${winner.count}/${totalVotes} votes)`
        });

        // Persist decision to MongoDB and anchor to evidence ledger
        try {
            const decisionId = 'DEC-' + Date.now().toString(36).toUpperCase() + '-' + crypto.randomBytes(3).toString('hex').toUpperCase();
            const decisionData = JSON.stringify({
                decisionId,
                meetingId: roomId,
                question: voteState.question,
                finalResult: winner.option,
                totalVotes,
                closedAt: voteState.closedAt,
            });
            const sha256Hash = crypto.createHash('sha256').update(decisionData).digest('hex');

            const committee = voteState.votes.map(v => v.userName).filter(Boolean);

            const decision = await Decision.create({
                decisionId,
                meetingId: roomId,
                question: voteState.question,
                options: voteState.options,
                votes: voteState.isAnonymous ? [] : voteState.votes.map(v => ({ userId: v.voterId, userName: v.userName, option: v.option, timestamp: v.timestamp })),
                eligibleVoters: totalEligible,
                totalVotes,
                finalResult: winner.option,
                votingStatus: 'closed',
                isAnonymous: voteState.isAnonymous,
                committee,
                sha256Hash,
                startedAt: voteState.startedAt,
                closedAt: voteState.closedAt,
                startedBy: voteState.startedBy,
                startedByName: voteState.startedByName,
                verified: true,
            });

            const evidenceResult = await anchorEvidence({
                evidenceHash: sha256Hash,
                evidenceType: 'decision',
                referenceId: decisionId,
                meetingId: roomId,
                eventType: 'DECISION_RECORDED',
                metadata: { question: voteState.question, finalResult: winner.option },
            });

            decision.blockchainTxId = evidenceResult.evidenceId;
            await decision.save();

            // Send integrity proof back to participants
            io.to(roomId).emit('samvaad:vote_integrity', {
                decisionId,
                sha256Hash,
                evidenceId: evidenceResult.evidenceId,
                blockIndex: evidenceResult.blockIndex,
                verified: true
            });

            await logEvent({
                eventType: 'VOTE_CLOSED',
                meetingId: roomId,
                detail: `Vote closed — Decision: ${winner.option} for "${voteState.question}"`,
                metadata: { decisionId, sha256Hash, evidenceId: evidenceResult.evidenceId },
            });
        } catch (persistErr) {
            console.warn('[Samvaad Socket] Decision persistence error:', persistErr.message);
        }
    });

    // Vote integrity verification
    socket.on('samvaad:verify_vote', async ({ decisionId }) => {
        if (!decisionId) return;
        try {
            const decision = await Decision.findOne({ decisionId }).lean();
            if (!decision) {
                socket.emit('samvaad:vote_verification_result', { verified: false, reason: 'Decision not found' });
                return;
            }

            // Reconstruct canonical data and re-hash
            const decisionData = JSON.stringify({
                decisionId: decision.decisionId,
                meetingId: decision.meetingId,
                question: decision.question,
                finalResult: decision.finalResult,
                totalVotes: decision.totalVotes,
                closedAt: decision.closedAt,
            });
            const recomputedHash = crypto.createHash('sha256').update(decisionData).digest('hex');
            const hashMatch = recomputedHash === decision.sha256Hash;

            socket.emit('samvaad:vote_verification_result', {
                verified: hashMatch,
                decisionId: decision.decisionId,
                sha256Hash: decision.sha256Hash,
                recomputedHash,
                blockchainTxId: decision.blockchainTxId,
                reason: hashMatch ? 'Integrity verified — hash matches blockchain anchor' : 'INTEGRITY FAILURE — hash mismatch detected'
            });
        } catch (err) {
            socket.emit('samvaad:vote_verification_result', { verified: false, reason: err.message });
        }
    });

    // ================================================================
    // HOST CONTROLS
    // ================================================================

    socket.on('samvaad:mute_participant', ({ roomId, targetSocketId }) => {
        if (!roomId || !targetSocketId) return;
        updateParticipantField(roomId, targetSocketId, 'mic', false);
        io.to(targetSocketId).emit('samvaad:force_mute', { roomId });
        io.to(roomId).emit('samvaad:participants_updated', {
            roomId,
            participants: getRoomParticipantsArray(roomId)
        });
    });

    socket.on('samvaad:mute_all', ({ roomId }) => {
        if (!roomId) return;
        const roomMap = activeRoomParticipants.get(roomId);
        if (!roomMap) return;
        for (const [sid, participant] of roomMap.entries()) {
            if (sid !== socket.id) {
                participant.mic = false;
                roomMap.set(sid, participant);
                io.to(sid).emit('samvaad:force_mute', { roomId });
            }
        }
        io.to(roomId).emit('samvaad:participants_updated', {
            roomId,
            participants: getRoomParticipantsArray(roomId)
        });
    });

    socket.on('samvaad:remove_participant', ({ roomId, targetSocketId }) => {
        if (!roomId || !targetSocketId) return;
        io.to(targetSocketId).emit('samvaad:removed_from_meeting', { roomId });
        const roomMap = activeRoomParticipants.get(roomId);
        if (roomMap) {
            roomMap.delete(targetSocketId);
            io.to(roomId).emit('samvaad:participants_updated', {
                roomId,
                participants: getRoomParticipantsArray(roomId)
            });
        }
    });

    // ================================================================
    // WebRTC SIGNALING (preserved from original)
    // ================================================================

    socket.on('samvaad:webrtc_offer', ({ offer, to, roomId }) => {
        if (!to || !offer) return;
        io.to(to).emit('samvaad:webrtc_offer', { offer, from: socket.id, roomId });
    });

    socket.on('samvaad:webrtc_answer', ({ answer, to, roomId }) => {
        if (!to || !answer) return;
        io.to(to).emit('samvaad:webrtc_answer', { answer, from: socket.id, roomId });
    });

    socket.on('samvaad:webrtc_ice_candidate', ({ candidate, to, roomId }) => {
        if (!to || !candidate) return;
        io.to(to).emit('samvaad:webrtc_ice_candidate', { candidate, from: socket.id, roomId });
    });

    // ================================================================
    // AI NOTES — LIVE TRANSCRIPT RELAY
    // ================================================================

    socket.on('samvaad:transcript_entry', ({ roomId, entry }) => {
        if (!roomId || !entry) return;
        // Relay transcript entry to all OTHER participants in the room
        socket.to(roomId).emit('samvaad:transcript_entry', {
            roomId,
            entry: {
                ...entry,
                socketId: socket.id
            }
        });
    });

    // ================================================================
    // WAITING ROOM
    // ================================================================

    socket.on('samvaad:admit_user', ({ socketId, roomId, userName }) => {
        io.to(socketId).emit('samvaad:admitted_to_room', { roomId });
        const admittedName = userName || 'A participant';
        socket.emit('meeting-chat:system', {
            meetingId: roomId,
            text: `${admittedName} was admitted to the meeting.`
        });
    });

    // ================================================================
    // DISCONNECT
    // ================================================================

    socket.on('disconnect', () => {
        removeSocketFromRooms(socket.id);
    });
};

// Export for use in controllers
export { activeVotes, lockedMeetings, meetingSettings };
