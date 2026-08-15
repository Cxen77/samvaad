import mongoose from 'mongoose';
import asyncHandler from 'express-async-handler';
import Team from '../models/Team.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import Event from '../models/Event.js';

// @desc    Create a new team
// @route   POST /api/teams
// @access  Private
const createTeam = asyncHandler(async (req, res) => {
    const { name, description, category, visibility } = req.body;

    const team = await Team.create({
        name,
        description,
        category,
        visibility,
        createdBy: req.user._id,
        admins: [req.user._id],
        members: [req.user._id]
    });

    // Add team to user's teams
    await User.findByIdAndUpdate(req.user._id, { $push: { teams: team._id } });

    res.status(201).json(team);
});

// @desc    Get user's teams
// @route   GET /api/teams
// @access  Private
const getMyTeams = asyncHandler(async (req, res) => {
    const teams = await Team.find({ members: req.user._id })
        .populate('members', 'name username profilePic collegeVerified')
        .populate('admins', 'name username profilePic collegeVerified')
        .populate('createdBy', 'name username profilePic collegeVerified');
    res.json(teams);
});

// @desc    Get teams for a specific user (profile page)
// @route   GET /api/teams/user/:userId
// @access  Private
const getUserTeams = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const isOwn = String(req.user._id) === String(userId);

    // If viewing own profile: return all teams
    // If viewing another user: return only their public teams
    const filter = isOwn
        ? { members: userId }
        : { members: userId, visibility: 'public' };

    const teams = await Team.find(filter)
        .select('name description category visibility isLookingForMembers teamStatus currentFocus openRoles members createdBy memberRoles')
        .populate('members', 'name username profilePic collegeVerified')
        .populate('createdBy', 'name username profilePic collegeVerified');

    res.json(teams);
});

// @desc    Get team by ID
// @route   GET /api/teams/:id
// @access  Private
const getTeamById = asyncHandler(async (req, res) => {
    const team = await Team.findById(req.params.id)
        .populate('members', 'name username profilePic collegeVerified')
        .populate('admins', 'name username profilePic collegeVerified')
        .populate('invites.userId', 'name username profilePic collegeVerified')
        .populate('createdBy', 'name username profilePic collegeVerified')
        .populate('joinRequests.userId', 'name username profilePic email collegeVerified')
        .populate('memberRoles.userId', 'name username profilePic collegeVerified');

    if (team) {
        res.json(team);
    } else {
        res.status(404);
        throw new Error('Team not found');
    }
});

// @desc    Invite user to team
// @route   PUT /api/teams/:id/invite
// @access  Private
const inviteUser = asyncHandler(async (req, res) => {
    const { userId } = req.body;
    const team = await Team.findById(req.params.id);

    if (!team) {
        res.status(404);
        throw new Error('Team not found');
    }

    // Check if requester is admin
    if (!team.admins.includes(req.user._id)) {
        res.status(401);
        throw new Error('Not authorized as admin');
    }

    // Check if user already in team
    if (team.members.includes(userId)) {
        res.status(400);
        throw new Error('User already in team');
    }

    // Check if already invited
    const alreadyInvited = team.invites.find(invite => invite.userId.toString() === userId);
    if (alreadyInvited) {
        res.status(400);
        throw new Error('User already invited');
    }

    team.invites.push({ userId, status: 'pending' });
    await team.save();

    // Create Notification
    await Notification.create({
        recipient: userId,
        sender: req.user._id,
        type: 'invite',
        team: team._id,
        message: `You have been invited to join ${team.name}`
    });

    res.json({ message: 'User invited' });
});

