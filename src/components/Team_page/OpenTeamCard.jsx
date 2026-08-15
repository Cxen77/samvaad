import React from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase } from "lucide-react";

export default function OpenTeamCard({ team }) {
    const navigate = useNavigate();
    const openRoles = team.openRoles?.filter(r => r.isOpen) || [];
    const memberCount = team.members?.length || 0;

    return (
        <div
            className="border border-gray-100 dark:border-gray-800 rounded-xl p-4 hover:border-sky-200 dark:hover:border-sky-800 hover:bg-sky-50/30 dark:hover:bg-sky-900/10 transition-all group cursor-pointer bg-white dark:bg-gray-800/50"
            onClick={() => navigate(`/teams/${team._id}`)}
        >
            <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" title="Looking for members" />
                        <p className="text-base font-bold text-gray-900 dark:text-white truncate group-hover:text-sky-600 dark:group-hover:text-sky-400 transition">{team.name}</p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                        <Briefcase size={12} /> {team.category} • {memberCount} member{memberCount !== 1 ? "s" : ""}
                    </p>
                </div>
            </div>

            {openRoles.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                    {openRoles.slice(0, 3).map((role) => (
                        <span key={role._id} className="px-2.5 py-1 text-[10px] font-semibold rounded-full bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-800">
                            {role.title}
                        </span>
                    ))}
                    {openRoles.length > 3 && (
                        <span className="px-2.5 py-1 text-[10px] text-gray-500 dark:text-gray-400">+{openRoles.length - 3} more</span>
                    )}
                </div>
            )}

            {team.description && (
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-4 leading-relaxed">
                    {team.description}
                </p>
            )}

            <button
                onClick={e => { e.stopPropagation(); navigate(`/teams/${team._id}`); }}
                className="w-full text-sm font-semibold py-2 rounded-lg border border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400 hover:bg-sky-600 hover:text-white dark:hover:bg-sky-600 dark:hover:text-white transition flex items-center justify-center gap-1.5"
            >
                View & Apply →
            </button>
        </div>
    );
}
