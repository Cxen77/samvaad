import React from 'react';
import Avatar from '../common/Avatar';
import { Clock } from 'lucide-react';

const ForumReplyItem = ({ reply }) => {
    // Basic date formatting
    const formattedDate = new Date(reply.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    return (
        <div className="flex gap-4 p-4 sm:p-6 bg-white border-b border-gray-100 last:border-0">
            {/* Author Avatar */}
            <div className="flex-shrink-0">
                <Avatar
                    src={reply.author?.profilePic}
                    alt={reply.author?.name}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full"
                />
            </div>

            <div className="flex-1 space-y-2">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-sm sm:text-base">
                            {reply.author?.name || 'Unknown User'}
                        </span>
                        <span className="text-gray-400 text-xs">•</span>
                        <div className="flex items-center gap-1 text-gray-400 text-xs">
                            <Clock className="w-3 h-3" />
                            {formattedDate}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="text-gray-700 text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                    {reply.content}
                </div>
            </div>
        </div>
    );
};

export default ForumReplyItem;
