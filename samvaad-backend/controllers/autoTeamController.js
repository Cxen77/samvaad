import asyncHandler from 'express-async-handler';
import AutoTeamQueue from '../models/AutoTeamQueue.js';
import Team from '../models/Team.js';
import Chat from '../models/Chat.js';
import Event from '../models/Event.js';
import { getIO } from '../socket/socketServer.js';

// Matching Configurations
const MIN_TEAM_SIZE = 2;
const MATCH_THRESHOLD = 0;

// Algorithm Weights
const WEIGHTS = {
    COLLEGE: 30,
    LOCATION: 20,
    ROLE: 15, // Bonus for different roles
    YEAR: 10,
    SKILL: 5
};

/**
 * Calculate compatibility score between two users based on filters
 */
const calculateScore = (userA, userB) => {
    let score = 0;

    if (userA.college && userB.college && userA.college === userB.college) score += WEIGHTS.COLLEGE;
    if (userA.location && userB.location && userA.location === userB.location) score += WEIGHTS.LOCATION;
    if (userA.year && userB.year && userA.year === userB.year) score += WEIGHTS.YEAR;

    // Role Diversity (Bonus if roles are DIFFERENT)
    // We assume 'role' is passed in the filters object
    if (userA.role && userB.role && userA.role !== userB.role) {
        score += WEIGHTS.ROLE;
    }

    // Skill Overlap
    const skillsA = new Set(userA.skills || []);
    const skillsB = userB.skills || [];
    const overlap = skillsB.filter(skill => skillsA.has(skill)).length;
    score += (overlap * WEIGHTS.SKILL);

    return score;
};

/**
 * Attempt to find a match for a specific event
 */
const processMatching = async (eventId) => {
    console.log(`[AutoTeam] Processing matching for event: ${eventId}`);

    const event = await Event.findById(eventId);
    if (!event) return;

    const TARGET_SIZE = event.maxTeamSize || 4;

    // 1. Fetch all queued users for this event
    const queue = await AutoTeamQueue.find({ eventId, status: 'queued' })
        .populate('userId', 'name');

    console.log(`[AutoTeam] Queue size: ${queue.length}. Target Size: ${TARGET_SIZE}`);

    if (queue.length < TARGET_SIZE) {
        console.log('[AutoTeam] Not enough users to match.');
        return;
    }

    const takenIds = new Set();
    const matches = [];

    for (let i = 0; i < queue.length; i++) {
        const anchor = queue[i];
        if (takenIds.has(anchor._id.toString())) continue;

        const currentTeam = [anchor];
        console.log(`[AutoTeam] Anchor User: ${anchor.userId?.name}`);

        for (let j = i + 1; j < queue.length; j++) {
            const candidate = queue[j];
            if (takenIds.has(candidate._id.toString())) continue;

            const score = calculateScore(anchor.filters, candidate.filters);
            console.log(`[AutoTeam] Checking candidate ${candidate.userId?.name}. Score: ${score}. Threshold: ${MATCH_THRESHOLD}`);

            if (score >= MATCH_THRESHOLD) {
                currentTeam.push(candidate);
                if (currentTeam.length >= TARGET_SIZE) break;
            }
        }

        if (currentTeam.length >= TARGET_SIZE) {
            console.log(`[AutoTeam] Match set found! Size: ${currentTeam.length}`);
            // Mark these as taken
            currentTeam.forEach(q => takenIds.add(q._id.toString()));
            matches.push(currentTeam);
        }
    }

    // Process the matches found
    for (const teamMembers of matches) {
        await createAutoTeam(eventId, teamMembers);
    }
};

/**
 * Create Team and Chat resources for a matched group
 */
