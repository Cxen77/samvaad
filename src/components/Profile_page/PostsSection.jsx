import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import PostCard from '../Home_page/PostCard';
import toast from 'react-hot-toast';
import CreatePost from '../Home_page/CreatePost';

const PostsSection = ({ isOwner, user, currentUser, className = "" }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?._id) {
            fetchPosts();
        }
    }, [user?._id]);

    const fetchPosts = async () => {
        try {
            const res = await api.get(`/posts?userId=${user._id}`);
            // Ensure posts is an array before setting
            setPosts(Array.isArray(res.data.posts) ? res.data.posts : []);
        } catch (err) {
            console.error("Failed to fetch user posts", err);
            setPosts([]);
        } finally {
            setLoading(false);
        }
    };

    const handlePostCreated = (newPost) => {
        setPosts(prev => [newPost, ...prev]);
        toast.success("Post created!");
    };

    const handleDeletePost = async (postId) => {
        if (!window.confirm("Are you sure you want to delete this post?")) return;

        try {
            await api.delete(`/posts/${postId}`);
            setPosts(prev => prev.filter(p => p._id !== postId));
            toast.success("Post deleted successfully");
        } catch (err) {
            console.error("Failed to delete post", err);
            toast.error("Failed to delete post");
        }
    };

    if (loading) {
        return <div className="text-center py-4 text-gray-500">Loading posts...</div>;
    }

    return (
        <div className={`flex flex-col space-y-6 ${className}`}>

            {/* Scrollable Feed Container */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-2 pb-2">
                {/* Posts Feed */}
                {posts.length === 0 ? (
                    <div className="text-center py-8 bg-white rounded-xl border border-gray-200 text-gray-500">
                        No posts yet.
                    </div>
                ) : (
                    posts.map((post) => (
                        <PostCard
                            key={post._id}
                            post={post}
                            currentUser={currentUser}
                            onDelete={handleDeletePost}
                        />
                    ))
                )}

                {/* Load More */}
                {posts.length > 0 && (
                    <div className="text-center py-4">
                        <button className="px-6 py-2 text-sky-600 hover:bg-sky-50 rounded-lg transition font-semibold">
                            Load More Posts
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PostsSection;
