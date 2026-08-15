import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import Avatar from '../common/Avatar';
import { FaCheckCircle, FaFire, FaUsers } from 'react-icons/fa';

const TeamList = ({ eventId }) => {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const { data } = await api.get(`/events/${eventId}/teams`);
                setTeams(data);
            } catch (error) {
                console.error("Failed to fetch teams", error);
            } finally {
                setLoading(false);
            }
        };

        if (eventId) {
            fetchTeams();
        }
    }, [eventId]);

    if (loading) return (
        <div className="py-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
    );

    if (teams.length === 0) {
        return (
            <div className="mt-8 p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <FaUsers className="text-gray-300 text-2xl" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No teams yet</h3>
                <p className="text-gray-500 mt-1">Be the first to form one!</p>
            </div>
        );
    }

    return (
        <div className="mt-12">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="bg-sky-100 p-1.5 rounded-lg text-sky-600">
                    <FaUsers size={16} />
                </span>
                Event Teams
                <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full ml-auto md:ml-2">
                    {teams.length}
                </span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {teams.map((team) => (
                    <div key={team._id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                        {/* Header */}
                        <div className="p-5 border-b border-gray-50 bg-gradient-to-r from-gray-50 to-white">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-lg text-gray-800 line-clamp-1 group-hover:text-sky-600 transition-colors">
                                    {team.name}
                                </h4>
                                {team.isAutoCreated && (
                                    <span className="shrink-0 bg-gradient-to-r from-violet-500 to-sky-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                        <FaCheckCircle className="text-[9px]" /> AUTO
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-2 min-h-[2.5em]">
                                {team.description || "No description provided."}
                            </p>
                        </div>

                        {/* Members */}
                        <div className="p-4 bg-white">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Members</span>
                                <span className="text-xs text-gray-400">{team.members.length} / 5</span>
                            </div>

                            <div className="space-y-3">
                                {team.members.slice(0, 3).map((member) => (
                                    <div key={member._id} className="flex items-center gap-3">
                                        <Avatar
                                            src={member.profilePic}
                                            alt={member.name}
                                            size="sm"
                                            className="ring-1 ring-gray-100"
                                        />
                                        <div className="overflow-hidden">
                                            <p className="text-sm font-medium text-gray-700 truncate">{member.name}</p>
                                            <p className="text-[10px] text-gray-400 truncate">
                                                {member.skills?.[0] || member.college || "Member"}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {team.members.length > 3 && (
                                    <div className="text-xs text-center py-1 text-gray-400 bg-gray-50 rounded-lg">
                                        + {team.members.length - 3} more members
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Action (Optional) */}
                        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                            <div className="flex -space-x-1.5 overflow-hidden">
                                {/* Tiny Avatars */}
                                {team.members.map((m, i) => (
                                    <div key={i} className="w-5 h-5 rounded-full ring-2 ring-white bg-gray-200" style={{ backgroundImage: `url(${m.profilePic || ''})`, backgroundSize: 'cover' }} />
                                ))}
                            </div>
                            <button className="text-xs font-semibold text-sky-600 hover:text-sky-800 transition-colors">
                                View Team
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TeamList;
