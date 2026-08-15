import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import Event from '../models/Event.js';
import Post from '../models/Post.js';
import ForumPost from '../models/ForumPost.js';
import Message from '../models/Message.js';
import SystemSettings from '../models/SystemSettings.js';
import AdminLog from '../models/AdminLog.js';

// Security: Escape regex special characters to prevent ReDoS
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ============================================================
// HELPERS
// ============================================================

/**
 * Create an audit log entry for every admin action.
 */
const logAction = async (req, { action, targetId, targetType, details = '' }) => {
    try {
        await AdminLog.create({
            adminId: req.user._id,
            action,
            targetId,
            targetType,
            details,
            ipAddress: req.ip || req.headers['x-forwarded-for'] || '',
            userAgent: req.headers['user-agent'] || ''
        });
    } catch (err) {
        console.error('[AdminLog] Failed to create log entry:', err.message);
    }
};

// ============================================================
// DASHBOARD
// ============================================================

/**
 * @route   GET /api/admin
 * @desc    Get dashboard overview stats
 */
export const getDashboardStats = asyncHandler(async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Organizer specific stats
    if (req.user.role === 'organizer') {
        const collegeId = req.user.collegeId;
        if (!collegeId) {
            res.status(400);
            throw new Error('Organizer has no college linked');
        }

        const [
            totalEvents,
            usersInCollege
        ] = await Promise.all([
            Event.countDocuments({ collegeId }),
            User.countDocuments({ collegeId })
        ]);

        return res.json({
            totalEvents,
            usersInCollege,
            // Zero out irrelevant global stats or provide null
            totalUsers: usersInCollege,
            activeToday: 0, // Hard to track active by college efficiently without more queries
            suspendedUsers: 0,
            totalPosts: 0,
            totalForumPosts: 0,
            messagesToday: 0
        });
    }

    // Admin/Moderator Global Stats
    const [
        totalUsers,
        activeToday,
        suspendedUsers,
        totalEvents,
        totalPosts,
        totalForumPosts,
        messagesToday
    ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ updatedAt: { $gte: today } }),
        User.countDocuments({ isSuspended: true }),
        Event.countDocuments(),
        Post.countDocuments(),
        ForumPost.countDocuments(),
        Message.countDocuments({ createdAt: { $gte: today } })
    ]);

    res.json({
        totalUsers,
        activeToday,
        suspendedUsers,
        totalEvents,
        totalPosts,
        totalForumPosts,
        messagesToday
    });
});

// ============================================================
// USER MANAGEMENT
// ============================================================

/**
 * @route   GET /api/admin/users
 * @desc    Get paginated user list with optional search
 */
export const getUsers = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const search = req.query.search || '';

    const query = {};
    if (search) {
        const safe = escapeRegex(search);
        query.$or = [
            { name: { $regex: safe, $options: 'i' } },
            { username: { $regex: safe, $options: 'i' } },
            { email: { $regex: safe, $options: 'i' } }
        ];
    }

    const [users, total] = await Promise.all([
        User.find(query)
            .select('name username email role isSuspended profilePic college collegeId collegeVerified verificationNote createdAt updatedAt')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        User.countDocuments(query)
    ]);

    res.json({
        users,
        total,
        page,
        pages: Math.ceil(total / limit)
    });
});

/**
 * @route   PATCH /api/admin/users/:id/role
 * @desc    Update a user's role
 */
/**
 * @route   PATCH /api/admin/users/:id/role
 * @desc    Update a user's role (Hardened)
 */
