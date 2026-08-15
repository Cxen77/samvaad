import { FaSearch } from "react-icons/fa";

function ChatSearch({ search, setSearch }) {
  return (
    <div className="p-4 border-b border-gray-200 flex-shrink-0">
      <div className="relative">
        <FaSearch
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          size={16}
        />
        <input
          type="text"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
        />
      </div>
    </div>
  );
}

export default ChatSearch;