// @desc    Accept team invite
// @route   PUT /api/teams/:id/accept
// @access  Private
const acceptInvite = asyncHandler(async (req, res) => {
    const team = await Team.findById(req.params.id);

    if (!team) {
        res.status(404);
        throw new Error('Team not found');
    }

    const inviteIndex = team.invites.findIndex(
        invite => invite.userId.toString() === req.user._id.toString() && invite.status === 'pending'
    );

    if (inviteIndex === -1) {
        res.status(400);
        throw new Error('No pending invite found');
    }

    // Enforce maxTeamSize for event-linked teams
    if (team.eventId) {
        const event = await Event.findById(team.eventId);
        if (event && event.allowTeamRegistration) {
            // Check boundary before allowing accepted invite
            if (team.members.length >= event.maxTeamSize) {
                res.status(400);
                throw new Error(`Team has reached the maximum size of ${event.maxTeamSize} for this event`);
            }
        }
    }

    // Update invite status
    team.invites[inviteIndex].status = 'accepted';

    // Add to members
    team.members.push(req.user._id);
    await team.save();

    // Add team to user's teams
    await User.findByIdAndUpdate(req.user._id, { $push: { teams: team._id } });

    res.json({ message: 'Invite accepted' });
});

// @desc    Decline team invite
// @route   PUT /api/teams/:id/decline
// @access  Private
const declineInvite = asyncHandler(async (req, res) => {
    const team = await Team.findById(req.params.id);

    if (!team) {
        res.status(404);
        throw new Error('Team not found');
    }

    const inviteIndex = team.invites.findIndex(
        invite => invite.userId.toString() === req.user._id.toString() && invite.status === 'pending'
    );

    if (inviteIndex === -1) {
        res.status(400);
        throw new Error('No pending invite found');
    }

    team.invites[inviteIndex].status = 'rejected';
    await team.save();

    res.json({ message: 'Invite declined' });
});

// @desc    Join a public team
// @route   PUT /api/teams/:id/join
// @access  Private
const joinTeam = asyncHandler(async (req, res) => {
    const team = await Team.findById(req.params.id);

    if (!team) {
        res.status(404);
        throw new Error('Team not found');
    }

    if (team.visibility === 'private') {
        res.status(400);
        throw new Error('Cannot join private team without invite');
    }

    if (team.members.includes(req.user._id)) {
        res.status(400);
        throw new Error('User already in team');
    }

    // Enforce maxTeamSize for event-linked teams
    if (team.eventId) {
        const event = await Event.findById(team.eventId);
        if (event && event.allowTeamRegistration) {
            // Check boundary before allowing join
            if (team.members.length >= event.maxTeamSize) {
                res.status(400);
                throw new Error(`Team has reached the maximum size of ${event.maxTeamSize} for this event`);
            }
        }
    }

    team.members.push(req.user._id);
    await team.save();

    // Add team to user's teams
    await User.findByIdAndUpdate(req.user._id, { $push: { teams: team._id } });

    res.json({ message: 'Joined team' });
});

// @desc    Leave a team
// @route   PUT /api/teams/:id/leave
// @access  Private
const leaveTeam = asyncHandler(async (req, res) => {
    const team = await Team.findById(req.params.id);

    if (!team) {
        res.status(404);
        throw new Error('Team not found');
    }

    // Security Check: Owner cannot leave the team, they must delete or transfer ownership
    if (team.createdBy.toString() === req.user._id.toString()) {
        res.status(400);
        throw new Error('Team owners cannot leave. You must transfer ownership or delete the team.');
    }

    // Check if user is actually a member
    if (!team.members.some(member => member.toString() === req.user._id.toString())) {
        res.status(400);
        throw new Error('You are not a member of this team');
    }

    const performLeave = async (sessionOpts) => {
        // Remove from members array
        await Team.updateOne(
            { _id: team._id },
            { $pull: { members: req.user._id, admins: req.user._id } },
            sessionOpts
        );

        // Remove role mapping
        await Team.updateOne(
            { _id: team._id },
            { $pull: { memberRoles: { userId: req.user._id } } },
            sessionOpts
        );

        // Remove team from user's teams array
        await User.updateOne(
            { _id: req.user._id },
            { $pull: { teams: team._id } },
            sessionOpts
        );
    };

    try {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            await performLeave({ session });
            await session.commitTransaction();
            session.endSession();
        } catch (txError) {
            await session.abortTransaction();
            session.endSession();

            // Fallback for standalone mongo instances
            if (txError.message.toLowerCase().includes('transaction') || txError.message.toLowerCase().includes('replica set')) {
                await performLeave({});
            } else {
                throw txError;
            }
        }

        res.json({ message: 'Left team successfully' });
    } catch (error) {
        res.status(500);
        throw new Error('Failed to fully leave team. ' + error.message);
    }
});

