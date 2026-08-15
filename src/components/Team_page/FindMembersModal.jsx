import React, { useState, useEffect } from "react";
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { FaTimes, FaSearch, FaUserPlus, FaCheck } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import Avatar from "../common/Avatar";
import toast from "react-hot-toast";

export default function FindMembersModal({ isOpen, onClose, teamId }) {
    const navigate = useNavigate();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [debouncedQuery, setDebouncedQuery] = useState(query);
    const [invitedUsers, setInvitedUsers] = useState(new Set());

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
        }, 500);

        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        if (debouncedQuery.trim()) {
            searchUsers(debouncedQuery);
        } else {
            setResults([]);
        }
    }, [debouncedQuery]);

    // Reset invited users when modal opens/closes or team changes
    useEffect(() => {
        if (isOpen) {
            setInvitedUsers(new Set());
            setQuery("");
            setResults([]);
        }
    }, [isOpen, teamId]);

    const searchUsers = async (searchTerm) => {
        setLoading(true);
        try {
            const { data } = await api.get(`/users/search?q=${searchTerm}`);
            setResults(data);
        } catch (err) {
            console.error("Failed to search users", err);
            toast.error("Failed to search users");
        } finally {
            setLoading(false);
        }
    };

    const handleUserClick = (username) => {
        if (!teamId) {
            onClose();
            navigate(`/profile/${username}`);
        }
    };

    const handleInvite = async (e, userId) => {
        e.stopPropagation();
        if (!teamId) return;

        try {
            await api.put(`/teams/${teamId}/invite`, { userId });
            setInvitedUsers(prev => new Set(prev).add(userId));
            toast.success("Invitation sent!");
        } catch (err) {
            console.error("Failed to invite user", err);
            toast.error(err.response?.data?.message || "Failed to invite user");
        }
    };

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-4 pointer-events-none">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity animate-in fade-in duration-200"
                onClick={onClose}
            />

            <div className="bg-white w-full sm:max-w-lg rounded-t-[2rem] sm:rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] pointer-events-auto relative animate-slide-up sm:animate-in sm:zoom-in-95 duration-200">
                {/* Drag Handle for Mobile */}
                <div className="sm:hidden w-full flex justify-center pt-3 pb-1" onClick={onClose}>
                    <div className="w-12 h-1.5 bg-gray-200 rounded-full cursor-pointer" />
                </div>

                <div className="flex justify-between items-center px-6 pt-2 pb-4 sm:p-5 border-b border-gray-100">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">
                            {teamId ? "Invite Members" : "Find Members"}
                        </h3>
                        <p className="text-sm text-gray-500">Search for talent to join your team</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition">
                        <FaTimes />
                    </button>
                </div>

                <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                    <div className="relative group">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-sky-500 transition-colors" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search by name or username..."
                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 outline-none transition bg-white"
                            autoFocus
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 custom-scrollbar bg-white">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400 space-y-2">
                            <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm font-medium">Searching...</span>
                        </div>
                    ) : results.length > 0 ? (
                        <div className="space-y-1">
                            {results.map((user) => {
                                const isInvited = invitedUsers.has(user._id);
                                return (
                                    <div
                                        key={user._id}
                                        className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition group cursor-pointer border border-transparent hover:border-gray-100"
                                        onClick={() => handleUserClick(user.username)}
                                    >
                                        <Avatar
                                            src={user.profilePic}
                                            alt={user.name}
                                            size="md"
                                            className="ring-2 ring-white shadow-sm"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-gray-900 truncate">{user.name}</h4>
                                            <p className="text-sm text-gray-500 truncate">@{user.username}</p>
                                            {user.skills && user.skills.length > 0 && (
                                                <p className="text-xs text-sky-600 font-medium mt-0.5 truncate bg-sky-50 inline-block px-1.5 py-0.5 rounded">
                                                    {user.skills[0]}
                                                    {user.skills.length > 1 && ` +${user.skills.length - 1}`}
                                                </p>
                                            )}
                                        </div>
                                        {teamId ? (
                                            <button
                                                className={`p-2.5 rounded-full transition shadow-sm ${isInvited
                                                    ? "bg-green-100 text-green-600 cursor-default"
                                                    : "bg-sky-50 text-sky-600 hover:bg-sky-600 hover:text-white"}`}
                                                onClick={(e) => !isInvited && handleInvite(e, user._id)}
                                                disabled={isInvited}
                                            >
                                                {isInvited ? <FaCheck /> : <FaUserPlus />}
                                            </button>
                                        ) : (
                                            <button
                                                className="p-2.5 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-full transition"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleUserClick(user.username);
                                                }}
                                            >
                                                <FaSearch />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : query.trim() ? (
                        <div className="text-center py-12 text-gray-500">
                            <p className="font-semibold text-gray-900">No users found</p>
                            <p className="text-sm">Try searching for a different name</p>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-400">
                            <FaSearch className="mx-auto text-3xl mb-3 text-gray-200" />
                            <p>Type to search for amazing talent</p>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}

FindMembersModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    teamId: PropTypes.string
};
