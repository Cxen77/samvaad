import React from "react";
import CreatePost from "./CreatePost";

export default function FeedHeader({ user, feedType, setFeedType, onCreatePost }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-hidden transition-shadow hover:shadow-md">
      {/* Header Tabs - Segmented Control Style */}
      <div className="flex border-b border-gray-100">
        <button
          onClick={() => setFeedType("For You")}
          className={`flex-1 py-4 text-sm font-semibold transition-all duration-200 relative ${feedType === "For You"
            ? "text-sky-600"
            : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
        >
          For You
          {feedType === "For You" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-600 mx-auto w-16 rounded-t-full"></div>
          )}
        </button>
        <button
          onClick={() => setFeedType("Following")}
          className={`flex-1 py-4 text-sm font-semibold transition-all duration-200 relative ${feedType === "Following"
            ? "text-sky-600"
            : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
        >
          Following
          {feedType === "Following" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-600 mx-auto w-16 rounded-t-full"></div>
          )}
        </button>
      </div>

      {/* Reusable Create Post Component */}
      <CreatePost user={user} onPostCreated={onCreatePost} />
    </div>
  );
}