// @desc    Remove member from team
// @route   PUT /api/teams/:id/remove/:userId
// @access  Private
const removeMember = asyncHandler(async (req, res) => {
    const team = await Team.findById(req.params.id);
    const userIdToRemove = req.params.userId;

    if (!team) {
        res.status(404);
        throw new Error('Team not found');
    }

    // Check if requester is admin
    if (!team.admins.includes(req.user._id)) {
        res.status(401);
        throw new Error('Not authorized as admin');
    }

    // Remove from members
    team.members = team.members.filter(member => member.toString() !== userIdToRemove);
    // Remove from admins
    team.admins = team.admins.filter(admin => admin.toString() !== userIdToRemove);
    // Clean up join requests so they aren't permanently marked 'accepted' (blocking re-application)
    team.joinRequests = team.joinRequests.filter(r => r.userId.toString() !== userIdToRemove);
    // Clean up memberRoles
    team.memberRoles = team.memberRoles.filter(mr => mr.userId.toString() !== userIdToRemove);

    await team.save();

    // Remove team from user's teams
    await User.findByIdAndUpdate(userIdToRemove, { $pull: { teams: team._id } });

    res.json({ message: 'Member removed' });
});

// @desc    Update team details
// @route   PUT /api/teams/:id/update
// @access  Private
const updateTeam = asyncHandler(async (req, res) => {
    const team = await Team.findById(req.params.id);

    if (!team) {
        res.status(404);
        throw new Error('Team not found');
    }

    // Check if requester is admin
    if (!team.admins.includes(req.user._id)) {
        res.status(401);
        throw new Error('Not authorized as admin');
    }

    const { name, description, projectGoals, category, visibility, currentFocus, teamStatus } = req.body;

    team.name = name || team.name;
    team.description = description || team.description;
    if (projectGoals !== undefined) team.projectGoals = projectGoals;
    team.category = category || team.category;
    team.visibility = visibility || team.visibility;
    if (currentFocus !== undefined) team.currentFocus = currentFocus;
    if (teamStatus !== undefined) team.teamStatus = teamStatus;

    const updatedTeam = await team.save();
    res.json(updatedTeam);
});

// @desc    Search teams by name
// @route   GET /api/teams/search?q=searchQuery
// @access  Private
const searchTeams = asyncHandler(async (req, res) => {
    const searchQuery = req.query.q;

    if (!searchQuery || searchQuery.trim() === '') {
        res.status(400);
        throw new Error('Search query is required');
    }

    const teams = await Team.find({
        name: { $regex: searchQuery, $options: 'i' },
        visibility: 'public' // Only search public teams
    })
        .populate('members', 'name username profilePic collegeVerified')
        .limit(10);

    res.json(teams);
});

// @desc    Get user's pending invites
// @route   GET /api/teams/invites
// @access  Private
const getMyInvites = asyncHandler(async (req, res) => {
    const teams = await Team.find({
        invites: {
            $elemMatch: {
                userId: req.user._id,
                status: 'pending'
            }
        }
    })
        .populate('createdBy', 'name username profilePic collegeVerified')
        .populate('members', 'name username profilePic collegeVerified')
        .select('name description category members createdBy invites'); // Select necessary fields

    // Filter the invites array in the response to only show the user's invite (optional, but cleaner)
    // or just return the team info. The frontend needs team info to show "You are invited to join [Team Name]"

    res.json(teams);
});

// @desc    Get teams for a specific event
// @route   GET /api/events/:id/teams
// @access  Private
const getEventTeams = asyncHandler(async (req, res) => {
    const teams = await Team.find({ eventId: req.params.id })
        .populate('members', 'name username profilePic skills college collegeVerified') // Added skills/college as per prompt
        .populate('admins', 'name username profilePic collegeVerified');

    res.json(teams);
});

// ─────────────────────────────────────────────────────────────────
// NEW FUNCTIONS — Team Collaboration Upgrade
// ─────────────────────────────────────────────────────────────────