export const updateUserRole = asyncHandler(async (req, res) => {
    const { role } = req.body;
    const adminUser = req.user;

    // Hard block for moderators at the controller level
    if (adminUser.role === 'moderator') {
        res.status(403);
        throw new Error('Moderators cannot assign roles');
    }

    // 1. Validate Enum
    if (!['user', 'moderator', 'organizer', 'admin'].includes(role)) {
        res.status(400);
        throw new Error('Invalid role. Must be: user, moderator, organizer, or admin');
    }

    const user = await User.findById(req.params.id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    const oldRole = user.role;

    // 2. Prevent Self-Demotion check for reliability
    if (user._id.toString() === adminUser._id.toString() && oldRole === 'admin' && role !== 'admin') {
        // Ensure there is at least one other admin
        const adminCount = await User.countDocuments({ role: 'admin' });
        if (adminCount <= 1) {
            res.status(400);
            throw new Error('Cannot demote yourself. You are the last remaining admin.');
        }
    }

    // 3. Organizer Constraint Check
    if (role === 'organizer') {
        if (!user.collegeId) {
            res.status(400);
            throw new Error('Cannot assign Organizer role. User must belong to a college first.');
        }
    }

    user.role = role;
    await user.save();

    // 4. Detailed Logging
    await logAction(req, {
        action: 'ROLE_CHANGE',
        targetId: user._id,
        targetType: 'User',
        details: `Changed role from "${oldRole}" to "${role}"`
    });

    res.json({
        message: `User role updated to ${role}`,
        user: {
            _id: user._id,
            role: user.role,
            collegeId: user.collegeId
        }
    });
});

/**
 * @route   PATCH /api/admin/users/:id/suspend
 * @desc    Suspend a user
 */
export const suspendUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (user.role === 'admin') {
        res.status(400);
        throw new Error('Cannot suspend an admin user');
    }

    user.isSuspended = true;
    await user.save();

    await logAction(req, {
        action: 'SUSPEND_USER',
        targetId: user._id,
        targetType: 'User',
        details: `Suspended user: ${user.username}`
    });

    res.json({ message: `User ${user.username} has been suspended` });
});

/**
 * @route   PATCH /api/admin/users/:id/unsuspend
 * @desc    Unsuspend a user
 */
export const unsuspendUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    user.isSuspended = false;
    await user.save();

    await logAction(req, {
        action: 'UNSUSPEND_USER',
        targetId: user._id,
        targetType: 'User',
        details: `Unsuspended user: ${user.username}`
    });

    res.json({ message: `User ${user.username} has been unsuspended` });
});

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Soft-delete a user (suspend + mark)
 */
export const deleteUser = asyncHandler(async (req, res) => {
    // Hard block for moderators
    if (req.user.role === 'moderator') {
        res.status(403);
        throw new Error('Moderators cannot delete users');
    }

    const user = await User.findById(req.params.id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (user.role === 'admin') {
        res.status(400);
        throw new Error('Cannot delete an admin user');
    }

    // Soft delete: suspend and mark the account
    user.isSuspended = true;
    user.name = `[Deleted] ${user.name}`;
    user.bio = '';
    await user.save();

    await logAction(req, {
        action: 'SOFT_DELETE_USER',
        targetId: user._id,
        targetType: 'User',
        details: `Soft-deleted user: ${user.username}`
    });

    res.json({ message: `User ${user.username} has been soft-deleted` });
});

// ============================================================
// EVENT MODERATION
// ============================================================

/**
 * @route   GET /api/admin/events
 * @desc    Get all events with approval status
 */
export const getEvents = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const filter = req.query.filter; // 'pending', 'approved', 'rejected'
    const search = req.query.search || '';

    const query = {};
    if (filter === 'pending') query.isApproved = null;
    if (filter === 'approved') query.isApproved = true;
    if (filter === 'rejected') query.isApproved = false;

    // Organizer Restriction
    if (req.user.role === 'organizer') {
        if (!req.user.collegeId) {
            res.status(403);
            throw new Error('Organizer has no college linked');
        }
        query.collegeId = req.user.collegeId;
    }

    if (search) {
        query.title = { $regex: escapeRegex(search), $options: 'i' };
    }

    const [events, total] = await Promise.all([
        Event.find(query)
            .populate('organizer', 'name username profilePic')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Event.countDocuments(query)
    ]);

    res.json({
        events,
        total,
        page,
        pages: Math.ceil(total / limit)
    });
});

/**
 * @route   PATCH /api/admin/events/:id/approve
 * @desc    Approve an event
 */
export const approveEvent = asyncHandler(async (req, res) => {
    const event = await Event.findById(req.params.id);
    if (!event) {
        res.status(404);
        throw new Error('Event not found');
    }

    event.isApproved = true;
    await event.save();

    await logAction(req, {
        action: 'APPROVE_EVENT',
        targetId: event._id,
        targetType: 'Event',
        details: `Approved event: ${event.title}`
    });

    res.json({ message: `Event "${event.title}" approved` });
});

