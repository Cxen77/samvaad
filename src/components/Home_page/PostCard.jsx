import React, { useState, useRef } from "react";
import PropTypes from 'prop-types';
import { HiThumbUp, HiOutlineThumbUp, HiChatAlt, HiShare, HiDotsHorizontal, HiPaperAirplane, HiTrash } from "react-icons/hi";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import Avatar from "../common/Avatar";
import useIsMobile from "../../hooks/useIsMobile";
import MobileCommentsSheet from "./MobileCommentsSheet";
import CommentItem from "./CommentItem";
import VerifiedBadge from "../common/VerifiedBadge";
import AttachedTeamCard from "./AttachedTeamCard";
import AttachedEventCard from "./AttachedEventCard";
import { useQueryClient } from "@tanstack/react-query";

export default function PostCard({ post, currentUser = {}, onDelete }) {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  // Normalize data to handle both frontend mock and backend data formats
  const displayPost = {
    id: post.id || post._id,
    author: post.author || post.user?.name || "Unknown User",
    username: post.username || post.user?.username || "user",
    avatar: post.avatar || post.user?.profilePic,
    collegeVerified: post.collegeVerified ?? post.user?.collegeVerified ?? false,
    role: post.role || (post.user?.course ? `${post.user.course} Student` : "Member"),
    time: post.time || (post.createdAt ? new Date(post.createdAt).toLocaleDateString() : "Just now"),
    text: post.text || post.content,
    image: post.image,
    likesCount: post.likesCount ?? (Array.isArray(post.likes) ? post.likes.length : (post.likes || 0)),
    commentsCount: Array.isArray(post.comments) ? post.comments.length : (post.comments || 0),
    isLiked: post.likedByUser ?? (Array.isArray(post.likes) ? post.likes.includes(currentUser?._id) : false),
    userId: post.user?._id || post.user, // Store user ID for ownership check
    attachedTeam: post.attachedTeam,
    attachedEvent: post.attachedEvent
  };

  // console.log(`[PostCard] Rendering post ${displayPost.id}. Attached team:`, displayPost.attachedTeam);

  const isOwner = (currentUser?._id && currentUser._id === displayPost.userId) ||
    (currentUser?.username && currentUser.username === displayPost.username);

  const [liked, setLiked] = useState(displayPost.isLiked);
  const [likeCount, setLikeCount] = useState(displayPost.likesCount);
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [comments, setComments] = useState([]); // Default empty array instead of post.comments
  const [commentsCount, setCommentsCount] = useState(displayPost.commentsCount);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null); // { id: string, username: string }
  const inputRef = useRef(null);

  // Lazy load comments when section is opened
  const handleToggleComments = async () => {
    const willShow = !showComments;
    setShowComments(willShow);

    if (willShow && !commentsLoaded) {
      setLoadingComments(true);
      try {
        const { data } = await api.get(`/posts/${displayPost.id}/comments`);
        setComments(data);
        setCommentsLoaded(true);
      } catch (err) {
        console.error("Failed to load comments", err);
      } finally {
        setLoadingComments(false);
      }
    }
  };

  const handleReply = (commentId, username) => {
    setReplyingTo({ id: commentId, username });
    setNewComment(`@${username} `);

    // Focus appropriate input
    if (isMobile) {
      // Mobile sheet handles focus internally via prop/effect
    } else {
      inputRef.current?.focus();
    }
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setNewComment("");
  };

  const handleLike = async () => {
    try {
      // Optimistic update
      setLiked(!liked);
      setLikeCount(prev => liked ? prev - 1 : prev + 1);

      const { data } = await api.put(`/posts/${displayPost.id}/like`);

      // Override optimistic guess with absolute database truth
      if (data && typeof data.likedByUser === 'boolean') {
        setLiked(data.likedByUser);
        setLikeCount(data.likesCount);

        // Update React Query cache so navigating away and back retains state
        const updateCache = (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map(p => ({
              ...p,
              posts: p.posts.map(cachedPost =>
                cachedPost._id === displayPost.id
                  ? { ...cachedPost, likedByUser: data.likedByUser, likesCount: data.likesCount }
                  : cachedPost
              )
            }))
          };
        };

        queryClient.setQueryData(['posts', 'For You'], updateCache);
        queryClient.setQueryData(['posts', 'Following'], updateCache);
      }
    } catch (err) {
      console.error("Failed to like post", err);
      // Revert on error
      setLiked(!liked);
      setLikeCount(prev => liked ? prev - 1 : prev + 1);
    }
  };

  const handleCommentSubmit = async (e, customText) => {
    e.preventDefault();
    const textToSubmit = customText || newComment;
    if (!textToSubmit.trim()) return;

    setSubmittingComment(true);

    const tempId = `temp-${Date.now()}`;
    const optimisticComment = {
      _id: tempId,
      text: textToSubmit,
      user: currentUser,
      createdAt: new Date().toISOString(),
      likes: [],
      replies: [],
      isOptimistic: true
    };

    // Optimistically add root comments
    if (!replyingTo) {
      setComments(prev => [optimisticComment, ...prev]);
      setCommentsCount(prev => prev + 1);
    }

    if (!customText) setNewComment(""); // Clear desktop input

    try {
      let newlyCreatedComment;
      if (replyingTo) {
        const { data } = await api.post(`/posts/${displayPost.id}/comments/${replyingTo.id}/replies`, { text: textToSubmit });
        // Replies logic varies a bit depending on backend schema, assume we just append/reload for now
        newlyCreatedComment = data;
      } else {
        const { data } = await api.post(`/posts/${displayPost.id}/comments`, { text: textToSubmit, parentCommentId: null });
        newlyCreatedComment = data;
      }

      // Replace optimistic temp comment with real DB response
      setComments(prev => prev.map(c => c._id === tempId ? newlyCreatedComment : c));
      setReplyingTo(null);

      // Update React Query cache for comment counts
      const updateCache = (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map(p => ({
            ...p,
            posts: p.posts.map(cachedPost =>
              cachedPost._id === displayPost.id
                ? { ...cachedPost, commentsCount: cachedPost.commentsCount + 1 }
                : cachedPost
            )
          }))
        };
      };
      queryClient.setQueryData(['posts', 'For You'], updateCache);
      queryClient.setQueryData(['posts', 'Following'], updateCache);

    } catch (err) {
      console.error("Failed to add comment/reply", err);
      // Revert if failed
      if (!replyingTo) {
        setComments(prev => prev.filter(c => c._id !== tempId));
        setCommentsCount(prev => prev - 1);
      }
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/post/${displayPost.id}`;
    if (navigator.share) {
      navigator.share({
        title: `Post by ${displayPost.author}`,
        text: `Check out this post on Synapse!`,
        url: url
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300">
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <Link to={`/profile/${displayPost.username}`}>
          <Avatar
            src={displayPost.avatar}
            alt={displayPost.author}
            size="md"
            className="ring-2 ring-white shadow-sm transition-transform hover:scale-105"
          />
        </Link>
        <div className="flex-1 min-w-0">
          <Link to={`/profile/${displayPost.username}`}>
            <div className="flex items-center gap-1 text-sm md:text-base">
              <h4 className="font-bold text-gray-900 hover:text-sky-600 cursor-pointer transition truncate">
                {displayPost.author}
              </h4>
              <VerifiedBadge verified={displayPost.collegeVerified} />
            </div>
          </Link>
          <p className="text-xs text-gray-500 truncate">
            {displayPost.role} • {displayPost.time}
          </p>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-50 transition"
          >
            <HiDotsHorizontal className="w-5 h-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-10 animate-in fade-in zoom-in-95 duration-200">
              {isOwner && onDelete ? (
                <button
                  onClick={() => {
                    onDelete(displayPost.id);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors font-medium"
                >
                  <HiTrash className="w-4 h-4" />
                  Delete Post
                </button>
              ) : (
                <button
                  onClick={() => {
                    // Handle report logic here
                    alert("Reported post");
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Report Post
                </button>
              )}
              <button
                onClick={() => {
                  handleShare();
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Copy Link
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Overlay to close menu when clicking outside */}
      {showMenu && (
        <div className="fixed inset-0 z-0" onClick={() => setShowMenu(false)}></div>
      )}

      {/* Body Content */}
      <div className="px-4 pb-3">
        <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{displayPost.text}</p>
      </div>

      {/* Image Attachment */}
      {displayPost.image && (
        <div className="w-full bg-gray-50 border-y border-gray-100">
          <img
            src={displayPost.image.replace('/upload/', '/upload/q_auto,f_auto/')}
            alt="post"
            className="w-full h-auto max-h-[500px] object-contain mx-auto"
            loading="lazy"
          />
        </div>
      )}

      {/* Attached Team Card */}
      {displayPost.attachedTeam && (
        <AttachedTeamCard team={displayPost.attachedTeam} />
      )}

      {/* Attached Event Card */}
      {displayPost.attachedEvent && (
        <AttachedEventCard event={displayPost.attachedEvent} />
      )}

      {/* Stats Row */}
      <div className="px-4 py-3 flex items-center justify-between text-xs text-gray-500 border-b border-gray-50">
        <div className="flex items-center gap-1.5">
          <div className="bg-gradient-to-br from-sky-500 to-sky-600 p-1 rounded-full shadow-sm text-white">
            <HiThumbUp className="w-2.5 h-2.5" />
          </div>
          <span className="font-medium">{likeCount} likes</span>
        </div>
        <div className="flex gap-4">
          <button onClick={handleToggleComments} className="hover:text-sky-600 transition font-medium">
            {commentsCount} comments
          </button>
          <button onClick={handleShare} className="hover:text-sky-600 transition font-medium">
            Share
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-2 py-2 flex items-center justify-between gap-2">
        <button
          onClick={handleLike}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${liked ? 'text-sky-600 dark:text-sky-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
        >
          {liked ? <HiThumbUp className="w-5 h-5" /> : <HiOutlineThumbUp className="w-5 h-5" />}
          Like
        </button>
        <button
          onClick={handleToggleComments}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-all duration-200"
        >
          <HiChatAlt className="w-5 h-5" />
          Comment
        </button>
        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-all duration-200"
        >
          <HiShare className="w-5 h-5" />
          Share
        </button>
      </div>

      {/* Comments Section */}
      {isMobile ? (
        <MobileCommentsSheet
          isOpen={showComments}
          onClose={() => setShowComments(false)}
          comments={comments}
          currentUser={currentUser}
          onReply={handleReply}
          onSubmit={handleCommentSubmit}
          replyingTo={replyingTo}
          cancelReply={cancelReply}
          submitting={submittingComment}
        />
      ) : (
        /* Desktop Inline Comments */
        showComments && (
          <div className="px-4 pb-4 pt-2 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
            {loadingComments ? (
              <div className="flex justify-center py-4">
                <div className="w-5 h-5 border-2 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="space-y-6 mb-6 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                {comments.map((comment, index) => (
                  <CommentItem
                    key={comment._id || index}
                    comment={comment}
                    onReply={handleReply}
                    currentUser={currentUser}
                  />
                ))}
                {comments.length === 0 && (
                  <p className="text-center text-sm text-gray-500 py-2">No comments yet. Be the first!</p>
                )}
              </div>
            )}

            <div className="flex gap-3 items-start pt-2 border-t border-gray-100">
              <Avatar
                src={currentUser?.profilePic}
                alt="You"
                size="sm"
                className="flex-shrink-0"
              />
              <div className="flex-1">
                {replyingTo && (
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1 ml-1">
                    <span>Replying to <span className="font-bold text-sky-600">@{replyingTo.username}</span></span>
                    <button onClick={cancelReply} className="hover:text-red-500">Cancel</button>
                  </div>
                )}
                <form onSubmit={handleCommentSubmit} className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={replyingTo ? "Write a reply..." : "Write a comment..."}
                    className={`w-full bg-gray-100 border-transparent focus:bg-white border focus:border-sky-500 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none transition-all ${replyingTo ? 'ring-2 ring-sky-100' : ''}`}
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim() || submittingComment}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-sky-600 hover:bg-sky-50 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <HiPaperAirplane size={16} className="rotate-90" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        )
      )}
    </article>
  );
}

PostCard.propTypes = {
  post: PropTypes.object.isRequired,
  currentUser: PropTypes.object,
  onDelete: PropTypes.func
};
