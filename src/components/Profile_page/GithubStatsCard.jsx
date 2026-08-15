import React, { useState, useEffect } from 'react';
import { FaGithub, FaStar, FaCodeBranch, FaBook, FaUsers } from 'react-icons/fa';
import api from '../../api/axios';
import Skeleton from '../common/Skeleton';

const GithubStatsCard = ({ userId, className = "" }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            if (!userId) return;
            try {
                const { data } = await api.get(`/users/${userId}/github/stats`);
                setStats(data);
            } catch (err) {
                // Determine if it's a 404 (not connected) or actual error
                if (err.response && err.response.status === 404) {
                    setError(false); // Just not connected, don't show error
                    setStats(null);
                } else {
                    console.error("Failed to fetch github stats", err);
                    setError(true);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [userId]);

    if (loading) {
        return (
            <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
                <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                    <div className="flex items-center gap-3 w-full">
                        <Skeleton variant="circular" className="h-8 w-8" />
                        <div className="flex-1">
                            <Skeleton variant="text" className="w-1/3 mb-1" />
                            <Skeleton variant="text" className="w-1/4 h-3" />
                        </div>
                    </div>
                </div>
                <div className="p-6 grid grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <Skeleton variant="text" className="w-1/2 mb-2" />
                            <Skeleton variant="text" className="w-1/4 h-6" />
                        </div>
                    ))}
                </div>
                <div className="px-6 pb-6 space-y-3">
                    <Skeleton variant="text" className="w-1/4" />
                    <Skeleton variant="text" />
                    <Skeleton variant="text" />
                </div>
            </div>
        );
    }

    if (!stats) return null; // Don't show if not connected

    return (
        <div className={`bg-white rounded-xl shadow-sm border border-gray-200 text-gray-900 overflow-hidden flex flex-col ${className}`}>
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <FaGithub className="text-2xl text-gray-800" />
                    <div>
                        <h3 className="font-bold text-lg leading-tight">GitHub Activity</h3>
                        <a href={stats.profileUrl} target="_blank" rel="noreferrer" className="text-xs text-gray-500 hover:text-sky-600 transition">
                            @{stats.username}
                        </a>
                    </div>
                </div>
            </div>

            <div className="p-6 grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 transition hover:shadow-md">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <FaStar className="text-yellow-500" /> Total Stars
                    </div>
                    <div className="text-xl font-bold text-gray-900">{stats.totalStars}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 transition hover:shadow-md">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <FaCodeBranch className="text-sky-500" /> Total Forks
                    </div>
                    <div className="text-xl font-bold text-gray-900">{stats.totalForks}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 transition hover:shadow-md">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <FaBook className="text-green-500" /> Repositories
                    </div>
                    <div className="text-xl font-bold text-gray-900">{stats.totalRepos}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 transition hover:shadow-md">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <FaUsers className="text-sky-500" /> Followers
                    </div>
                    <div className="text-xl font-bold text-gray-900">{stats.followers}</div>
                </div>
            </div>

            {stats.topLanguages.length > 0 && (
                <div className="px-6 pb-6 flex-1 overflow-y-auto custom-scrollbar">
                    <h4 className="text-sm font-bold text-gray-500 mb-3 sticky top-0 bg-white pt-2 z-10">Top Languages</h4>
                    <div className="space-y-3">
                        {stats.topLanguages?.map((lang, index) => (
                            <div key={index} className="space-y-1">
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>{lang.name}</span>
                                    <span>{lang.percent}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-sky-500 rounded-full"
                                        style={{ width: `${lang.percent}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GithubStatsCard;
