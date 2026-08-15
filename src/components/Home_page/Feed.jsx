import React, { useState, useEffect, useRef } from "react";
import FeedHeader from "./FeedHeader";
import PostCard from "./PostCard";
import api from "../../api/axios";
import { usePosts } from "../../hooks/usePosts";
import { useQueryClient } from "@tanstack/react-query";

export default function Feed({ user }) {
  const [feedType, setFeedType] = useState("For You");
  const { posts, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = usePosts(feedType);
  const queryClient = useQueryClient();

  const observerTarget = useRef(null);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  function handleCreatePost(newPost) {
    // Instantly update the cache (Optimistic-like)
    queryClient.setQueryData(['posts', feedType], (oldData) => {
      if (!oldData) return oldData;

      // Deep clone pages to avoid mutation issues
      const newPages = oldData.pages.map(page => ({ ...page }));

      // Prepend to the first page's posts array
      if (newPages.length > 0) {
        newPages[0].posts = [newPost, ...newPages[0].posts];
      }

      return {
        ...oldData,
        pages: newPages
      };
    });

    // Also invalidate to ensure eventual consistency (background refetch)
    queryClient.invalidateQueries(['posts']);
  }

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      await api.delete(`/posts/${postId}`);
      queryClient.invalidateQueries(['posts']);
    } catch (err) {
      console.error("Failed to delete post", err);
    }
  };

  return (
    <main className="flex flex-col items-center w-full">
      <div className="w-full">
        <FeedHeader
          user={user}
          feedType={feedType}
          setFeedType={setFeedType}
          onCreatePost={handleCreatePost}
        />

        {/* feed label */}
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">{feedType} Feed</h3>
            <span className="w-1 h-1 rounded-full bg-gray-400"></span>
            <p className="text-xs text-gray-500">{isLoading ? 'Updating...' : 'Ready'}</p>
          </div>
        </div>

        {/* posts */}
        <div className="space-y-5">
          {posts.map((p) => (
            <PostCard key={p.id || p._id} post={p} currentUser={user} onDelete={handleDeletePost} />
          ))}

          {(isLoading || isFetchingNextPage) && (
            <div className="text-center py-4 text-gray-500">
              <div className="inline-block w-6 h-6 border-2 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {!isLoading && posts.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                {feedType === "Following" ? (
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                )}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                {feedType === "Following" ? "No posts from friends yet" : "No posts yet"}
              </h3>
              <p className="text-gray-500 max-w-xs mx-auto mb-6">
                {feedType === "Following"
                  ? "You aren't following anyone yet, or they haven't posted anything. Explore 'For You' to find people!"
                  : "Be the first to share something with the community!"}
              </p>
              {feedType === "Following" && (
                <button
                  onClick={() => setFeedType("For You")}
                  className="text-sky-600 font-semibold hover:bg-sky-50 px-4 py-2 rounded-lg transition"
                >
                  Switch to For You
                </button>
              )}
            </div>
          )}

          {/* Observer target for infinite scroll */}
          <div ref={observerTarget} className="h-4" />
        </div>
      </div>
    </main>
  );
}
