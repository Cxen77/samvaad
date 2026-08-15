import asyncHandler from 'express-async-handler';
import Forum from '../models/Forum.js';
import ForumPost from '../models/ForumPost.js';
import Reply from '../models/Reply.js';
import User from '../models/User.js';

// @desc    Create a new forum
// @route   POST /api/forums
// @access  Private
const createForum = asyncHandler(async (req, res) => {
    const { name, description, icon, banner, rules, topics } = req.body;

    const forumExists = await Forum.findOne({ name });

    if (forumExists) {
        res.status(400);
        throw new Error('Forum with this name already exists');
    }

    const forum = await Forum.create({
        name,
        description,
        icon,
        banner,
        creator: req.user._id,
        members: [req.user._id], // Creator is automatically a member
        rules,
        topics
    });

    if (forum) {
        res.status(201).json(forum);
    } else {
        res.status(400);
        throw new Error('Invalid forum data');
    }
});

// @desc    Get all forums
// @route   GET /api/forums
// @access  Private
const getAllForums = asyncHandler(async (req, res) => {
    const forums = await Forum.find({})
        .select('name description icon members stats')
        .sort({ 'stats.membersCount': -1, members: -1 }); // Sort by popularity
    res.json(forums);
});

// @desc    Get forum by ID
// @route   GET /api/forums/:id
// @access  Private
const getForumById = asyncHandler(async (req, res) => {
    const forum = await Forum.findById(req.params.id)
        .populate('creator', 'name username profilePic');

    if (forum) {
        res.json(forum);
    } else {
        res.status(404);
        throw new Error('Forum not found');
    }
});

// @desc    Join a forum
// @route   PUT /api/forums/:id/join
// @access  Private
const joinForum = asyncHandler(async (req, res) => {
    const forum = await Forum.findById(req.params.id);

    if (forum) {
        if (forum.members.includes(req.user._id)) {
            res.status(400);
            throw new Error('User already a member');
        }

        forum.members.push(req.user._id);
        if (forum.stats) forum.stats.membersCount = forum.members.length;
        await forum.save();
        res.json(forum);
    } else {
        res.status(404);
        throw new Error('Forum not found');
    }
});

// @desc    Leave a forum
// @route   PUT /api/forums/:id/leave
// @access  Private
const leaveForum = asyncHandler(async (req, res) => {
    const forum = await Forum.findById(req.params.id);

    if (forum) {
        forum.members = forum.members.filter(
            (memberId) => memberId.toString() !== req.user._id.toString()
        );
        if (forum.stats) forum.stats.membersCount = forum.members.length;
        await forum.save();
        res.json(forum);
    } else {
        res.status(404);
        throw new Error('Forum not found');
    }
});

// @desc    Create a post in a forum
// @route   POST /api/forums/:id/posts
// @access  Private
const createPost = asyncHandler(async (req, res) => {
    const { title, content, image, tags } = req.body;
    const forumId = req.params.id;

    const forum = await Forum.findById(forumId);
    if (!forum) {
        res.status(404);
        throw new Error('Forum not found');
    }

    const post = await ForumPost.create({
        title,
        content,
        image,
        tags,
        author: req.user._id,
        forum: forumId
    });

    // Update forum stats
    if (forum.stats) {
        forum.stats.postsCount += 1;
        await forum.save();
    }

    const populatedPost = await ForumPost.findById(post._id)
        .populate('author', 'name username profilePic')
        .populate('forum', 'name icon');

    res.status(201).json(populatedPost);
});