// @desc    Get all open teams (public, active, looking for members)
// @route   GET /api/teams/open
// @access  Private
const getOpenTeams = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const category = req.query.category;
    const skip = (page - 1) * limit;

    const filter = {
        isLookingForMembers: true,
        visibility: 'public',
        teamStatus: 'active'
    };

    if (category) {
        filter.category = category;
    }

    const totalTeams = await Team.countDocuments(filter);

    const teams = await Team.find(filter)
        .select('name category openRoles members createdBy description teamStatus')
        .populate('members', '_id')                          // only need count
        .populate('createdBy', 'name username profilePic')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

    res.json({
        teams,
        currentPage: page,
        totalPages: Math.ceil(totalTeams / limit),
        totalTeams
    });
});

// @desc    Request to join an open public team
// @route   POST /api/teams/:id/request-join
// @access  Private
const requestJoin = asyncHandler(async (req, res) => {
    const { roleId } = req.body;
    let message = (req.body.message || '').trim();

    const team = await Team.findById(req.params.id);
    if (!team) { res.status(404); throw new Error('Team not found'); }
    if (team.visibility !== 'public') { res.status(403); throw new Error('Cannot request to join a private team'); }
    if (team.teamStatus !== 'active') { res.status(400); throw new Error('This team is not currently accepting members'); }

    // Compute hiring status from live open roles (field may be stale in DB)
    const liveOpenRoles = team.openRoles.filter(r => r.isOpen);
    const isHiring = team.isLookingForMembers || liveOpenRoles.length > 0;
    // Auto-sync if stale
    if (!team.isLookingForMembers && liveOpenRoles.length > 0) {
        team.isLookingForMembers = true;
    }
    // Only block if team has NO open roles AND isLookingForMembers is false
    // (teams without open roles can still accept general applications)
    // We allow join requests as long as neither condition indicates closed

    // ── Input validation ─────────────────────────────
    // Strip HTML tags to prevent stored XSS
    message = message.replace(/<[^>]*>/g, '');

    // Word count limit (500 words)
    const wordCount = message.split(/\s+/).filter(Boolean).length;
    if (wordCount > 500) {
        res.status(400);
        throw new Error(`Message too long (${wordCount} words). Maximum is 500 words.`);
    }

    // Hard character limit as a safety net
    if (message.length > 3000) {
        res.status(400);
        throw new Error('Message exceeds maximum length of 3000 characters.');
    }

    if (!message) {
        res.status(400);
        throw new Error('Please tell the team about yourself and why you want to join.');
    }

    const userId = req.user._id.toString();

    // Guard: already a member
    if (team.members.some(m => m.toString() === userId)) {
        res.status(400); throw new Error('You are already a member of this team');
    }

    // Guard: already requested
    const existingIdx = team.joinRequests.findIndex(r => r.userId.toString() === userId);
    if (existingIdx !== -1) {
        const existing = team.joinRequests[existingIdx];
        if (existing.status === 'pending') {
            res.status(400); throw new Error('You already have a pending join request for this team');
        }
        // If it's 'accepted' or 'rejected', allow re-application: update the existing entry in-place.
        // (If they were truly an active member, line 453 would have already blocked this)
        team.joinRequests[existingIdx].message = message;
        team.joinRequests[existingIdx].roleId = roleId || null;
        team.joinRequests[existingIdx].status = 'pending';
        // Update timestamps
        team.joinRequests[existingIdx].createdAt = new Date();
    } else {
        // Validate roleId only for fresh applications when open roles exist
        const openRoles = team.openRoles.filter(r => r.isOpen);
        if (openRoles.length > 0) {
            if (!roleId) { res.status(400); throw new Error('Please select a role to apply for'); }
            const validRole = openRoles.some(r => r._id.toString() === roleId);
            if (!validRole) { res.status(400); throw new Error('Invalid role selection'); }
        }
        team.joinRequests.push({
            userId: req.user._id,
            roleId: roleId || null,
            message: message,
            status: 'pending'
        });
    }
    await team.save();

    // Notify the team owner
    await Notification.create({
        recipient: team.createdBy,
        sender: req.user._id,
        type: 'join_request',
        team: team._id,
        message: `${req.user.name} requested to join ${team.name}`
    });

    res.status(201).json({ message: 'Join request sent' });
});


