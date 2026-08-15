import React from "react";
import { FaUsers, FaUserPlus } from "react-icons/fa";

function QuickActions({ onCreateClick, onFindMembersClick }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <button
        onClick={onFindMembersClick}
        className="flex items-center gap-4 p-5 bg-white rounded-xl hover:shadow-md transition border-2 border-sky-100 hover:border-sky-300 group"
      >
        <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center group-hover:bg-sky-200 transition">
          <FaUsers className="w-6 h-6 text-sky-600" />
        </div>
        <div className="text-left">
          <h4 className="font-bold text-gray-900">Find Members</h4>
          <p className="text-sm text-gray-600">Search for new talent</p>
        </div>
      </button>

      <button
        onClick={onCreateClick}
        className="flex items-center gap-4 p-5 bg-white rounded-xl hover:shadow-md transition border-2 border-sky-100 hover:border-sky-300 group"
      >
        <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center group-hover:bg-sky-200 transition">
          <FaUserPlus className="w-6 h-6 text-sky-600" />
        </div>
        <div className="text-left">
          <h4 className="font-bold text-gray-900">Create Team</h4>
          <p className="text-sm text-gray-600">Start a new project</p>
        </div>
      </button>
    </div>
  );
}

export default QuickActions;
