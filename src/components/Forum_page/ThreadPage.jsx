import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MoreHorizontal, Share2, ThumbsUp } from 'lucide-react';
import api from '../../api/axios';
import Avatar from '../common/Avatar';
import Skeleton from '../common/Skeleton';
import ForumReplyList from './ForumReplyList';

const ThreadPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [thread, setThread] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchThread();
    }, [id]);

    const fetchThread = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/forums/posts/${id}`);
            setThread(data);
        } catch (err) {
            console.error("Failed to fetch thread", err);
            setError("Discussion not found.");
        } finally {
            setLoading(false);
        }
    };

    const handleReplyAdded = (newReply) => {
        // Optimistically update or re-fetch?
        // Assuming backend returns the new reply object
        setThread(prev => ({
            ...prev,
            replies: [...(prev.replies || []), newReply]
        }));
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Skeleton for Thread Content */}
                <div className="bg-white p-8 rounded-xl border border-gray-200 space-y-4">
                    <div className="flex gap-4 items-center">
                        <Skeleton variant="circular" className="h-12 w-12" />
                        <div className="space-y-2 w-1/4">
                            <Skeleton variant="rectangular" className="h-4 w-full" />
                            <Skeleton variant="rectangular" className="h-3 w-1/2" />
                        </div>
                    </div>
                    <Skeleton variant="rectangular" className="h-8 w-3/4" />
                    <Skeleton variant="rectangular" className="h-32 w-full" />
                </div>
            </div>
        );
    }

    if (error || !thread) {
        return (
            <div className="text-center py-20">
                <h2 className="text-xl font-bold text-gray-900 mb-2">{error || "Discussion not found"}</h2>
                <button
                    onClick={() => navigate('/forums')}
                    className="text-sky-600 font-bold hover:underline"
                >
                    Back to Discussions
                </button>
            </div>
        );
    }

    // Format Date
    const formattedDate = new Date(thread.createdAt).toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Back Button */}
            <button
                onClick={() => navigate('/forums')}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-medium transition-colors mb-2"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Feed
            </button>

            {/* Main Post */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 sm:p-8">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <Avatar
                                src={thread.author?.profilePic}
                                alt={thread.author?.name}
                                className="w-12 h-12 rounded-full border border-gray-100"
                            />
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                                    {thread.title}
                                </h1>
                                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                    <span className="font-medium text-gray-900">{thread.author?.name}</span>
                                    <span>•</span>
                                    <span>{formattedDate}</span>
                                    {thread.category && (
                                        <>
                                            <span>•</span>
                                            <span className="bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">
                                                {thread.category}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition">
                                <Share2 className="w-5 h-5" />
                            </button>
                            <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition">
                                <MoreHorizontal className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="prose prose-blue max-w-none text-gray-800 leading-relaxed whitespace-pre-wrap mb-8">
                        {thread.content}
                    </div>

                    {/* Tags */}
                    {thread.tags && thread.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-8">
                            {thread.tags.map((tag, i) => (
                                <span key={i} className="text-sm font-medium text-sky-600 bg-sky-50 px-3 py-1.5 rounded-lg">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* ActionBar */}
                    <div className="flex items-center gap-6 pt-6 border-t border-gray-100">
                        <button className="flex items-center gap-2 text-gray-500 hover:text-sky-600 font-medium transition-colors">
                            <ThumbsUp className="w-5 h-5" />
                            <span>{thread.likes?.length || 0} Likes</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Replies Section */}
            <ForumReplyList
                threadId={thread._id}
                replies={thread.replies}
                onReplyAdded={handleReplyAdded}
            />
        </div>
    );
};

export default ThreadPage;