// @desc    Accept or reject a join request
// @route   PUT /api/teams/:id/join-requests/:reqId
// @access  Private (owner or co-lead)
const handleJoinRequest = asyncHandler(async (req, res) => {
    const { action } = req.body; // "accept" | "reject"
    if (!['accept', 'reject'].includes(action)) { res.status(400); throw new Error('Invalid action'); }

    const team = await Team.findById(req.params.id);
    if (!team) { res.status(404); throw new Error('Team not found'); }

    // Guard: only owner or co-lead
    const isOwner = team.createdBy.toString() === req.user._id.toString();
    const isCoLead = team.memberRoles.some(mr => mr.userId.toString() === req.user._id.toString() && mr.role === 'co-lead');
    if (!isOwner && !isCoLead) { res.status(403); throw new Error('Not authorized to manage join requests'); }

    const reqIndex = team.joinRequests.findIndex(r => r._id.toString() === req.params.reqId);
    if (reqIndex === -1) { res.status(404); throw new Error('Join request not found'); }

    const joinReq = team.joinRequests[reqIndex];
    if (joinReq.status !== 'pending') { res.status(400); throw new Error('Request is no longer pending'); }

    if (action === 'accept') {
        joinReq.status = 'accepted';

        // Keep members[] as source of truth — add to both arrays in sync
        if (!team.members.some(m => m.toString() === joinReq.userId.toString())) {
            team.members.push(joinReq.userId);
            team.memberRoles.push({ userId: joinReq.userId, role: 'member' });
        }

        // Increment filledCount and auto-close role if full
        if (joinReq.roleId) {
            const role = team.openRoles.id(joinReq.roleId);
            if (role && role.isOpen) {
                role.filledCount = (role.filledCount || 0) + 1;
                if (role.filledCount >= (role.vacancies || 1)) {
                    role.isOpen = false;
                    team.syncLookingForMembers();
                }
            }
        }

        // Add team to user's teams list
        await User.findByIdAndUpdate(joinReq.userId, { $addToSet: { teams: team._id } });

        // Notify the applicant
        await Notification.create({
            recipient: joinReq.userId,
            sender: req.user._id,
            type: 'join_accepted',
            team: team._id,
            message: `Your request to join ${team.name} was accepted!`
        });
    } else {
        joinReq.status = 'rejected';

        await Notification.create({
            recipient: joinReq.userId,
            sender: req.user._id,
            type: 'join_rejected',
            team: team._id,
            message: `Your request to join ${team.name} was not accepted`
        });
    }

    await team.save();
    res.json({ message: `Request ${action}ed` });
});

// @desc    Add an open role to a team
// @route   POST /api/teams/:id/roles
// @access  Private (owner or co-lead)
const addOpenRole = asyncHandler(async (req, res) => {
    const { title, description, requiredSkills, vacancies } = req.body;
    if (!title) { res.status(400); throw new Error('Role title is required'); }

    const team = await Team.findById(req.params.id);
    if (!team) { res.status(404); throw new Error('Team not found'); }

    const isOwner = team.createdBy.toString() === req.user._id.toString();
    const isCoLead = team.memberRoles.some(mr => mr.userId.toString() === req.user._id.toString() && mr.role === 'co-lead');
    if (!isOwner && !isCoLead) { res.status(403); throw new Error('Not authorized'); }

    const parsedVacancies = Math.max(1, parseInt(vacancies, 10) || 1);

    team.openRoles.push({
        title,
        description: description || '',
        requiredSkills: requiredSkills || [],
        vacancies: parsedVacancies,
        filledCount: 0,
        isOpen: true
    });
    team.syncLookingForMembers();  // auto-recompute
    await team.save();

    res.status(201).json(team.openRoles);
});

