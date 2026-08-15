import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Eye, Clock, ThumbsUp } from 'lucide-react';
import Avatar from '../common/Avatar'; // Assuming common Avatar component exists
// function to formal date
const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours === 0) {
            const minutes = Math.floor(diff / (1000 * 60));
            return `${minutes}m ago`;
        }
        return `${hours}h ago`;
    }
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
};

const ForumThreadCard = ({ thread }) => {
    const navigate = useNavigate();

    return (
        <div
            onClick={() => navigate(`/forums/post/${thread._id}`)}
            className="group bg-white p-5 sm:p-6 rounded-xl border border-gray-200 hover:border-sky-300 hover:shadow-md transition-all cursor-pointer relative"
        >
            {/* Category Badge - Absolute top right or inline? Inline looks cleaner */}

            <div className="flex items-start gap-4">
                {/* Author Avatar (Hidden on tiny screens, maybe?) */}
                <div className="flex-shrink-0 hidden sm:block">
                    <Avatar
                        src={thread.author?.profilePic}
                        alt={thread.author?.name}
                        className="w-10 h-10 rounded-full"
                    />
                </div>

                <div className="flex-1 min-w-0">
                    {/* Header: Author & Time */}
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <div className="sm:hidden">
                            <Avatar src={thread.author?.profilePic} className="w-5 h-5 rounded-full" />
                        </div>
                        <span className="font-semibold text-gray-900">{thread.author?.name || 'Unknown User'}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(thread.createdAt)}
                        </span>
                        {thread.category && (
                            <>
                                <span>•</span>
                                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium uppercase tracking-wide text-[10px]">
                                    {thread.category}
                                </span>
                            </>
                        )}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight group-hover:text-sky-600 transition-colors">
                        {thread.title}
                    </h3>

                    {/* Preview Content */}
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {thread.content}
                    </p>

                    {/* Tags & Stats Footer */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                        {/* Tags */}
                        <div className="flex flex-wrap gap-2">
                            {thread.tags?.slice(0, 3).map((tag, i) => (
                                <span key={i} className="text-xs font-medium text-sky-600 bg-sky-50 px-2 py-1 rounded hover:bg-sky-100 transition-colors">
                                    #{tag}
                                </span>
                            ))}
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-gray-400 text-sm font-medium">
                            <div className="flex items-center gap-1.5 hover:text-gray-600 transition-colors">
                                <ThumbsUp className="w-4 h-4" />
                                <span>{thread.likes?.length || 0}</span>
                            </div>
                            <div className="flex items-center gap-1.5 hover:text-gray-600 transition-colors">
                                <MessageSquare className="w-4 h-4" />
                                <span>{thread.replies?.length || 0}</span>
                            </div>
                            <div className="flex items-center gap-1.5 hover:text-gray-600 transition-colors">
                                <Eye className="w-4 h-4" />
                                <span>{thread.views || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForumThreadCard;
