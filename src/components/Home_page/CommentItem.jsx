import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Avatar from '../common/Avatar';
import VerifiedBadge from '../common/VerifiedBadge';

const CommentItem = ({ comment, isReply = false, parentId = null, onReply, currentUser }) => {
    const [showReplies, setShowReplies] = useState(false);

    // Check if the comment mentions the current user
    const isMentioningMe = (text) => {
        if (!currentUser?.username) return false;
        return text.includes(`@${currentUser.username}`);
    };

    const isMention = isMentioningMe(comment.text);
    const hasReplies = !isReply && comment.replies && comment.replies.length > 0;

    return (
        <div className={`flex gap-3 group ${isReply ? 'mt-3' : ''} ${comment.isOptimistic ? 'animate-in fade-in slide-in-from-bottom-2 duration-300' : ''}`}>
            <div className="flex-shrink-0 flex flex-col items-center">
                <Link to={`/profile/${comment.user?.username}`}>
                    <Avatar
                        src={comment.user?.profilePic}
                        alt={comment.user?.name || 'User'}
                        size={isReply ? "xs" : "sm"}
                        className="mt-1 hover:opacity-80 transition"
                    />
                </Link>
                {hasReplies && showReplies && (
                    <div className="w-0.5 flex-1 bg-gray-200 my-1 rounded-full group-hover:bg-gray-300 transition-colors"></div>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className={`rounded-2xl px-3.5 py-2.5 inline-block ${isMention ? 'bg-sky-50 border border-sky-100' : 'bg-gray-100'}`}>
                    <div className="flex items-center gap-1 text-xs">
                        <Link to={`/profile/${comment.user?.username}`}>
                            <h5 className="font-bold text-gray-900 hover:underline cursor-pointer">
                                {comment.user?.name || 'Unknown User'}
                            </h5>
                        </Link>
                        <VerifiedBadge verified={comment.user?.collegeVerified} />
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap mt-0.5">
                        {comment.text.split(' ').map((word, i) => (
                            word.startsWith('@') ? <span key={i} className="text-sky-600 font-medium">{word} </span> : word + ' '
                        ))}
                    </p>
                </div>

                <div className="flex items-center gap-4 mt-1.5 ml-1 text-xs text-gray-500 font-bold">
                    <span>{new Date(comment.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <button className="hover:text-gray-900 transition">Like</button>
                    <button
                        onClick={() => onReply(parentId || comment._id || comment.id, comment.user?.username || 'user')}
                        className="hover:text-gray-900 transition"
                    >
                        Reply
                    </button>
                </div>

                {/* View Replies Toggle */}
                {hasReplies && (
                    <button
                        onClick={() => setShowReplies(!showReplies)}
                        className="text-xs text-gray-500 font-bold mt-2 ml-1 hover:text-gray-800 flex items-center gap-2"
                    >
                        <div className="w-6 h-[2px] bg-gray-200"></div>
                        {showReplies ? "Hide replies" : `View ${comment.replies.length} more replies`}
                    </button>
                )}

                {/* Render Replies */}
                {hasReplies && showReplies && (
                    <div className="mt-2 pl-2">
                        {comment.replies.map((reply, idx) => (
                            <CommentItem
                                key={idx}
                                comment={reply}
                                isReply={true}
                                parentId={comment._id}
                                onReply={onReply}
                                currentUser={currentUser}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

CommentItem.propTypes = {
    comment: PropTypes.shape({
        _id: PropTypes.string,
        id: PropTypes.string,
        text: PropTypes.string,
        createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
        user: PropTypes.shape({
            name: PropTypes.string,
            username: PropTypes.string,
            profilePic: PropTypes.string
        }),
        replies: PropTypes.array
    }).isRequired,
    isReply: PropTypes.bool,
    parentId: PropTypes.string,
    onReply: PropTypes.func.isRequired,
    currentUser: PropTypes.object
};

export default CommentItem;
