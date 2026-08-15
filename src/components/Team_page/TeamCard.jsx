import React from "react";
import PropTypes from "prop-types";
import { FaUserPlus, FaCog } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { Briefcase, Users, Zap } from "lucide-react";
import MemberCard from "./MemberCard";

const STATUS_STYLES = {
  active: "bg-green-100 text-green-700",
  paused: "bg-yellow-100 text-yellow-700",
  completed: "bg-gray-100 text-gray-500",
};

function TeamCard({ team, onInviteClick, currentUserId }) {
  const navigate = useNavigate();

  // Determine if current user can manage (owner or co-lead)
  const canManage =
    currentUserId &&
    (team.createdBy === currentUserId ||
      team.memberRoles?.some(
        (mr) => mr.userId === currentUserId && mr.role === "co-lead"
      ));

  const openRoleCount = team.openRoles?.filter((r) => r.isOpen).length || 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-50 to-white p-5 sm:p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Link to={`/teams/${team.id}`} className="hover:underline truncate max-w-full">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{team.teamName}</h2>
              </Link>
              <span className="px-2.5 py-0.5 bg-sky-100 text-sky-700 rounded-full text-xs font-bold whitespace-nowrap">
                {team.type}
              </span>
              {/* Team Status Badge */}
              {team.teamStatus && team.teamStatus !== "active" && (
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap capitalize ${STATUS_STYLES[team.teamStatus] || STATUS_STYLES.active}`}>
                  {team.teamStatus}
                </span>
              )}
              {/* Looking for members badge */}
              {team.isLookingForMembers && (
                <span className="flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold whitespace-nowrap">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  Hiring
                </span>
              )}
            </div>

            <p className="text-gray-600 flex items-center gap-2 text-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
              <span className="truncate">{team.project}</span>
            </p>

            {/* currentFocus */}
            {team.currentFocus && (
              <p className="mt-1.5 text-xs text-gray-500 flex items-start gap-1.5 italic">
                <Zap size={11} className="text-sky-400 flex-shrink-0 mt-0.5" />
                {team.currentFocus}
              </p>
            )}
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={onInviteClick}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-sky-600 hover:bg-sky-50 rounded-lg transition border border-sky-200 active:scale-95"
            >
              <FaUserPlus /> Invite
            </button>
            {canManage && (
              <button
                onClick={() => navigate(`/teams/${team.id}/manage`)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-lg transition border border-gray-200 active:scale-95"
              >
                <FaCog /> Manage
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Users size={13} />
            {team.members.length} members
          </span>
          {openRoleCount > 0 && (
            <span className="flex items-center gap-1 text-sky-600 font-semibold">
              <Briefcase size={13} />
              {openRoleCount} open role{openRoleCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Members */}
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {team.members.map((member, index) => (
            <MemberCard key={index} member={member} />
          ))}
        </div>
      </div>
    </div>
  );
}

TeamCard.propTypes = {
  team: PropTypes.shape({
    id: PropTypes.string.isRequired,
    teamName: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    project: PropTypes.string,
    description: PropTypes.string,
    members: PropTypes.arrayOf(PropTypes.object).isRequired,
    isAdmin: PropTypes.bool,
    isLookingForMembers: PropTypes.bool,
    teamStatus: PropTypes.string,
    currentFocus: PropTypes.string,
    openRoles: PropTypes.array,
    memberRoles: PropTypes.array,
    createdBy: PropTypes.string,
  }).isRequired,
  onInviteClick: PropTypes.func.isRequired,
  currentUserId: PropTypes.string,
};

export default TeamCard;
