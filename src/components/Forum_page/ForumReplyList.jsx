import React, { useState } from 'react';
import { Send } from 'lucide-react';
import ForumReplyItem from './ForumReplyItem';
import api from '../../api/axios';

const ForumReplyList = ({ threadId, replies = [], onReplyAdded }) => {
    const [newReply, setNewReply] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newReply.trim()) return;

        setSubmitting(true);
        try {
            const { data } = await api.post(`/forums/posts/${threadId}/replies`, {
                content: newReply
            });
            onReplyAdded(data);
            setNewReply('');
        } catch (err) {
            console.error("Failed to post reply", err);
            // toast.error? 
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-bold text-gray-900">
                    Replies <span className="text-gray-500 font-normal">({replies.length})</span>
                </h3>
            </div>

            {/* List */}
            <div>
                {replies.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 italic">
                        No replies yet. Be the first to verify!
                    </div>
                ) : (
                    replies.map((reply) => (
                        <ForumReplyItem key={reply._id} reply={reply} />
                    ))
                )}
            </div>

            {/* Input */}
            <div className="p-4 sm:p-6 bg-gray-50 border-t border-gray-200">
                <form onSubmit={handleSubmit} className="flex gap-4">
                    <div className="flex-1 relative">
                        <textarea
                            value={newReply}
                            onChange={(e) => setNewReply(e.target.value)}
                            placeholder="Write a reply..."
                            rows={1} // Auto-grow could be nice but keeping simple for now
                            className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition resize-none bg-white font-medium"
                            style={{ minHeight: '48px' }}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!newReply.trim() || submitting}
                        className="flex-shrink-0 h-12 w-12 flex items-center justify-center bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                        {submitting ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ForumReplyList;
