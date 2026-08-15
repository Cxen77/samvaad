import React from "react";
import { FaSearch } from "react-icons/fa";

function SearchBar() {
  return (
    <div className="mb-8">
      <div className="relative max-w-2xl">
        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search for new members or teams..."
          className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl bg-white focus:outline-none 
          focus:ring-2 focus:ring-sky-500 focus:border-transparent transition shadow-sm"
        />
      </div>
    </div>
  );
}

export default SearchBar;
