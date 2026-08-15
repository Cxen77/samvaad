import React, { useState, useEffect } from 'react';
import { FaUserPlus } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Avatar from '../common/Avatar';
import FollowButton from '../common/FollowButton';

const SuggestedConnections = () => {
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSuggestions = async () => {
            try {
                const { data } = await api.get('/users/recommended');
                setSuggestions(data);
            } catch (error) {
                console.error("Failed to fetch suggestions", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSuggestions();
    }, []);

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden p-5">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">People You Might Know</h3>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3 animate-pulse">
                            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
                                <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-sky-600 rounded-full block"></span>
                    People You Might Know
                </h3>
            </div>

            <div className="p-4">
                <div className="space-y-4">
                    {suggestions.slice(0, 4).map((person) => (
                        <div key={person._id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Link to={`/profile/${person.username}`}>
                                    <Avatar
                                        src={person.profilePic}
                                        alt={person.name}
                                        size="custom"
                                        className="w-10 h-10 hover:opacity-90 transition shadow-sm"
                                    />
                                </Link>
                                <div>
                                    <Link to={`/profile/${person.username}`}>
                                        <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm hover:text-sky-600 dark:hover:text-sky-400 transition">{person.name}</h4>
                                    </Link>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {person.skills && person.skills.length > 0 ? person.skills[0].name || person.skills[0] : 'Student'}
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500">Suggested for you</p>
                                </div>
                            </div>
                            <FollowButton targetUser={person} variant="icon" />
                        </div>
                    ))}
                    {suggestions.length === 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No suggestions available.</p>
                    )}
                </div>
                <button className="w-full mt-4 py-2 text-sm font-semibold text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-lg transition border border-transparent hover:border-sky-100 dark:hover:border-sky-800/50">
                    View All Suggestions
                </button>
            </div>
        </div>
    );
};

export default SuggestedConnections;
