import { FaSearch } from "react-icons/fa";

function SearchBar() {
  return (
    <div className="relative hidden sm:block">
      <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
      <input 
        type="text" 
        placeholder="Search..." 
        className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-xl bg-white
        focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent
        transition text-sm"
      />
    </div>
  );
}

export default SearchBar;