/**
 * @route   PATCH /api/admin/events/:id/reject
 * @desc    Reject an event
 */
export const rejectEvent = asyncHandler(async (req, res) => {
    const event = await Event.findById(req.params.id);
    if (!event) {
        res.status(404);
        throw new Error('Event not found');
    }

    event.isApproved = false;
    await event.save();

    await logAction(req, {
        action: 'REJECT_EVENT',
        targetId: event._id,
        targetType: 'Event',
        details: `Rejected event: ${event.title}`
    });

    res.json({ message: `Event "${event.title}" rejected` });
});

/**
 * @route   DELETE /api/admin/events/:id
 * @desc    Soft-delete an event (reject + hide)
 */
export const deleteEvent = asyncHandler(async (req, res) => {
    const event = await Event.findById(req.params.id);
    if (!event) {
        res.status(404);
        throw new Error('Event not found');
    }

    event.isApproved = false;
    event.isDeleted = true;
    event.deletedAt = new Date();
    await event.save();

    await logAction(req, {
        action: 'SOFT_DELETE_EVENT',
        targetId: event._id,
        targetType: 'Event',
        details: `Soft-deleted event: ${event.title}`
    });

    res.json({ message: 'Event soft-deleted' });
});

// ============================================================
// CONTENT MODERATION — POSTS
// ============================================================

/**
 * @route   GET /api/admin/posts
 * @desc    Get paginated posts
 */
export const getPosts = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);

    const [posts, total] = await Promise.all([
        Post.find()
            .populate('user', 'name username profilePic')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Post.countDocuments()
    ]);

    res.json({
        posts,
        total,
        page,
        pages: Math.ceil(total / limit)
    });
});

/**
 * @route   DELETE /api/admin/posts/:id
 * @desc    Soft-delete a post (clear content, keep record)
 */
export const deletePost = asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post) {
        res.status(404);
        throw new Error('Post not found');
    }

    post.isDeleted = true;
    post.deletedAt = new Date();
    post.content = '[This post has been removed by an administrator]';
    post.image = '';
    await post.save();

    await logAction(req, {
        action: 'SOFT_DELETE_POST',
        targetId: post._id,
        targetType: 'Post',
        details: `Soft-deleted post by user ${post.user}`
    });

    res.json({ message: 'Post soft-deleted' });
});

// ============================================================
// CONTENT MODERATION — FORUM POSTS
// ============================================================

/**
 * @route   GET /api/admin/forumPosts
 * @desc    Get paginated forum posts
 */
export const getForumPosts = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);

    const [forumPosts, total] = await Promise.all([
        ForumPost.find()
            .populate('author', 'name username profilePic')
            .populate('forum', 'name')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        ForumPost.countDocuments()
    ]);

    res.json({
        forumPosts,
        total,
        page,
        pages: Math.ceil(total / limit)
    });
});

/**
 * @route   DELETE /api/admin/forumPosts/:id
 * @desc    Soft-delete a forum post
 */
export const deleteForumPost = asyncHandler(async (req, res) => {
    const forumPost = await ForumPost.findById(req.params.id);
    if (!forumPost) {
        res.status(404);
        throw new Error('Forum post not found');
    }

    forumPost.isDeleted = true;
    forumPost.deletedAt = new Date();
    forumPost.title = '[Removed]';
    forumPost.content = '[This post has been removed by an administrator]';
    await forumPost.save();

    await logAction(req, {
        action: 'SOFT_DELETE_FORUM_POST',
        targetId: forumPost._id,
        targetType: 'ForumPost',
        details: `Soft-deleted forum post by user ${forumPost.author}`
    });

    res.json({ message: 'Forum post soft-deleted' });
});

// ============================================================
// FEATURE FLAGS / SYSTEM SETTINGS
// ============================================================

/**
 * @route   GET /api/admin/settings
 * @desc    Get system settings (feature flags)
 */
export const getSettings = asyncHandler(async (req, res) => {
    const settings = await SystemSettings.getSettings();
    res.json({ features: settings.getFeaturesObject() });
});

/**
 * @route   PATCH /api/admin/settings
 * @desc    Update feature flags
 * Body: { features: { chat: { enabled: false }, forum: { rolesAllowed: ['admin'] } } }
 */
