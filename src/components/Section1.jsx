import React from "react";
import { FaImage, FaVideo, FaSmile } from "react-icons/fa";
import { useState } from "react";

const Section1 = () => {
  const [feedType, setFeedType] = useState("For You");

  return (
    <div className="min-h-screen w-full bg-gray-100 flex gap-6 px-6 pt-20">
      {/* --- Left Profile Card --- */}
      <div className="w-1/5 min-w-[250px] bg-white rounded-lg shadow-md flex flex-col items-center py-6">
        <img
          src="https://i.pravatar.cc/150?img=3"
          alt="Profile"
          className="w-24 h-24 rounded-full object-cover border-4 border-sky-500"
        />
        <div className="mt-3 text-center">
          <h2 className="text-xl font-semibold text-gray-800">Cxen</h2>
          <p className="text-gray-600 text-sm">Computer Science Student</p>
        </div>
      </div>

      {/* --- Main Feed Area --- */}
      <div className="flex-1 flex flex-col items-center">
        {/* Feed Switch Buttons */}
        <div className="flex justify-center mb-4 space-x-3">
          <button
            onClick={() => setFeedType("For You")}
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              feedType === "For You"
                ? "bg-sky-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            For You
          </button>
          <button
            onClick={() => setFeedType("Following")}
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              feedType === "Following"
                ? "bg-sky-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Following
          </button>
        </div>

        {/* Post Creation Box */}
        <div className="bg-white w-full max-w-2xl rounded-lg shadow-md p-4">
          <div className="flex gap-4 items-center border-b pb-3">
            <img
              src="https://i.pravatar.cc/150?img=3"
              alt="User"
              className="w-12 h-12 rounded-full object-cover"
            />
            <input
              type="text"
              placeholder="Write a post..."
              className="flex-1 bg-gray-100 rounded-full px-4 py-2 outline-none"
            />
          </div>

          {/* Post Actions */}
          <div className="flex justify-around mt-3 text-gray-600">
            <button className="flex items-center gap-2 hover:text-sky-500">
              <FaImage /> <span>Photo</span>
            </button>
            <button className="flex items-center gap-2 hover:text-green-500">
              <FaVideo /> <span>Video</span>
            </button>
            <button className="flex items-center gap-2 hover:text-yellow-500">
              <FaSmile /> <span>Feeling</span>
            </button>
          </div>
        </div>

        {/* Feed Section */}
        <div className="mt-6 text-center text-gray-700 text-lg">
          <p>Showing: <span className="font-semibold">{feedType} Feed</span></p>
          {/* Add your feed posts below here later */}
        </div>
      </div>
    </div>
  );
};

export default Section1;
