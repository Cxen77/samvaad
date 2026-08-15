import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import Post from '../models/Post.js';
import Team from '../models/Team.js';
import Event from '../models/Event.js';

// Helper function to format posts with likes metrics
const formatPosts = (posts, currentUserId) => {
    return posts.map(post => {
        const likesList = post.likes || [];
        const likedByUser = likesList.some(id => id.toString() === currentUserId.toString());

        // Build minimal team payload (same as postController)
        let attachedTeam = null;
        if (post.attachedTeamId) {
            const t = post.attachedTeamId;
            if (t && typeof t === 'object' && t.name) {
                attachedTeam = {
                    _id: t._id,
                    name: t.name,
                    category: t.category,
                    isLookingForMembers: t.isLookingForMembers,
                    openRoles: (t.openRoles || []).filter(r => r.isOpen).slice(0, 5).map(r => ({ _id: r._id, title: r.title })),
                    membersCount: Array.isArray(t.members) ? t.members.length : 0
                };
            }
        }

        let attachedEvent = null;
        if (post.attachedEventId) {
            const e = post.attachedEventId;
            if (e && typeof e === 'object' && e.title) {
                attachedEvent = {
                    _id: e._id,
                    title: e.title,
                    category: e.category,
                    date: e.date,
                    location: e.location,
                    imageUrl: e.imageUrl
                };
            }
        }

        return {
            _id: post._id,
            user: post.user,
            content: post.content,
            image: post.image,
            likes: post.likes || [],
            createdAt: post.createdAt,
            // Computed fields instead of arrays
            likesCount: likesList.length,
            commentsCount: post.commentsCount || (post.comments ? post.comments.length : 0),
            likedByUser,
            attachedTeam,
            hasAttachedTeam: !!post.attachedTeamId,
            attachedEvent,
            hasAttachedEvent: !!post.attachedEventId
        };
    });
};

// Helper function to format user response (matches userController)
const formatUserResponse = (user) => {
    return {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        profilePic: user.profilePic || undefined,
        bannerPic: user.bannerPic || undefined,
        course: user.course,
        college: user.college,
        collegeId: user.collegeId,
        year: user.year,
        section: user.section,
        className: user.className,
        location: user.location,
        bio: user.bio,
        skills: user.skills,
        socials: user.socials,
        followers: user.followers,
        following: user.following,
        settings: user.settings,
        teams: user.teams || [],
        projects: user.projects || [],
        role: user.role,
        isSuspended: user.isSuspended,
        collegeVerified: user.collegeVerified,
        collegeVerificationMethod: user.collegeVerificationMethod || null,
        collegeVerifiedAt: user.collegeVerifiedAt || null,
        verificationNote: user.verificationNote || '',
        githubId: user.githubId
    };
};

// @desc    Get aggregated home data
// @route   GET /api/home
// @access  Private
const getHomeData = asyncHandler(async (req, res) => {
    const isMobile = req.query.device === 'mobile';
    const userId = req.user._id;

    // 1. Fetch Posts (Feed) - Always needed for both Desktop and Mobile
    // Default to "For You" feed (all posts) for the initial load
    const pageSize = 10;
    const postQuery = { isDeleted: { $ne: true } };

    const feedPromise = Post.find(postQuery)
        .populate('user', 'name username profilePic collegeVerified course')
        .populate('attachedTeamId', 'name category isLookingForMembers openRoles members')
        .populate('attachedEventId', 'title category date location imageUrl')
        // DONT POPULATE COMMENTS — Saves DB memory and massive payload size
        .limit(pageSize)
        .sort({ createdAt: -1 }) // Hits the new compound index
        .select('-__v') // Exclude the version key
        .lean();

    if (isMobile) {
        // Mobile only needs Feed data
        const rawPosts = await feedPromise;
        const count = await Post.countDocuments(postQuery);

        return res.json({
            feed: {
                posts: formatPosts(rawPosts, userId),
                page: 1,
                pages: Math.ceil(count / pageSize)
            }
        });
    }

    // 2. Fetch Profile, Trending Events, Recommended Users, Open Teams for Desktop
    const profilePromise = User.findById(userId)
        .populate({
            path: 'teams',
            select: 'name category members admins',
            populate: { path: 'admins', select: '_id' }
        });

    const eventsPromise = Event.find({ isApproved: true, isDeleted: { $ne: true } })
        .populate('organizer', 'name username profilePic')
        .sort({ date: 1 })
        .limit(3)
        .lean();

    const recommendedUsersPromise = User.find({ _id: { $ne: userId } })
        .select('name username profilePic skills collegeVerified')
        .limit(5)
        .lean();

    const openTeamsPromise = Team.find({
        isLookingForMembers: true,
        visibility: 'public',
        teamStatus: 'active'
    })
        .select('name category openRoles members createdBy description teamStatus')
        .populate('members', '_id')
        .populate('createdBy', 'name username profilePic')
        .limit(5)
        .sort({ createdAt: -1 })
        .lean();

    // Execute all queries in parallel
    const [rawPosts, profileUser, events, recommendedPeople, openTeams] = await Promise.all([
        feedPromise,
        profilePromise,
        eventsPromise,
        recommendedUsersPromise,
        openTeamsPromise
    ]);

    const posts = formatPosts(rawPosts, userId);

    // Format profile and get post count
    let profile = null;
    if (profileUser) {
        const postsCount = await Post.countDocuments({ user: userId });
        profile = formatUserResponse(profileUser);
        profile.postsCount = postsCount;
    }

    const count = await Post.countDocuments(postQuery);

    res.json({
        profile,
        feed: {
            posts,
            page: 1,
            pages: Math.ceil(count / pageSize)
        },
        trendingEvents: events,
        recommendedPeople,
        openTeams
    });
});

export { getHomeData };