// @desc    Get posts for a specific forum
// @route   GET /api/forums/:id/posts
// @access  Private
const getForumPosts = asyncHandler(async (req, res) => {
    const { sort, filter } = req.query;
    let sortOption = { createdAt: -1 };

    if (sort === 'top') {
        sortOption = { likes: -1 }; // Approximate "top" by likes
    } else if (sort === 'trending') {
        // Complex trending logic can go here, for now use views
        sortOption = { views: -1 };
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await ForumPost.find({ forum: req.params.id, isDeleted: { $ne: true } })
        .populate('author', 'name username profilePic')
        .populate('forum', 'name icon')
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .lean();

    const total = await ForumPost.countDocuments({ forum: req.params.id, isDeleted: { $ne: true } });

    res.json({
        posts,
        page,
        pages: Math.ceil(total / limit),
        total
    });
});

// @desc    Get all posts (Feed)
// @route   GET /api/forums/posts/feed
// @access  Private
const getAllPosts = asyncHandler(async (req, res) => {
    const { search } = req.query;
    let query = { isDeleted: { $ne: true } };

    if (search) {
        query.$text = { $search: search };
    }

    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    const posts = await ForumPost.find(query)
        .populate('author', 'name username profilePic')
        .populate('forum', 'name icon')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    const total = await ForumPost.countDocuments(query);

    res.json({
        posts,
        page,
        pages: Math.ceil(total / limit),
        total
    });
});

// @desc    Get single post details with replies
// @route   GET /api/forums/posts/:id
// @access  Private
const getPostDetails = asyncHandler(async (req, res) => {
    const post = await ForumPost.findOne({ _id: req.params.id, isDeleted: { $ne: true } })
        .populate('author', 'name username profilePic')
        .populate('forum', 'name icon');

    if (!post) {
        res.status(404);
        throw new Error('Post not found');
    }

    // Increment views
    post.views += 1;
    await post.save();

    // Fetch top-level replies
    const replies = await Reply.find({ post: post._id, parentReply: null })
        .populate('author', 'name username profilePic')
        .populate({
            path: 'parentReply', // Should be null for top level, but for safety
            populate: { path: 'author', select: 'name' }
        })
        .sort({ createdAt: 1 });

    // For each reply, fetch its children (1 level deep for now, or recursive on frontend)
    // A better approach for deep nesting is fetching all replies for the post and constructing the tree on the frontend
    // or using a recursive query. For simplicity/performance, let's fetch all replies for this post.
    const allReplies = await Reply.find({ post: post._id })
        .populate('author', 'name username profilePic')
        .sort({ createdAt: 1 });

    res.json({ post, replies: allReplies });
});

// @desc    Create a reply
// @route   POST /api/forums/posts/:id/reply
// @access  Private
const createReply = asyncHandler(async (req, res) => {
    const { content, parentReplyId } = req.body;
    const postId = req.params.id;

    const post = await ForumPost.findById(postId);
    if (!post) {
        res.status(404);
        throw new Error('Post not found');
    }

    const reply = await Reply.create({
        content,
        author: req.user._id,
        post: postId,
        parentReply: parentReplyId || null
    });

    // Update parent post
    await ForumPost.findByIdAndUpdate(postId, {
        $set: { lastActivity: Date.now() },
        $inc: { repliesCount: 1 }
    });

    const populatedReply = await Reply.findById(reply._id)
        .populate('author', 'name username profilePic');

    res.status(201).json(populatedReply);
});

// @desc    Toggle Like on a post
// @route   PUT /api/forums/posts/:id/like
// @access  Private
const toggleLike = asyncHandler(async (req, res) => {
    const post = await ForumPost.findById(req.params.id);

    if (post) {
        if (post.dislikes.includes(req.user._id)) {
            post.dislikes = post.dislikes.filter(id => id.toString() !== req.user._id.toString());
        }

        if (post.likes.includes(req.user._id)) {
            post.likes = post.likes.filter(id => id.toString() !== req.user._id.toString());
        } else {
            post.likes.push(req.user._id);
        }

        await post.save();
        res.json(post);
    } else {
        res.status(404);
        throw new Error('Post not found');
    }
});

// @desc    Toggle Dislike on a post
// @route   PUT /api/forums/posts/:id/dislike
// @access  Private
const toggleDislike = asyncHandler(async (req, res) => {
    const post = await ForumPost.findById(req.params.id);

    if (post) {
        if (post.likes.includes(req.user._id)) {
            post.likes = post.likes.filter(id => id.toString() !== req.user._id.toString());
        }

        if (post.dislikes.includes(req.user._id)) {
            post.dislikes = post.dislikes.filter(id => id.toString() !== req.user._id.toString());
        } else {
            post.dislikes.push(req.user._id);
        }

        await post.save();
        res.json(post);
    } else {
        res.status(404);
        throw new Error('Post not found');
    }
});

// @desc    Toggle Like on a reply
// @route   PUT /api/forums/replies/:id/like
// @access  Private
const toggleReplyLike = asyncHandler(async (req, res) => {
    const reply = await Reply.findById(req.params.id);

    if (reply) {
        if (reply.dislikes.includes(req.user._id)) {
            reply.dislikes = reply.dislikes.filter(id => id.toString() !== req.user._id.toString());
        }

        if (reply.likes.includes(req.user._id)) {
            reply.likes = reply.likes.filter(id => id.toString() !== req.user._id.toString());
        } else {
            reply.likes.push(req.user._id);
        }

        await reply.save();
        res.json(reply);
    } else {
        res.status(404);
        throw new Error('Reply not found');
    }
});

// @desc    Toggle Dislike on a reply
// @route   PUT /api/forums/replies/:id/dislike
// @access  Private
const toggleReplyDislike = asyncHandler(async (req, res) => {
    const reply = await Reply.findById(req.params.id);

    if (reply) {
        if (reply.likes.includes(req.user._id)) {
            reply.likes = reply.likes.filter(id => id.toString() !== req.user._id.toString());
        }

        if (reply.dislikes.includes(req.user._id)) {
            reply.dislikes = reply.dislikes.filter(id => id.toString() !== req.user._id.toString());
        } else {
            reply.dislikes.push(req.user._id);
        }

        await reply.save();
        res.json(reply);
    } else {
        res.status(404);
        throw new Error('Reply not found');
    }
});

// @desc    Search posts
// @route   GET /api/forums/search
// @access  Private
const searchPosts = asyncHandler(async (req, res) => {
    const { q } = req.query;
    if (!q) {
        res.json([]);
        return;
    }

    const posts = await ForumPost.find({ $text: { $search: q }, isDeleted: { $ne: true } })
        .populate('author', 'name username profilePic')
        .populate('forum', 'name icon')
        .sort({ score: { $meta: "textScore" } })
        .lean();

    res.json(posts);
});

// @desc    Toggle Save/Bookmark Post
// @route   PUT /api/forums/posts/:id/save
// @access  Private
const toggleSavePost = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    const postId = req.params.id;

    if (user.savedPosts.includes(postId)) {
        user.savedPosts = user.savedPosts.filter(id => id.toString() !== postId);
        await user.save();
        res.json({ saved: false });
    } else {
        user.savedPosts.push(postId);
        await user.save();
        res.json({ saved: true });
    }
});

// @desc    Report a post
// @route   POST /api/forums/posts/:id/report
// @access  Private
const reportPost = asyncHandler(async (req, res) => {
    const { reason } = req.body;
    // In a real app, save to a Report model. For now, just log it.
    console.log(`Report filed for post ${req.params.id} by ${req.user._id}: ${reason}`);
    res.status(201).json({ message: 'Report submitted' });
});

export {
    createForum,
    getAllForums,
    getForumById,
    joinForum,
    leaveForum,
    createPost,
    getForumPosts,
    getAllPosts,
    getPostDetails,
    createReply,
    toggleLike,
    toggleDislike,
    toggleReplyLike,
    toggleReplyDislike,
    searchPosts,
    toggleSavePost,
    reportPost
};
