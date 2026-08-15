import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ProfileHero from './ProfileHero';
import ProfileSkeleton from './ProfileSkeleton';
import AboutSection from './AboutSection';
import ProjectsSection from './ProjectsSection';
import { useFollow } from '../../hooks/useFollow';

import PostsSection from './PostsSection';
import AchievementsSection from './AchievementsSection';
import ProfileScore from './ProfileScore';
import EventsSection from './EventsSection';
import TeamsSection from './TeamsSection';
import PendingInvites from '../Team_page/PendingInvites';
import SuggestedConnections from './SuggestedConnections';
import api from '../../api/axios';
import InviteToTeamModal from './InviteToTeamModal';
import GithubImportModal from './GithubImportModal';
import GithubStatsCard from './GithubStatsCard';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { calculateProfileScore } from '../../utils/profileUtils';

const Profile = () => {
    const { username } = useParams();
    const { currentUser: firebaseUser } = useAuth();
    const queryClient = useQueryClient();

    // UI State
    const [activeTab, setActiveTab] = useState('overview');
    const [viewAsPublic, setViewAsPublic] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isGithubModalOpen, setIsGithubModalOpen] = useState(false);

    // Queries
    const {
        data: currentUser,
        isLoading: isCurrentUserLoading
    } = useQuery({
        queryKey: ['currentUser'],
        queryFn: async () => {
            const res = await api.get('/users/profile');
            return res.data;
        },
        retry: false,
        staleTime: 60000 // Cache for 1 minute
    });

    const {
        data: profileUser,
        isLoading: isProfileLoading,
        error: profileError
    } = useQuery({
        queryKey: ['profile', username || 'me'],
        queryFn: async () => {
            const endpoint = username ? `/users/${username}` : '/users/profile';
            const res = await api.get(endpoint);
            return res.data;
        },
        retry: false,
        staleTime: 60000 // Cache for 1 minute
    });

    // Determine ownership early so we conditionally fetch invites
    const isOwnProfile = profileUser && currentUser ? profileUser._id === currentUser._id : (!username);

    const {
        data: invitesData,
        isLoading: isInvitesLoading
    } = useQuery({
        queryKey: ['teamInvites'],
        queryFn: async () => {
            const res = await api.get('/teams/invites');
            return res.data.map(team => ({
                id: team._id,
                name: team.name,
                skill: team.category || 'Team Invite',
                img: team.createdBy?.profilePic || '',
                type: 'team'
            }));
        },
        enabled: isOwnProfile, // Only fetch if it's our own profile
        staleTime: 60000
    });

    // Fallback user logic 
    const user = profileError && firebaseUser && (!username || username === firebaseUser.email?.split('@')[0])
        ? {
            _id: firebaseUser.uid,
            name: firebaseUser.displayName,
            username: firebaseUser.email?.split('@')[0],
            email: firebaseUser.email,
            profilePic: firebaseUser.photoURL,
            followers: [],
            following: [],
            skills: [],
            bio: "Welcome to your profile!",
            profession: "Member",
            stats: { followers: 0, following: 0 },
            projects: [],
            teams: []
        }
        : profileUser;

    const isFollowing = user && currentUser && !isOwnProfile
        ? user.followers.includes(currentUser._id)
        : false;

    const invites = invitesData || [];

    const loading = isProfileLoading || isCurrentUserLoading || (isOwnProfile && isInvitesLoading);

    // Check for GitHub OAuth Success
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('github') === 'success') {
            toast.success("GitHub connected successfully!");
            window.history.replaceState({}, document.title, window.location.pathname);
            setIsGithubModalOpen(true);
        }
    }, []);

    const { follow, isPending: isFollowPending } = useFollow(user?._id);

    const handleFollow = async () => {
        if (!user || isOwnProfile) return;
        follow();
    };

    const handleAcceptInvite = async (teamId) => {
        try {
            await api.put(`/teams/${teamId}/accept`);
            toast.success("Joined team successfully!");
            setInvites(prev => prev.filter(i => i.id !== teamId));
            // Optionally refresh profile to show new team
        } catch (err) {
            console.error("Failed to accept invite", err);
            toast.error("Failed to accept invite");
        }
    };

    const handleDeclineInvite = async (teamId) => {
        try {
            await api.put(`/teams/${teamId}/decline`);
            toast.success("Invite declined");
            setInvites(prev => prev.filter(i => i.id !== teamId));
        } catch (err) {
            console.error("Failed to decline invite", err);
            toast.error("Failed to decline invite");
        }
    };

    const toggleViewMode = () => {
        setViewAsPublic(!viewAsPublic);
    };

    const handleProfileUpdate = (updatedData) => {
        setUser(prevUser => ({
            ...prevUser,
            ...updatedData,
            profilePic: updatedData.profilePic !== undefined ? updatedData.profilePic : prevUser.profilePic,
            bannerPic: updatedData.bannerPic !== undefined ? updatedData.bannerPic : prevUser.bannerPic
        }));
    };

    const handleGithubClick = () => {
        setIsGithubModalOpen(true);
    };

    const handleProjectImport = async (newProjects) => {
        try {
            const updatedProjects = [...(user.projects || []), ...newProjects];
            const { data } = await api.put('/users/profile', { projects: updatedProjects });
            setUser(prev => ({ ...prev, projects: updatedProjects }));
            toast.success(`Imported ${newProjects.length} projects!`);
        } catch (err) {
            console.error("Failed to save projects", err);
            toast.error("Failed to save imported projects");
        }
    };

    if (loading) {
        return <ProfileSkeleton />;
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900">User not found</h2>
                    <p className="text-gray-600 mt-2">Please log in or check the username.</p>
                </div>
            </div>
        );
    }

    const showOwnerControls = isOwnProfile && !viewAsPublic;

    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'stats', label: 'Stats' },
        { id: 'projects', label: 'Projects' },
        { id: 'teams', label: 'Teams' },
        { id: 'events', label: 'Events' },
        { id: 'posts', label: 'Posts' },
    ];

    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <ProfileHero
                    user={user}
                    isOwner={showOwnerControls}
                    isOwnProfile={isOwnProfile}
                    isFollowing={isFollowing}
                    onFollow={handleFollow}
                    onInvite={() => setIsInviteModalOpen(true)}
                    onToggleView={toggleViewMode}
                    onProfileUpdate={handleProfileUpdate}
                />

                {/* Tab Navigation */}
                <div className="sticky top-16 z-20 bg-gray-50 pt-6 pb-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 flex overflow-x-auto no-scrollbar">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 px-6 py-2.5 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === tab.id
                                    ? 'bg-sky-600 text-white shadow-md'
                                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Main Content Area */}
                    <div className={`lg:col-span-8 space-y-6 h-full flex flex-col ${activeTab === 'posts' ? 'max-h-[calc(100vh-12rem)] overflow-y-auto custom-scrollbar pr-2 pb-2' : ''}`}>
                        {activeTab === 'overview' && (
                            <>
                                {/* Mobile View (Stacked) */}
                                <div className="lg:hidden space-y-6 flex flex-col">
                                    <AboutSection
                                        user={user}
                                        isOwner={showOwnerControls}
                                        onProfileUpdate={handleProfileUpdate}
                                    />
                                    {showOwnerControls && (
                                        <PendingInvites
                                            invites={invites}
                                            onAccept={handleAcceptInvite}
                                            onDecline={handleDeclineInvite}
                                        />
                                    )}
                                    {showOwnerControls && (
                                        (() => {
                                            const { score } = calculateProfileScore(user);
                                            return score === 100 ? <SuggestedConnections /> : <ProfileScore user={user} />;
                                        })()
                                    )}
                                    {!showOwnerControls && <SuggestedConnections />}
                                    <AchievementsSection user={user} />
                                </div>

                                {/* Desktop View (Dynamic Height matching) - 
                                    Using mt-0 to override the parent's space-y-6 top margin
                                    since this is technically the second child but visually the only
                                    element rendered on desktop. */}
                                <div className="hidden lg:flex flex-1 flex-col !mt-0 [&>div]:flex-1">
                                    <AboutSection
                                        user={user}
                                        isOwner={showOwnerControls}
                                        onProfileUpdate={handleProfileUpdate}
                                        className="flex-1 flex flex-col"
                                    />
                                </div>
                            </>
                        )}
                        {activeTab === 'stats' && (
                            <div className="flex-1 flex flex-col !mt-0">
                                <GithubStatsCard userId={user._id} className="flex-1" />
                            </div>
                        )}
                        {activeTab === 'projects' && (
                            <div className="flex-1 flex flex-col !mt-0">
                                <ProjectsSection
                                    user={user}
                                    onImportClick={showOwnerControls ? handleGithubClick : undefined}
                                    className="flex-1"
                                />
                            </div>
                        )}
                        {activeTab === 'events' && (
                            <div className="flex-1 flex flex-col !mt-0">
                                <EventsSection className="flex-1" />
                            </div>
                        )}
                        {activeTab === 'teams' && (
                            <div className="flex-1 flex flex-col !mt-0">
                                <TeamsSection
                                    user={user}
                                    isOwner={showOwnerControls}
                                    viewerId={currentUser?._id}
                                    className="flex-1"
                                />
                            </div>
                        )}
                        {activeTab === 'posts' && (
                            <div className="flex-1 flex flex-col !mt-0">
                                <PostsSection isOwner={showOwnerControls} user={user} currentUser={currentUser} className="flex-1" />
                            </div>
                        )}
                    </div>

                    {/* Desktop Sidebar - Always visible on large screens, hidden on mobile */}
                    <div className="hidden lg:block lg:col-span-4 space-y-6 sticky top-24 self-start">
                        {showOwnerControls && (
                            <PendingInvites
                                invites={invites}
                                onAccept={handleAcceptInvite}
                                onDecline={handleDeclineInvite}
                            />
                        )}
                        {showOwnerControls && (
                            (() => {
                                const { score } = calculateProfileScore(user);
                                return score === 100 ? <SuggestedConnections /> : <ProfileScore user={user} />;
                            })()
                        )}
                        {!showOwnerControls && <SuggestedConnections />}

                        <AchievementsSection user={user} />
                    </div>
                </div>
            </div>

            <InviteToTeamModal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                userToInvite={user}
            />

            <GithubImportModal
                isOpen={isGithubModalOpen}
                onClose={() => setIsGithubModalOpen(false)}
                onImport={handleProjectImport}
            />
        </div>
    );
};

export default Profile;