// @desc    Update an open role (toggle open/closed, edit details)
// @route   PUT /api/teams/:id/roles/:roleId
// @access  Private (owner or co-lead)
const updateOpenRole = asyncHandler(async (req, res) => {
    const team = await Team.findById(req.params.id);
    if (!team) { res.status(404); throw new Error('Team not found'); }

    const isOwner = team.createdBy.toString() === req.user._id.toString();
    const isCoLead = team.memberRoles.some(mr => mr.userId.toString() === req.user._id.toString() && mr.role === 'co-lead');
    if (!isOwner && !isCoLead) { res.status(403); throw new Error('Not authorized'); }

    const role = team.openRoles.id(req.params.roleId);
    if (!role) { res.status(404); throw new Error('Role not found'); }

    const { title, description, requiredSkills, isOpen, vacancies } = req.body;
    if (title !== undefined) role.title = title;
    if (description !== undefined) role.description = description;
    if (requiredSkills !== undefined) role.requiredSkills = requiredSkills;
    if (isOpen !== undefined) role.isOpen = isOpen;
    if (vacancies !== undefined) {
        role.vacancies = Math.max(1, parseInt(vacancies, 10) || 1);
        // Force re-open or re-close based on new quota
        if (role.filledCount >= role.vacancies) role.isOpen = false;
    }

    team.syncLookingForMembers();  // recompute based on .some(r => r.isOpen)
    await team.save();

    res.json(team.openRoles);
});

// @desc    Delete an open role
// @route   DELETE /api/teams/:id/roles/:roleId
// @access  Private (owner or co-lead)
const deleteOpenRole = asyncHandler(async (req, res) => {
    const team = await Team.findById(req.params.id);
    if (!team) { res.status(404); throw new Error('Team not found'); }

    const isOwner = team.createdBy.toString() === req.user._id.toString();
    const isCoLead = team.memberRoles.some(mr => mr.userId.toString() === req.user._id.toString() && mr.role === 'co-lead');
    if (!isOwner && !isCoLead) { res.status(403); throw new Error('Not authorized'); }

    team.openRoles = team.openRoles.filter(r => r._id.toString() !== req.params.roleId);
    team.syncLookingForMembers();
    await team.save();

    res.json({ message: 'Role deleted', openRoles: team.openRoles });
});

// @desc    Promote a member to co-lead
// @route   PUT /api/teams/:id/members/:userId/promote
// @access  Private (owner only)
const promoteMember = asyncHandler(async (req, res) => {
    const team = await Team.findById(req.params.id);
    if (!team) { res.status(404); throw new Error('Team not found'); }

    // Only owner can promote
    if (team.createdBy.toString() !== req.user._id.toString()) {
        res.status(403); throw new Error('Only the team owner can promote members');
    }

    const targetUserId = req.params.userId;

    // Must be a member
    if (!team.members.some(m => m.toString() === targetUserId)) {
        res.status(400); throw new Error('User is not a member of this team');
    }

    // Find or create memberRole entry
    const existingRole = team.memberRoles.find(mr => mr.userId.toString() === targetUserId);
    if (existingRole) {
        if (existingRole.role === 'co-lead') { res.status(400); throw new Error('User is already a co-lead'); }
        if (existingRole.role === 'owner') { res.status(400); throw new Error('Use transferOwnership to change the owner'); }
        existingRole.role = 'co-lead';
    } else {
        team.memberRoles.push({ userId: targetUserId, role: 'co-lead' });
    }

    // Also ensure they're in admins array for legacy compatibility
    if (!team.admins.some(a => a.toString() === targetUserId)) {
        team.admins.push(targetUserId);
    }

    await team.save();
    res.json({ message: 'Member promoted to co-lead' });
});

