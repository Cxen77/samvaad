import { useState, useEffect } from "react";
import { FaTimes, FaSearch, FaUsers } from "react-icons/fa";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const GroupChatModal = ({ isOpen, onClose, onGroupCreated }) => {
    const { currentUser } = useAuth();
    const [groupName, setGroupName] = useState("");
    const [search, setSearch] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    // Debounced search
    useEffect(() => {
        const fetchUsers = async () => {
            if (!search.trim()) {
                setSearchResults([]);
                return;
            }
            try {
                // Search users by name or email
                const { data } = await api.get(`/users/search?q=${search}`);
                // Filter out already selected users and self
                const filtered = data.filter(u =>
                    u._id !== currentUser.uid && // Assuming firebase uid is mapped or finding by _id
                    !selectedUsers.find(sel => sel._id === u._id)
                );
                setSearchResults(filtered);
            } catch (error) {
                console.error("Failed to search users", error);
            }
        };

        const timeout = setTimeout(fetchUsers, 500);
        return () => clearTimeout(timeout);
    }, [search, selectedUsers, currentUser]);

    const handleSelectUser = (user) => {
        if (!selectedUsers.find(u => u._id === user._id)) {
            setSelectedUsers([...selectedUsers, user]);
            setSearchResults(searchResults.filter(u => u._id !== user._id));
        }
        setSearch("");
    };

    const handleRemoveUser = (userId) => {
        setSelectedUsers(selectedUsers.filter(u => u._id !== userId));
    };

    const handleSubmit = async () => {
        if (!groupName || selectedUsers.length < 2) {
            toast.error("Please provide a group name and at least 2 members");
            return;
        }

        setLoading(true);
        try {
            await api.post("/chat/group", {
                name: groupName,
                users: JSON.stringify(selectedUsers.map(u => u._id))
            });
            toast.success("Group created successfully!");
            onGroupCreated();
            onClose();
        } catch (error) {
            toast.error("Failed to create group");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fadeInScale">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-500">
                            <FaUsers size={14} />
                        </span>
                        Create Group
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                        <FaTimes />
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto space-y-6">
                    {/* Group Name */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Group Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Project Team, Weekend Squad"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition-all placeholder:text-gray-400"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                        />
                    </div>

                    {/* Users Search */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Add Members</label>
                        <div className="relative">
                            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search friends..."
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition-all placeholder:text-gray-400"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        {/* Search Results Dropdown */}
                        {searchResults.length > 0 && (
                            <div className="mt-2 bg-white border border-gray-100 rounded-xl shadow-lg max-h-48 overflow-y-auto z-10">
                                {searchResults.map(user => (
                                    <div
                                        key={user._id}
                                        onClick={() => handleSelectUser(user)}
                                        className="p-3 flex items-center gap-3 hover:bg-white cursor-pointer transition-colors"
                                    >
                                        <img src={user.profilePic || "https://via.placeholder.com/150"} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm text-gray-900 truncate">{user.name}</p>
                                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Selected Users */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Selected ({selectedUsers.length})</label>
                        <div className="flex flex-wrap gap-2">
                            {selectedUsers.map(u => (
                                <div key={u._id} className="flex items-center gap-1 bg-sky-50 text-sky-700 px-3 py-1.5 rounded-full text-sm font-medium border border-sky-100">
                                    <span className="max-w-[100px] truncate">{u.name}</span>
                                    <button onClick={() => handleRemoveUser(u._id)} className="hover:text-sky-900 ml-1">
                                        <FaTimes size={12} />
                                    </button>
                                </div>
                            ))}
                            {selectedUsers.length === 0 && (
                                <p className="text-sm text-gray-400 italic">No members selected</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-white">
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !groupName || selectedUsers.length < 2}
                        className="w-full bg-gray-900 hover:bg-black text-white py-3.5 rounded-xl font-bold shadow-lg shadow-gray-200 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none"
                    >
                        {loading ? "Creating Group..." : "Create Group Chat"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GroupChatModal;
