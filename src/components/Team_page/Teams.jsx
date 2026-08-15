import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import QuickActions from "./QuickActions";
import TeamCard from "./TeamCard";
import OpenTeamCard from "./OpenTeamCard";
import PendingInvites from "./PendingInvites";
import Recommended from "./Recommended";
import CreateTeamModal from "./CreateTeamModal";
import FindMembersModal from "./FindMembersModal";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { Users, Globe, ChevronDown } from "lucide-react";

function Teams() {
  const { currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeTab = searchParams.get("tab") || "my";

  // Data States
  const [teams, setTeams] = useState([]);
  const [invites, setInvites] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  // Open Teams States
  const [openTeams, setOpenTeams] = useState([]);
  const [openTeamsPage, setOpenTeamsPage] = useState(1);
  const [hasMoreOpenTeams, setHasMoreOpenTeams] = useState(false);

  // UI States
  const [loading, setLoading] = useState(true);
  const [loadingMoreOpen, setLoadingMoreOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isFindMembersOpen, setIsFindMembersOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState(null);

  useEffect(() => {
    fetchBaseData();
  }, []);

  // Fetch Open Teams whenever the tab becomes active or page changes
  useEffect(() => {
    if (activeTab === "open") {
      fetchOpenTeams(openTeamsPage, openTeamsPage === 1);
    }
  }, [activeTab, openTeamsPage]);

  const fetchBaseData = async () => {
    setLoading(true);
    try {
      const [teamsRes, invitesRes, recsRes] = await Promise.all([
        api.get("/teams"),
        api.get("/teams/invites"),
        api.get("/users/recommended")
      ]);

      // Format Teams
      const formattedTeams = teamsRes.data.map(team => ({
        id: team._id,
        teamName: team.name,
        type: team.visibility.charAt(0).toUpperCase() + team.visibility.slice(1),
        project: team.category,
        description: team.description,
        members: team.members.map(m => ({
          name: m.name,
          role: "Member",
          avatar: m.profilePic
        })),
        isAdmin: team.admins.some(admin => admin._id === currentUser?.uid) || team.createdBy === currentUser?.uid,
        isLookingForMembers: team.isLookingForMembers || false,
        teamStatus: team.teamStatus || 'active',
        currentFocus: team.currentFocus || '',
        openRoles: team.openRoles || [],
        memberRoles: team.memberRoles || [],
        createdBy: team.createdBy?._id || team.createdBy || ''
      }));
      setTeams(formattedTeams);

      // Format Invites
      const formattedInvites = invitesRes.data.map(team => ({
        id: team._id,
        name: team.name,
        skill: team.category,
        img: team.createdBy?.profilePic
      }));
      setInvites(formattedInvites);

      // Format Recommendations
      const formattedRecs = recsRes.data.map(user => ({
        id: user._id,
        name: user.name,
        username: user.username,
        skill: user.skills?.[0] || "Developer",
        img: user.profilePic,
        match: Math.floor(Math.random() * 20) + 80,
        color: "#3b82f6"
      }));
      setRecommendations(formattedRecs);

    } catch (err) {
      console.error("Failed to fetch base data", err);
      if (err.response && err.response.status !== 401) {
        toast.error("Failed to load teams data");
      }
    } finally {
      if (activeTab !== "open") setLoading(false);
    }
  };

  const fetchOpenTeams = async (page, isInitial = false) => {
    if (isInitial) setLoading(true);
    else setLoadingMoreOpen(true);

    try {
      const { data } = await api.get(`/teams/open?page=${page}&limit=10`);

      const rawOpenTeams = data.teams || [];

      if (isInitial) {
        setOpenTeams(rawOpenTeams);
      } else {
        setOpenTeams(prev => [...prev, ...rawOpenTeams]);
      }

      setHasMoreOpenTeams(data.currentPage < data.totalPages);
    } catch (err) {
      console.error("Failed to fetch open teams", err);
      toast.error("Failed to load open teams");
    } finally {
      setLoading(false);
      setLoadingMoreOpen(false);
    }
  };

  const handleTabChange = (newTab) => {
    setSearchParams({ tab: newTab });
  };

  const handleLoadMoreOpenTeams = () => {
    setOpenTeamsPage(prev => prev + 1);
  };

  const handleTeamCreated = () => {
    fetchBaseData();
    if (activeTab === "open") {
      setOpenTeamsPage(1);
      fetchOpenTeams(1, true);
    }
    toast.success("Team created successfully!");
  };

  const handleInviteClick = (teamId) => {
    setSelectedTeamId(teamId);
    setIsFindMembersOpen(true);
  };

  const handleAcceptInvite = async (teamId) => {
    try {
      await api.put(`/teams/${teamId}/accept`);
      toast.success("Invite accepted!");
      fetchBaseData();
    } catch (err) {
      toast.error("Failed to accept invite");
    }
  };

  const handleDeclineInvite = async (teamId) => {
    try {
      await api.put(`/teams/${teamId}/decline`);
      toast.success("Invite declined");
      fetchBaseData();
    } catch (err) {
      toast.error("Failed to decline invite");
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-[#0a0a0a] min-h-screen w-full transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Top Tab Switcher */}
        <div className="flex items-center justify-center mb-8">
          <div className="inline-flex items-center p-1 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-xl shadow-sm">
            <button
              onClick={() => handleTabChange("my")}
              className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === "my"
                ? "bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
            >
              <Users size={18} />
              My Teams
            </button>
            <button
              onClick={() => handleTabChange("open")}
              className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === "open"
                ? "bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
            >
              <Globe size={18} />
              Open Teams
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Section (Main Content) */}
          <div className={`lg:col-span-8 space-y-6 ${activeTab === "open" ? "lg:col-start-3" : ""}`}>
            {activeTab === "my" && (
              <QuickActions
                onCreateClick={() => setIsCreateModalOpen(true)}
                onFindMembersClick={() => {
                  setSelectedTeamId(null);
                  setIsFindMembersOpen(true);
                }}
              />
            )}

            {loading ? (
              <div className="space-y-4">
                {[1, 2].map(n => (
                  <div key={n} className="bg-white dark:bg-gray-800/50 rounded-xl h-64 shadow-sm animate-pulse border border-gray-100 dark:border-gray-800/50" />
                ))}
              </div>
            ) : activeTab === "my" ? (
              /* My Teams Rendering */
              teams.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800/30 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                  <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">No teams yet</p>
                  <p className="text-sm">Create a team to get started!</p>
                </div>
              ) : (
                teams.map(team => (
                  <TeamCard
                    key={`my-${team.id}`}
                    team={team}
                    onInviteClick={() => handleInviteClick(team.id)}
                    currentUserId={currentUser?.uid}
                  />
                ))
              )
            ) : (
              /* Open Teams Rendering */
              <>
                {openTeams.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800/30 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                    <Globe size={32} className="mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">No open teams found</p>
                    <p className="text-sm">Check back later or create your own team!</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {openTeams.map(team => (
                      <OpenTeamCard
                        key={`open-${team._id}`}
                        team={team}
                      />
                    ))}
                  </div>
                )}

                {hasMoreOpenTeams && (
                  <div className="flex justify-center pt-2">
                    <button
                      onClick={handleLoadMoreOpenTeams}
                      disabled={loadingMoreOpen}
                      className="flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition shadow-sm disabled:opacity-50"
                    >
                      {loadingMoreOpen ? 'Loading...' : 'Load More Teams'}
                      {!loadingMoreOpen && <ChevronDown size={16} />}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Section (Sidebars) */}
          {activeTab === "my" && (
            <div className="lg:col-span-4 space-y-6">
              <div className="sticky top-20 space-y-6">
                {invites.length > 0 && (
                  <PendingInvites
                    invites={invites}
                    onAccept={handleAcceptInvite}
                    onDecline={handleDeclineInvite}
                  />
                )}
                <Recommended people={recommendations} />
              </div>
            </div>
          )}

        </div>
      </div>

      <CreateTeamModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onTeamCreated={handleTeamCreated}
      />

      <FindMembersModal
        isOpen={isFindMembersOpen}
        onClose={() => setIsFindMembersOpen(false)}
        teamId={selectedTeamId}
      />
    </div>
  );
}

export default Teams;