// @desc    Transfer team ownership to another member
// @route   PUT /api/teams/:id/transfer
// @access  Private (owner only)
const transferOwnership = asyncHandler(async (req, res) => {
    const { newOwnerId } = req.body;
    if (!newOwnerId) { res.status(400); throw new Error('newOwnerId is required'); }

    const team = await Team.findById(req.params.id);
    if (!team) { res.status(404); throw new Error('Team not found'); }

    // Only current owner can transfer
    if (team.createdBy.toString() !== req.user._id.toString()) {
        res.status(403); throw new Error('Only the current owner can transfer ownership');
    }

    // New owner must already be a member
    if (!team.members.some(m => m.toString() === newOwnerId)) {
        res.status(400); throw new Error('New owner must already be a member of the team');
    }

    // Cannot transfer to self
    if (newOwnerId === req.user._id.toString()) {
        res.status(400); throw new Error('You are already the owner');
    }

    // Update memberRoles: new owner → "owner", old owner → "co-lead"
    const oldOwnerRole = team.memberRoles.find(mr => mr.userId.toString() === req.user._id.toString());
    if (oldOwnerRole) { oldOwnerRole.role = 'co-lead'; }
    else { team.memberRoles.push({ userId: req.user._id, role: 'co-lead' }); }

    const newOwnerRole = team.memberRoles.find(mr => mr.userId.toString() === newOwnerId);
    if (newOwnerRole) { newOwnerRole.role = 'owner'; }
    else { team.memberRoles.push({ userId: newOwnerId, role: 'owner' }); }

    // Transfer createdBy
    team.createdBy = newOwnerId;

    // Update admins: ensure new owner is admin
    if (!team.admins.some(a => a.toString() === newOwnerId)) {
        team.admins.push(newOwnerId);
    }

    await team.save();

    await Notification.create({
        recipient: newOwnerId,
        sender: req.user._id,
        type: 'ownership_transfer',
        team: team._id,
        message: `You are now the owner of ${team.name}`
    });

    res.json({ message: 'Ownership transferred successfully' });
});

// @desc    Permanently delete a team
// @route   DELETE /api/teams/:id
// @access  Private (owner only)
const deleteTeam = asyncHandler(async (req, res) => {
    console.log(`[DELETE TEAM] Attempting to delete team ID: ${req.params.id}`);
    const team = await Team.findById(req.params.id);
    if (!team) {
        console.log(`[DELETE TEAM] Team ${req.params.id} not found.`);
        res.status(404);
        throw new Error('Team not found');
    }

    console.log(`[DELETE TEAM] Requesting User ID: ${req.user._id}`);
    console.log(`[DELETE TEAM] Team Creator ID: ${team.createdBy}`);

    // Security Check: Only the creator (owner) can delete the team
    if (team.createdBy.toString() !== req.user._id.toString()) {
        console.log(`[DELETE TEAM] Unauthorized access blocked.`);
        res.status(403);
        throw new Error('Only the team owner can delete this team');
    }

    // Helper to perform the cascading logic
    const performDeletion = async (sessionOpts) => {
        // 1. Remove team ID from all Users' teams array
        await User.updateMany(
            { teams: team._id },
            { $pull: { teams: team._id } },
            sessionOpts
        );

        // 2. Delete related Notifications
        await Notification.deleteMany(
            { team: team._id },
            sessionOpts
        );

        // 3. Delete the Team document
        await Team.deleteOne({ _id: team._id }, sessionOpts);
    };

    try {
        console.log(`[DELETE TEAM] Starting transaction...`);
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            await performDeletion({ session });
            await session.commitTransaction();
            session.endSession();
            console.log(`[DELETE TEAM] SUCCESS via Atomic Transaction`);
        } catch (txError) {
            await session.abortTransaction();
            session.endSession();

            // Check if failure is due to running a local standalone MongoDB instance lacking replica sets
            if (txError.message.toLowerCase().includes('transaction') || txError.message.toLowerCase().includes('replica set')) {
                console.log(`[DELETE TEAM] Local standalone DB detected. Falling back to non-transactional sequential deletion...`);
                await performDeletion({}); // Execute strictly sequentially instead
                console.log(`[DELETE TEAM] SUCCESS via Sequential Fallback`);
            } else {
                throw txError; // Re-throw if it wasn't a replica set issue
            }
        }

        res.json({ message: 'Team permanently deleted' });
    } catch (error) {
        console.error(`[DELETE TEAM] COMPLETELY FAILED:`, error);
        res.status(500);
        throw new Error(error.message || 'Failed to delete team securely.');
    }
});

export {
    createTeam,
    getMyTeams,
    getTeamById,
    inviteUser,
    acceptInvite,
    declineInvite,
    joinTeam,
    leaveTeam,
    removeMember,
    updateTeam,
    searchTeams,
    getMyInvites,
    getEventTeams,
    // New
    getUserTeams,
    getOpenTeams,
    requestJoin,
    handleJoinRequest,
    addOpenRole,
    updateOpenRole,
    deleteOpenRole,
    promoteMember,
    transferOwnership,
    deleteTeam
};