export const updateSettings = asyncHandler(async (req, res) => {
    const settings = await SystemSettings.getSettings();
    const { features } = req.body;

    if (!features || typeof features !== 'object') {
        res.status(400);
        throw new Error('Request body must contain a "features" object');
    }

    const changes = [];
    const validRoles = ['user', 'moderator', 'organizer', 'admin'];

    for (const [featureName, updates] of Object.entries(features)) {
        if (!settings.features.has(featureName)) continue; // skip unknown features

        const current = settings.features.get(featureName);

        if (typeof updates.enabled === 'boolean' && current.enabled !== updates.enabled) {
            changes.push(`${featureName}.enabled: ${current.enabled} → ${updates.enabled}`);
            current.enabled = updates.enabled;
        }

        if (typeof updates.isKilled === 'boolean' && current.isKilled !== updates.isKilled) {
            changes.push(`${featureName}.isKilled: ${current.isKilled} → ${updates.isKilled}`);
            current.isKilled = updates.isKilled;
        }

        if (Array.isArray(updates.rolesAllowed)) {
            const filtered = updates.rolesAllowed.filter(r => validRoles.includes(r));
            const oldRoles = (current.rolesAllowed || []).join(',');
            const newRoles = filtered.join(',');
            if (oldRoles !== newRoles) {
                changes.push(`${featureName}.rolesAllowed: [${oldRoles}] → [${newRoles}]`);
                current.rolesAllowed = filtered;
            }
        }

        settings.features.set(featureName, current);
    }

    await settings.save();

    await logAction(req, {
        action: 'UPDATE_SETTINGS',
        targetId: settings._id,
        targetType: 'SystemSettings',
        details: changes.length > 0 ? changes.join(', ') : 'No changes'
    });

    res.json({ message: 'Settings updated', features: settings.getFeaturesObject() });
});

// ============================================================
// STUDENT VERIFICATION
// ============================================================

/**
 * @route   GET /api/admin/verifications?status=pending|approved|rejected&page=1
 * @desc    Get paginated student verification requests
 */
export const getVerificationRequests = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const status = req.query.status || 'pending'; // 'pending' | 'approved' | 'rejected'

    let query = {};
    if (status === 'pending') query.collegeVerified = 'pending';
    else if (status === 'approved') query.collegeVerified = true;
    else if (status === 'rejected') query.collegeVerified = 'rejected';
    else query.collegeVerified = { $in: ['pending', true, 'rejected'] }; // 'all'

    const [users, total] = await Promise.all([
        User.find(query)
            .select('name username email profilePic college collegeId year section collegeVerified collegeVerificationMethod collegeVerifiedAt collegeIdCardUrl verificationNote createdAt')
            .sort({ updatedAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        User.countDocuments(query)
    ]);

    res.json({ users, total, page, pages: Math.ceil(total / limit) });
});

/**
 * @route   PATCH /api/admin/verifications/:id/approve
 * @desc    Approve a student verification request
 */
export const approveVerification = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    user.collegeVerified = true;
    user.verificationNote = '';
    await user.save();

    await logAction(req, {
        action: 'APPROVE_VERIFICATION',
        targetId: user._id,
        targetType: 'User',
        details: `Approved student verification for ${user.username}`
    });

    res.json({ message: `Verification approved for ${user.name}`, collegeVerified: true });
});

/**
 * @route   PATCH /api/admin/verifications/:id/reject
 * @desc    Reject a student verification request
 * @body    { reason?: string }
 */
export const rejectVerification = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    user.collegeVerified = 'rejected';
    user.verificationNote = (req.body.reason || '').slice(0, 300);
    await user.save();

    await logAction(req, {
        action: 'REJECT_VERIFICATION',
        targetId: user._id,
        targetType: 'User',
        details: `Rejected student verification for ${user.username}. Reason: ${user.verificationNote || 'None given'}`
    });

    res.json({ message: `Verification rejected for ${user.name}`, collegeVerified: 'rejected' });
});

/**
 * @route   GET /api/admin/logs
 * @desc    Get paginated audit logs
 */
export const getLogs = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 30, 100);

    const [logs, total] = await Promise.all([
        AdminLog.find()
            .populate('adminId', 'name username email')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        AdminLog.countDocuments()
    ]);

    res.json({
        logs,
        total,
        page,
        pages: Math.ceil(total / limit)
    });
});