const createAutoTeam = async (eventId, queueEntries) => {
    const event = await Event.findById(eventId);
    const userIds = queueEntries.map(q => q.userId._id); // Access populated userId
    const creatorId = userIds[0]; // Arbitrarily assign first user as admin

    console.log(`[AutoTeam] Match found! Creating team for users: ${userIds.join(', ')}`);

    // 1. Create Team
    const newTeam = await Team.create({
        name: `Auto-Team: ${event.title}`,
        description: `Automatically created team for ${event.title}`,
        category: 'Hackathon', // Default or derived from event
        visibility: 'private',
        eventId: eventId,
        isAutoCreated: true,
        members: userIds,
        admins: [creatorId],
        createdBy: creatorId,
        invites: []
    });

    // 2. Create Group Chat
    const newChat = await Chat.create({
        chatName: newTeam.name,
        isGroupChat: true,
        groupAdmin: creatorId,
        participants: userIds
    });

    // 3. Update Queue Status
    const queueIds = queueEntries.map(q => q._id);
    await AutoTeamQueue.updateMany(
        { _id: { $in: queueIds } },
        { status: 'matched' }
    );

    // 4. Notify Users via Socket
    // 4. Notify Users via Socket & Create Persistent Notification
    const io = getIO();

    // Import Notification if not already imported at top, check imports.
    // I need to add the import first if it's missing.
    // The previous view showed imports: AutoTeamQueue, Team, Chat, Event, getIO.
    // I need to add Notification import. Since I can't do two edits in one replace, I will do it carefully or use two steps.
    // Actually, I'll use multi_replace for safer execution if I could, but I'll trust replace for the content block first
    // and then add import if needed. Wait, if I don't import it, it falls.
    // I'll assume I need to verify imports first.

    userIds.forEach(async (uid) => {
        // Create DB Notification
        try {
            const notif = await import('../models/Notification.js').then(m => m.default.create({
                recipient: uid,
                sender: creatorId, // System or Admin
                type: 'match',
                team: newTeam._id,
                event: eventId,
                read: false
            }));

            // Real-time Notification Bell Update
            io.to(`user:${uid}`).emit('notification:new', notif);
        } catch (err) {
            console.error("Failed to create match notification", err);
        }

        // Match Found Event (Pop-up)
        io.to(`user:${uid}`).emit('team:found', {
            teamId: newTeam._id,
            chatId: newChat._id,
            name: newTeam.name,
            members: userIds.length
        });
    });
};

// @desc    Join Auto Team Queue
// @route   POST /api/autoteam/:eventId/join
// @access  Private
export const joinQueue = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const { filters } = req.body;

    // Check if already queued
    const existing = await AutoTeamQueue.findOne({
        userId: req.user._id,
        eventId,
        status: 'queued'
    });

    if (existing) {
        // Update filters if already queued? For now just return success
        return res.json({ message: 'Already in queue', status: 'queued' });
    }

    await AutoTeamQueue.create({
        userId: req.user._id,
        eventId,
        filters: filters || {}
    });

    // Trigger matching synchronously to return status immediately
    try {
        await processMatching(eventId);
    } catch (err) {
        console.error('[AutoTeam] Matching error:', err);
    }

    // Check if user was matched
    const updatedStatus = await AutoTeamQueue.findOne({
        userId: req.user._id,
        eventId
    });

    if (updatedStatus && updatedStatus.status === 'matched') {
        // Find the team and chat
        // We find the most recent auto-team for this event where user is a member
        const team = await Team.findOne({
            eventId,
            members: req.user._id,
            isAutoCreated: true
        }).sort({ createdAt: -1 });

        if (team) {
            const chat = await Chat.findOne({ roomName: team.name });
            return res.status(200).json({
                message: 'Team matched successfully! Redirecting...',
                status: 'matched',
                teamId: team._id,
                chatId: chat ? chat._id : null
            });
        }
    }

    res.status(201).json({ message: 'Joined queue', status: 'queued' });
});

// @desc    Leave Auto Team Queue
// @route   DELETE /api/autoteam/:eventId/leave
// @access  Private
export const leaveQueue = asyncHandler(async (req, res) => {
    const { eventId } = req.params;

    await AutoTeamQueue.deleteOne({
        userId: req.user._id,
        eventId,
        status: 'queued'
    });

    res.json({ message: 'Left queue' });
});

// @desc    Get Queue Status
// @route   GET /api/autoteam/:eventId/status
// @access  Private
export const getQueueStatus = asyncHandler(async (req, res) => {
    const { eventId } = req.params;

    const entry = await AutoTeamQueue.findOne({
        userId: req.user._id,
        eventId,
        status: 'queued'
    });

    res.json({ isQueued: !!entry });
});
