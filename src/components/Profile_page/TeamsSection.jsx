import React, { useEffect, useState } from 'react';
import { Users, ArrowRight, Briefcase, Zap, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

const STATUS_COLORS = {
    active: 'bg-green-100 text-green-700',
    paused: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-gray-100 text-gray-500',
};

/**
 * TeamsSection
 *
 * Props:
 *  - user        : profile user object (has user._id and user.teams array of IDs)
 *  - isOwner     : boolean — true if viewing own profile (show pending join requests count)
 *  - viewerId    : MongoDB _id of the logged-in visitor (to show "Apply" button for non-members)
 */
const TeamsSection = ({ user, isOwner, viewerId, className = "" }) => {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?._id) return;
        setLoading(true);
        api.get(`/teams/user/${user._id}`)
            .then(({ data }) => setTeams(Array.isArray(data) ? data : []))
            .catch(() => setTeams([]))
            .finally(() => setLoading(false));
    }, [user?._id]);

    if (loading) {
        return (
            <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
                <div className="p-5 border-b border-gray-100">
                    <div className="h-5 bg-gray-200 rounded w-24 animate-pulse" />
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2].map(n => (
                        <div key={n} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col ${className}`}>
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-sky-600 rounded-full block" />
                        Teams
                    </h3>
                    <span className="bg-gray-100 text-gray-600 py-0.5 px-2.5 rounded-full text-xs font-bold border border-gray-200">
                        {teams.length}
                    </span>
                </div>
                {isOwner && (
                    <Link to="/teams" className="text-xs text-sky-600 font-semibold hover:underline">
                        Manage →
                    </Link>
                )}
            </div>

            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                {teams.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                        <Users size={32} className="mx-auto mb-2 opacity-40" />
                        <p className="text-sm">No teams yet.</p>
                        {isOwner && (
                            <Link to="/teams" className="mt-2 inline-block text-xs text-sky-600 font-semibold hover:underline">
                                Create or join one →
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {teams.map(team => {
                            const isPrivate = team.visibility === 'private';
                            const openRoles = team.openRoles?.filter(r => r.isOpen) || [];
                            const isTeamOwner = String(team.createdBy?._id || team.createdBy) === String(user._id);
                            const isMember = team.members?.some(
                                m => String(m._id || m) === String(viewerId)
                            );

                            return (
                                <div
                                    key={team._id}
                                    className="group p-5 rounded-xl border border-gray-200 hover:border-sky-200 hover:shadow-md transition-all duration-200 bg-white flex flex-col gap-3"
                                >
                                    {/* Top row */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                                <h4 className="text-base font-bold text-gray-900 truncate group-hover:text-sky-600 transition">
                                                    {team.name}
                                                </h4>
                                                {isPrivate && (
                                                    <Lock size={11} className="text-gray-400 flex-shrink-0" title="Private" />
                                                )}
                                                {team.teamStatus && team.teamStatus !== 'active' && (
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[team.teamStatus]}`}>
                                                        {team.teamStatus}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 font-medium">
                                                {team.category}
                                                {isTeamOwner ? ' · Owner' : ' · Member'}
                                            </p>
                                        </div>

                                        {team.isLookingForMembers && (
                                            <span className="flex-shrink-0 flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                                Hiring
                                            </span>
                                        )}
                                    </div>

                                    {/* Description */}
                                    {team.description && (
                                        <p className="text-xs text-gray-500 line-clamp-2">{team.description}</p>
                                    )}

                                    {/* currentFocus */}
                                    {team.currentFocus && (
                                        <div className="flex items-start gap-1.5 bg-sky-50 rounded-lg px-3 py-2">
                                            <Zap size={11} className="text-sky-500 flex-shrink-0 mt-0.5" />
                                            <p className="text-[11px] text-sky-700 font-medium line-clamp-1 italic">{team.currentFocus}</p>
                                        </div>
                                    )}

                                    {/* Open roles */}
                                    {openRoles.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {openRoles.slice(0, 2).map(role => (
                                                <span key={role._id} className="px-2 py-0.5 text-[10px] font-semibold bg-sky-50 text-sky-600 border border-sky-100 rounded-full flex items-center gap-1">
                                                    <Briefcase size={8} /> {role.title}
                                                </span>
                                            ))}
                                            {openRoles.length > 2 && (
                                                <span className="text-[10px] text-gray-400">+{openRoles.length - 2} more</span>
                                            )}
                                        </div>
                                    )}

                                    {/* Footer */}
                                    <div className="flex items-center justify-between mt-auto pt-1">
                                        <span className="flex items-center gap-1 text-xs text-gray-500">
                                            <Users size={12} />
                                            {Array.isArray(team.members) ? team.members.length : 0} member{team.members?.length !== 1 ? 's' : ''}
                                        </span>

                                        <div className="flex items-center gap-2">
                                            {/* Apply button for non-members on open public teams */}
                                            {!isMember && !isPrivate && team.isLookingForMembers && team.teamStatus === 'active' && viewerId && (
                                                <Link
                                                    to={`/teams/${team._id}`}
                                                    className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition"
                                                >
                                                    Apply
                                                </Link>
                                            )}
                                            <Link
                                                to={`/teams/${team._id}`}
                                                className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition"
                                            >
                                                View <ArrowRight size={11} />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeamsSection;
