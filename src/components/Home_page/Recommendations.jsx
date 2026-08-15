import React, { useState, useEffect } from "react";
import { HiUserAdd } from "react-icons/hi";
import { Link, useNavigate } from "react-router-dom";
import { Users, CalendarDays, MapPin, Briefcase, CheckCircle } from "lucide-react";
import api from "../../api/axios";
import Avatar from "../common/Avatar";
import OpenTeamCard from "../Team_page/OpenTeamCard";
import VerifiedBadge from "../common/VerifiedBadge";
import FollowButton from "../common/FollowButton";

// ──────────────────────────────────────────────
// Trending Events Card (unchanged)
// ──────────────────────────────────────────────
function TrendingEvents({ events = [], loading = false }) {
  const navigate = useNavigate();

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return {
      month: d.toLocaleString("en-US", { month: "short" }).toUpperCase(),
      day: d.getDate(),
    };
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <CalendarDays size={16} className="text-sky-600" />
          Trending Events
        </h3>
        <Link to="/events" className="text-xs text-sky-600 font-semibold hover:underline">
          See all
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-12 h-12 rounded-xl bg-gray-200 flex-shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3 bg-gray-200 rounded w-3/4" />
                <div className="h-2 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">No upcoming events.</p>
      ) : (
        <div className="space-y-3">
          {events.map((ev) => {
            const { month, day } = formatDate(ev.date || ev.startDate || ev.createdAt);
            const spotsLeft = ev.maxParticipants ? ev.maxParticipants - (ev.participants?.length ?? 0) : null;
            const isFull = spotsLeft !== null && spotsLeft <= 0;
            return (
              <div key={ev._id} className="flex items-start gap-3 group cursor-pointer" onClick={() => navigate(`/events`)}>
                <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center text-center ${isFull ? 'bg-gray-100' : 'bg-orange-50'}`}>
                  <span className={`text-[9px] font-bold uppercase tracking-wide ${isFull ? 'text-gray-400' : 'text-orange-500'}`}>{month}</span>
                  <span className={`text-lg font-bold leading-tight ${isFull ? 'text-gray-500' : 'text-orange-600'}`}>{day}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate group-hover:text-sky-600 transition">{ev.title}</p>
                  {ev.location && (
                    <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-0.5">
                      <MapPin size={10} /> {ev.location}
                    </p>
                  )}
                  {spotsLeft !== null && (
                    <p className={`text-xs font-semibold mt-1 ${isFull ? 'text-gray-400' : 'text-green-600'}`}>
                      {isFull ? "Full" : `${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left`}
                    </p>
                  )}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); navigate("/events"); }}
                  className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition ${isFull
                    ? "border-gray-200 text-gray-400 cursor-not-allowed"
                    : "border-sky-600 text-sky-600 hover:bg-sky-600 hover:text-white"
                    }`}
                >
                  {isFull ? "Full" : "Join"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


// Main Recommendations Component
// ──────────────────────────────────────────────
export default function Recommendations({ initialData }) {
  const [tab, setTab] = useState("people");
  const navigate = useNavigate();

  const people = initialData?.recommendedPeople || [];
  const openTeams = initialData?.openTeams || [];
  const events = initialData?.trendingEvents || [];
  const loading = !initialData;

  return (
    <aside className="space-y-4">
      {/* ── Trending Events ── */}
      <TrendingEvents events={events} loading={loading} />

      {/* ── Recommendations ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header + Tabs */}
        <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-sky-50 to-white">
          <h3 className="font-bold text-gray-900 mb-3">Recommendations</h3>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setTab("people")}
              className={`flex-1 text-sm py-1.5 rounded-md font-semibold transition-all ${tab === "people"
                ? "bg-white text-sky-600 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
                }`}
            >
              People
            </button>
            <button
              onClick={() => setTab("teams")}
              className={`flex-1 text-sm py-1.5 rounded-md font-semibold transition-all flex items-center justify-center gap-1.5 ${tab === "teams"
                ? "bg-white text-sky-600 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
                }`}
            >
              <Users size={14} />
              Open Teams
              {openTeams.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-sky-600 text-white text-[9px] font-bold flex items-center justify-center">
                  {openTeams.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* ── People Tab ── */}
          {tab === "people" && (
            <>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="w-10 h-10 bg-gray-200 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-3/4" />
                        <div className="h-2 bg-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : people.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No recommendations yet.</p>
              ) : (
                <div className="space-y-4">
                  {people.map((p) => (
                    <div key={p._id} className="flex items-center justify-between gap-3 group">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Link to={`/profile/${p.username}`}>
                          <Avatar
                            src={p.profilePic}
                            alt={p.name}
                            size="custom"
                            className="w-10 h-10 ring-2 ring-gray-50 flex-shrink-0 hover:opacity-90 transition"
                          />
                        </Link>
                        <div className="min-w-0 flex-1">
                          <Link to={`/profile/${p.username}`}>
                            <div className="flex items-center gap-1 text-sm">
                              <div className="font-bold text-gray-900 truncate group-hover:text-sky-600 transition">{p.name}</div>
                              <VerifiedBadge verified={p.collegeVerified} />
                            </div>
                          </Link>
                          <div className="text-xs text-gray-500 truncate">
                            {p.skills && p.skills.length > 0 ? p.skills[0].name || p.skills[0] : "Student"}
                          </div>
                          <div className="text-[10px] text-gray-400 mt-0.5">Suggested for you</div>
                        </div>
                      </div>
                      <FollowButton targetUser={p} variant="icon" />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Open Teams Tab ── */}
          {tab === "teams" && (
            <>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="border border-gray-100 rounded-xl p-3 animate-pulse">
                      <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />
                      <div className="h-2 bg-gray-200 rounded w-1/2 mb-3" />
                      <div className="h-7 bg-gray-200 rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : openTeams.length === 0 ? (
                <div className="text-center py-6">
                  <Users size={32} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No open teams right now.</p>
                  <button
                    onClick={() => navigate("/teams?tab=open")}
                    className="mt-2 text-xs text-sky-600 font-semibold hover:underline"
                  >
                    Browse open teams →
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {openTeams.map((team) => (
                    <OpenTeamCard key={team._id} team={team} />
                  ))}
                  <button
                    onClick={() => navigate("/teams?tab=open")}
                    className="w-full text-xs text-sky-600 font-semibold pt-2 hover:underline"
                  >
                    See More Open Teams →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </aside>
  );
}