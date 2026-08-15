import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Avatar from '../common/Avatar';
import VerifiedBadge from '../common/VerifiedBadge';
import {
    Edit3,
    Share2,
    MapPin,
    Briefcase,
    Mail,
    UserPlus,
    Eye,
    Users,
    FolderGit,
    FileText,
    Check,
    Calendar,
    Link as LinkIcon,
    Github,
    Linkedin,
    Twitter,
    Instagram,
    Globe
} from 'lucide-react';
import ImageUpload from './ImageUpload';
import ProfileEditModal from './ProfileEditModal';
import FollowButton from '../common/FollowButton';

// ─────────────────────────────────────────────────────────────────────────────

const ProfileHero = ({ user, isOwner, isOwnProfile, isFollowing, onFollow, onInvite, onToggleView, onProfileUpdate }) => {
    const navigate = useNavigate();
    const [showEditModal, setShowEditModal] = useState(false);

    const handleMessage = async () => {
        try {
            const { data } = await api.post(`/chat/direct/${user._id}`);
            navigate(`/chat/${data._id}`);
        } catch (error) {
            console.error("Error accessing chat", error);
            navigate('/chat');
        }
    };

    const handleProfileUpdate = (updatedData) => {
        onProfileUpdate(updatedData);
        setShowEditModal(false);
    };

    const handleImageUpload = (data) => {
        onProfileUpdate(data);
    };

    const handleShare = async () => {
        const shareData = {
            title: `${user.name}'s Profile`,
            text: `Check out ${user.name}'s profile on Synapse!`,
            url: window.location.href
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(window.location.href);
                // toast.success('Profile link copied!'); 
                alert('Profile link copied to clipboard!');
            }
        } catch (err) {
            console.error('Error sharing:', err);
        }
    };

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    if (!user) return null;

    return (
        <div className="bg-white shadow-sm border border-gray-200 rounded-2xl overflow-hidden relative group">
            {/* Cover Banner */}
            <div className="h-48 md:h-80 relative bg-gray-900">
                {user.bannerPic ? (
                    <img
                        src={user.bannerPic.startsWith('/uploads')
                            ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${user.bannerPic}`
                            : user.bannerPic}
                        alt="Cover"
                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                    />
                ) : (
                    <div className="w-full h-full bg-sky-600 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-sky-600 to-sky-400 opacity-90"></div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-sky-400/20 rounded-full -ml-24 -mb-24 blur-2xl"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent shadow-inner"></div>
                    </div>
                )}

                {/* Edit Banner Button - Only visible to owner in edit mode */}
                {isOwner && (
                    <ImageUpload
                        type="banner"
                        currentImage={user.bannerPic}
                        onUploadSuccess={handleImageUpload}
                    />
                )}

                {/* Social Links on Banner Bottom Right */}
                {user.socials && Object.values(user.socials).some(link => link) && (
                    <div className={`absolute bottom-4 right-4 flex flex-col-reverse md:flex-row gap-2 z-10 ${isOwner ? 'md:mr-16' : ''}`}>
                        {user.socials.github && (
                            <a href={user.socials.github} target="_blank" rel="noopener noreferrer" className="bg-black/40 hover:bg-black/60 backdrop-blur-md p-2.5 rounded-full text-white transition-all shadow-md hover:scale-110" title="GitHub">
                                <Github className="w-5 h-5" />
                            </a>
                        )}
                        {user.socials.linkedin && (
                            <a href={user.socials.linkedin} target="_blank" rel="noopener noreferrer" className="bg-sky-700/60 hover:bg-sky-700 backdrop-blur-md p-2.5 rounded-full text-white transition-all shadow-md hover:scale-110" title="LinkedIn">
                                <Linkedin className="w-5 h-5" />
                            </a>
                        )}
                        {user.socials.twitter && (
                            <a href={user.socials.twitter} target="_blank" rel="noopener noreferrer" className="bg-sky-500/60 hover:bg-sky-500 backdrop-blur-md p-2.5 rounded-full text-white transition-all shadow-md hover:scale-110" title="Twitter">
                                <Twitter className="w-5 h-5" />
                            </a>
                        )}
                        {user.socials.instagram && (
                            <a href={user.socials.instagram} target="_blank" rel="noopener noreferrer" className="bg-pink-600/60 hover:bg-pink-600 backdrop-blur-md p-2.5 rounded-full text-white transition-all shadow-md hover:scale-110" title="Instagram">
                                <Instagram className="w-5 h-5" />
                            </a>
                        )}
                        {user.socials.portfolio && (
                            <a href={user.socials.portfolio} target="_blank" rel="noopener noreferrer" className="bg-emerald-600/60 hover:bg-emerald-600 backdrop-blur-md p-2.5 rounded-full text-white transition-all shadow-md hover:scale-110" title="Portfolio">
                                <Globe className="w-5 h-5" />
                            </a>
                        )}
                    </div>
                )}
            </div>

            {/* Profile Content */}
            <div className="px-6 md:px-10 pb-8">
                <div className="flex flex-col md:flex-row gap-6">

                    {/* Left: Avatar & Personal Info */}
                    <div className="flex-shrink-0 flex flex-col items-center md:items-start -mt-20 md:-mt-24 relative z-10">
                        <div className="relative">
                            <Avatar
                                src={user.profilePic}
                                alt={user.name}
                                className="w-32 h-32 md:w-48 md:h-48 rounded-full object-cover"
                            />
                            {isOwner && (
                                <div className="absolute bottom-2 right-2">
                                    <ImageUpload
                                        type="profile"
                                        currentImage={user.profilePic}
                                        onUploadSuccess={handleImageUpload}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Name & Title (Mobile Only Centered, Desktop Left) */}
                        <div className="mt-4 text-center md:text-left md:hidden">
                            <div className="flex items-center justify-center md:justify-start gap-1.5 text-2xl">
                                <h1 className="font-bold text-gray-900 leading-tight">{user.name}</h1>
                                <VerifiedBadge verified={user.collegeVerified} />
                            </div>
                            <p className="text-gray-500 font-medium">@{user.username}</p>
                        </div>
                    </div>

                    {/* Right: Info, Bio, Actions (Desktop Layout) */}
                    <div className="flex-1 pt-4 md:pt-6 min-w-0">

                        {/* Header Row: Name & Actions */}
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">

                            {/* Desktop Name */}
                            <div className="hidden md:block">
                                <div className="flex items-center gap-3 mb-1 text-3xl">
                                    <h1 className="font-extrabold text-gray-900 tracking-tight">{user.name}</h1>
                                    <VerifiedBadge verified={user.collegeVerified} />
                                </div>
                                <p className="text-lg text-gray-500 font-medium">@{user.username}</p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-between gap-2 w-full md:w-auto">
                                {isOwnProfile ? (
                                    isOwner ? (
                                        <div className="flex gap-2 w-full md:w-auto">
                                            <button onClick={onToggleView} className="flex-1 md:flex-none btn-secondary flex items-center justify-center gap-2 px-3 md:px-5 py-2.5 rounded-xl font-bold text-[13px] md:text-sm bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
                                                <Eye className="w-4 h-4" />
                                                <span className="truncate">Public View</span>
                                            </button>
                                            <button onClick={() => setShowEditModal(true)} className="flex-1 md:flex-none btn-secondary flex items-center justify-center gap-2 px-3 md:px-6 py-2.5 rounded-xl font-bold text-[13px] md:text-sm bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
                                                <Edit3 className="w-4 h-4" />
                                                <span className="truncate">Edit Profile</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <button onClick={onToggleView} className="flex-1 md:flex-none btn-secondary flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all">
                                            <Edit3 className="w-4 h-4" />
                                            Admin View
                                        </button>
                                    )
                                ) : (
                                    <div className="flex gap-1.5 md:gap-3 w-full md:w-auto">
                                        <FollowButton targetUser={user} variant="button" />
                                        <button onClick={handleMessage} className="flex-1 md:flex-none flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-5 py-2.5 rounded-xl font-bold text-[13px] md:text-sm bg-white border border-gray-200 text-gray-700 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200 transition-all shadow-sm">
                                            <Mail className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                            <span className="truncate">Message</span>
                                        </button>
                                        <button onClick={onInvite} className="flex-1 md:flex-none flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-5 py-2.5 rounded-xl font-bold text-[13px] md:text-sm bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all shadow-sm">
                                            <UserPlus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                            <span className="truncate">Invite</span>
                                        </button>
                                        <button onClick={handleShare} className="flex-shrink-0 p-2.5 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-all shadow-sm">
                                            <Share2 className="w-5 h-5 md:w-5 md:h-5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bio & Details Grid */}
                        <div className="grid grid-cols-1 gap-6 mb-8">
                            <div className="text-gray-600 text-base leading-relaxed max-w-4xl">
                                {user.bio || "No bio available."}
                            </div>

                            <div className="flex flex-wrap lg:flex-nowrap gap-2 md:gap-4 text-xs md:text-sm font-medium text-gray-500">
                                {user.course && (
                                    <div className="flex items-center gap-1.5 md:gap-2 bg-gray-50 px-2 md:px-3 py-1 md:py-1.5 rounded-lg border border-gray-100 whitespace-nowrap">
                                        <Briefcase className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                        {user.course}
                                    </div>
                                )}
                                <div className="flex items-center gap-1.5 md:gap-2 bg-gray-50 px-2 md:px-3 py-1 md:py-1.5 rounded-lg border border-gray-100 whitespace-nowrap">
                                    <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                    {user.location || "Add Location"}
                                </div>
                                <div className="flex items-center gap-1.5 md:gap-2 bg-gray-50 px-2 md:px-3 py-1 md:py-1.5 rounded-lg border border-gray-100 whitespace-nowrap">
                                    <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                    Joined {new Date().getFullYear()}
                                </div>
                            </div>
                        </div>

                        {/* Stats Bar (Unified) */}
                        <div className="flex items-center justify-around sm:justify-start sm:gap-12 py-4 border-t border-b border-gray-100 md:border-0 md:py-4">
                            {[
                                { label: 'Followers', value: user.followers?.length || 0, icon: Users },
                                { label: 'Following', value: user.following?.length || 0, icon: UserPlus },
                                { label: 'Teams', value: user.teams?.length || 0, icon: Briefcase, action: () => scrollToSection('teams-section') },
                                { label: 'Projects', value: user.projects?.length || 0, icon: FolderGit, action: () => scrollToSection('projects-section') }
                            ].map((stat, i) => (
                                <div
                                    key={i}
                                    onClick={stat.action}
                                    className={`flex flex-col items-center md:flex-row md:gap-3 transition-all ${stat.action ? 'cursor-pointer hover:opacity-75 relative group' : ''}`}
                                >
                                    <div className="hidden md:flex items-center justify-center p-1 text-gray-500 transition-colors">
                                        <stat.icon className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                                    </div>
                                    <div className="text-center md:text-left">
                                        <div className="text-lg sm:text-xl font-bold text-gray-900 leading-none">{stat.value}</div>
                                        <div className="text-xs text-gray-500 font-medium mt-1">{stat.label}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {showEditModal && (
                <ProfileEditModal
                    user={user}
                    onClose={() => setShowEditModal(false)}
                    onUpdate={handleProfileUpdate}
                />
            )}
        </div>
    );
};

ProfileHero.propTypes = {
    user: PropTypes.shape({
        _id: PropTypes.string,
        name: PropTypes.string,
        username: PropTypes.string,
        profilePic: PropTypes.string,
        bannerPic: PropTypes.string,
        bio: PropTypes.string,
        location: PropTypes.string,
        course: PropTypes.string,
        followers: PropTypes.array,
        following: PropTypes.array,
        teams: PropTypes.array,
        projects: PropTypes.array
    }),
    isOwner: PropTypes.bool,
    isOwnProfile: PropTypes.bool,
    isFollowing: PropTypes.bool,
    onFollow: PropTypes.func,
    onInvite: PropTypes.func,
    onToggleView: PropTypes.func,
    onProfileUpdate: PropTypes.func
};

export default ProfileHero;
