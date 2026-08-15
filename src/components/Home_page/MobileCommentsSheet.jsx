import React, { useRef, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { FaTimes, FaPaperPlane } from 'react-icons/fa';
import Avatar from '../common/Avatar';
import CommentItem from './CommentItem';

const MobileCommentsSheet = ({
    isOpen,
    onClose,
    comments,
    currentUser,
    onReply,
    onSubmit,
    replyingTo,
    cancelReply,
    submitting
}) => {
    const [shouldRender, setShouldRender] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [localComment, setLocalComment] = useState("");
    const inputRef = useRef(null);
    const commentsEndRef = useRef(null);

    // Handle mount/unmount animations natively with CSS keyframes
    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            setIsClosing(false);
        } else if (shouldRender) {
            setIsClosing(true);
            const timer = setTimeout(() => {
                setShouldRender(false);
            }, 300); // Wait for the slide-down animation to finish
            return () => clearTimeout(timer);
        }
    }, [isOpen, shouldRender]);

    // Handle replyingTo setting the input
    useEffect(() => {
        if (replyingTo) {
            setLocalComment(`@${replyingTo.username} `);
            inputRef.current?.focus();
        }
    }, [replyingTo]);

    const handleFormSubmit = (e) => {
        e.preventDefault();
        onSubmit(e, localComment);
        setLocalComment("");
    };



    // Scroll to bottom on new comment
    useEffect(() => {
        if (isOpen) {
            commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [comments.length, isOpen]);

    if (!shouldRender) return null;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex flex-col justify-end pointer-events-none">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity duration-300 ease-in-out ${isClosing ? 'opacity-0' : 'opacity-100 animate-in fade-in'}`}
                onClick={onClose}
            />

            {/* Sheet */}
            <div
                className={`bg-white w-full h-[80dvh] rounded-t-[2rem] shadow-xl overflow-hidden pointer-events-auto flex flex-col transform ${isClosing ? 'animate-slide-down' : 'animate-slide-up'}`}
            >

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0 bg-white z-10 rounded-t-[2rem]">
                    <div className="w-10"></div> {/* Spacer */}
                    <div className="flex flex-col items-center">
                        <div className="w-12 h-1.5 bg-gray-200 rounded-full mb-3" />
                        <h3 className="font-bold text-gray-900">Comments</h3>
                        <span className="text-xs text-gray-500 font-medium">{comments.length} comments</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-900 bg-gray-50 rounded-full transition"
                    >
                        <FaTimes />
                    </button>
                </div>

                {/* Comments List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-white custom-scrollbar">
                    {comments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 pb-12">
                            <p className="font-medium text-gray-900">No comments yet</p>
                            <p className="text-sm mt-1">Be the first to start the conversation!</p>
                        </div>
                    ) : (
                        comments.map((comment, index) => (
                            <CommentItem
                                key={index}
                                comment={comment}
                                onReply={onReply}
                                currentUser={currentUser}
                            />
                        ))
                    )}
                    <div ref={commentsEndRef} />
                </div>

                {/* Input Area (Sticky Bottom) */}
                <div className="p-4 bg-white border-t border-gray-100 flex-shrink-0 pb-safe">
                    {replyingTo && (
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-2 px-2 bg-sky-50 py-1.5 rounded-lg border border-sky-100">
                            <span>Replying to <span className="font-bold text-sky-600">@{replyingTo.username}</span></span>
                            <button onClick={cancelReply} className="font-bold text-gray-400 hover:text-gray-900 px-2">✕</button>
                        </div>
                    )}

                    <form onSubmit={handleFormSubmit} className="flex gap-3 items-end">
                        <Avatar
                            src={currentUser?.profilePic}
                            alt="You"
                            size="sm"
                            className="hidden sm:block mb-1"
                        />
                        <div className="relative flex-1">
                            <input
                                ref={inputRef}
                                type="text"
                                value={localComment}
                                onChange={(e) => setLocalComment(e.target.value)}
                                placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
                                className={`w-full bg-gray-100 border-transparent focus:bg-white border focus:border-sky-500 rounded-2xl px-5 py-3.5 pr-12 text-sm focus:outline-none transition-all shadow-sm ${replyingTo ? 'ring-2 ring-sky-100' : ''}`}
                            />
                            <button
                                type="submit"
                                disabled={!localComment.trim() || submitting}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-sky-600 text-white rounded-full hover:bg-sky-700 transition disabled:opacity-50 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md"
                            >
                                <FaPaperPlane size={14} className="" />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>,
        document.body
    );
};

MobileCommentsSheet.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    comments: PropTypes.array.isRequired,
    currentUser: PropTypes.object,
    onReply: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    replyingTo: PropTypes.object,
    cancelReply: PropTypes.func.isRequired,
    submitting: PropTypes.bool
};

export default MobileCommentsSheet;
