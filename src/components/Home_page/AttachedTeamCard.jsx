import React from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, Users, ChevronRight } from "lucide-react";

/**
 * AttachedTeamCard
 * A lightweight, read-only card rendered inside a PostCard when the post
 * has an attached open team. Uses only data from the post payload — no
 * extra fetches.
 *
 * @param {{ team: object }} props
 */
export default function AttachedTeamCard({ team }) {
    const navigate = useNavigate();

    if (!team) return null;

    const openRoles = (team.openRoles || []).slice(0, 3);
    const extraRoles = (team.openRoles || []).length - openRoles.length;

    return (
        <div className="mx-4 mb-3 rounded-xl border border-sky-100 dark:border-sky-900/50 bg-sky-50/40 dark:bg-sky-900/10 overflow-hidden">
            {/* Header bar */}
            <div className="px-3 py-1.5 bg-sky-600/10 dark:bg-sky-600/20 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wide">
                    Open Team
                </span>
            </div>

            {/* Body */}
            <div className="p-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-gray-900 dark:text-white truncate">
                            {team.name}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                                <Briefcase size={11} />
                                {team.category}
                            </span>
                            <span className="flex items-center gap-1">
                                <Users size={11} />
                                {team.membersCount || 0} members
                            </span>
                        </div>
                    </div>
                </div>

                {/* Open role chips */}
                {openRoles.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                        {openRoles.map((role) => (
                            <span
                                key={role._id}
                                className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-white dark:bg-gray-800 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-800"
                            >
                                {role.title}
                            </span>
                        ))}
                        {extraRoles > 0 && (
                            <span className="px-2 py-0.5 text-[10px] text-gray-400 dark:text-gray-500">
                                +{extraRoles} more
                            </span>
                        )}
                    </div>
                )}

                {/* CTA */}
                <button
                    onClick={() => navigate(`/teams/${team._id}`)}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-700 active:scale-95 transition-all"
                >
                    View &amp; Apply
                    <ChevronRight size={13} />
                </button>
            </div>
        </div>
    );
}
