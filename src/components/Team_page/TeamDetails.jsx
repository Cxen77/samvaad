import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    FaArrowLeft, FaUsers, FaProjectDiagram, FaUserShield, FaCog,
    FaCheckCircle, FaTimesCircle, FaClock, FaPen
} from 'react-icons/fa';
import { Briefcase, Zap, CheckCircle, X, Send, Target, ChevronDown, Globe, Lock, Layers } from 'lucide-react';
import api from '../../api/axios';
import Avatar from '../common/Avatar';
import Skeleton from '../common/Skeleton';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import VerifiedBadge from '../common/VerifiedBadge';

const STATUS_COLORS = {
    active: 'bg-green-100 text-green-700',
    paused: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-gray-100 text-gray-500',
};

// Word count helper
const countWords = (str) => str.trim().split(/\s+/).filter(Boolean).length;
const MAX_WORDS = 500;

// ──────────────────────────────────────────────────────
// Apply Modal
// ──────────────────────────────────────────────────────
function ApplyModal({ team, onClose, onSuccess }) {
    const [selectedRoleId, setSelectedRoleId] = useState('');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const wordCount = countWords(message);
    const overLimit = wordCount > MAX_WORDS;

    const openRoles = team?.openRoles?.filter(r => r.isOpen) || [];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (openRoles.length > 0 && !selectedRoleId) {
            toast.error('Please select a role to apply for');
            return;
        }
        if (!message.trim()) {
            toast.error('Please write something about yourself');
            return;
        }
        if (overLimit) {
            toast.error(`Message too long (${wordCount} words). Max 500 words.`);
            return;
        }
        setSubmitting(true);
        try {
            await api.post(`/teams/${team._id}/request-join`, {
                roleId: selectedRoleId || null,
                message: message.trim()
            });
            toast.success('Application sent! The team owner will review it.');
            onSuccess();
            onClose();
        } catch (err) {
            const msg = err?.response?.data?.message || '';
            if (msg.includes('already a member')) { toast.success("You're already a member!"); onClose(); return; }
            if (msg.includes('pending')) { toast('You already have a pending request', { icon: '⏳' }); onClose(); return; }
            if (msg.includes('accepted')) { toast.success('Your request was already accepted!'); onClose(); return; }
            if (msg.includes('declined') || msg.includes('rejected')) { toast.error(msg); onClose(); return; }
            toast.error(msg || 'Failed to send application');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="bg-gradient-to-r from-sky-600 to-sky-700 p-6 text-white">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sky-200 text-xs font-semibold uppercase tracking-wide mb-1">Applying to join</p>
                            <h2 className="text-xl font-extrabold">{team?.name}</h2>
                        </div>
                        <button onClick={onClose} className="text-white/70 hover:text-white transition p-1">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Role selection */}
                    {openRoles.length > 0 && (
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                                Which role are you applying for? *
                            </label>
                            <div className="space-y-2">
                                {openRoles.map(role => (
                                    <label
                                        key={role._id}
                                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedRoleId === String(role._id)
                                            ? 'border-sky-500 bg-sky-50'
                                            : 'border-gray-200 hover:border-sky-300'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="role"
                                            value={String(role._id)}
                                            checked={selectedRoleId === String(role._id)}
                                            onChange={e => setSelectedRoleId(e.target.value)}
                                            className="mt-0.5 accent-blue-600"
                                        />
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">{role.title}</p>
                                            {role.description && <p className="text-xs text-gray-500">{role.description}</p>}
                                            {role.requiredSkills?.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {role.requiredSkills.map((s, i) => (
                                                        <span key={i} className="px-1.5 py-0.5 text-[10px] bg-sky-50 text-sky-700 rounded-full border border-sky-100 font-semibold">{s}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Message */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                            Tell them about yourself *
                        </label>
                        <textarea
                            rows={5}
                            placeholder="What's your background? What skills and experience do you bring? Why do you want to join this team? What makes you a great fit?"
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            className={`w-full px-4 py-3 text-sm border rounded-xl focus:outline-none resize-none bg-gray-50 dark:bg-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-800 transition ${overLimit ? 'border-red-400 focus:border-red-500' : 'border-gray-200 dark:border-gray-700 focus:border-sky-400 dark:focus:border-sky-500'
                                }`}
                        />
                        <div className={`flex justify-between items-center mt-1 text-xs ${overLimit ? 'text-red-500 dark:text-red-400 font-semibold' : 'text-gray-400 dark:text-gray-500'
                            }`}>
                            <span>{overLimit ? `⚠ ${wordCount - MAX_WORDS} words over limit` : 'Be specific — this is your first impression'}</span>
                            <span>{wordCount} / {MAX_WORDS} words</span>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button" onClick={onClose}
                            className="flex-1 py-3 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit" disabled={submitting}
                            className="flex-1 py-3 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-700 transition text-sm flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm hover:shadow-md"
                        >
                            <Send size={15} />
                            {submitting ? 'Sending...' : 'Send Application'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────────────
// Inline Join Requests Panel (for owner/co-lead on TeamDetails)
// ──────────────────────────────────────────────────────
function JoinRequestsPanel({ team }) {
    const navigate = useNavigate();
    const pending = team.joinRequests?.filter(r => r.status === 'pending') || [];

    if (pending.length === 0) return null;

    return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-2xl overflow-hidden mb-8">
            <button
                onClick={() => navigate(`/teams/${team._id}/manage?tab=requests`)}
                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition group"
            >
                <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 animate-pulse-slow">
                        {pending.length}
                    </span>
                    <span className="font-bold text-gray-900 dark:text-white text-sm">
                        {pending.length} Pending Join Request{pending.length !== 1 ? 's' : ''}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 group-hover:text-sky-500 transition-colors">
                    <span className="text-xs font-semibold">Review Applications</span>
                    <svg className="w-4 h-4 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                </div>
            </button>
        </div>
    );
}

// ──────────────────────────────────────────────────────
// Inline Editable Goals Block (for owner in TeamDetails)
// ──────────────────────────────────────────────────────
// ──────────────────────────────────────────────────────
// Inline Editable Goals Header (for owner in TeamDetails)
// ──────────────────────────────────────────────────────
function GoalsHeader({ team, canManage, editing, setEditing }) {
    if (!team.projectGoals && !canManage) return null;
    return (
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2">
                <Target size={18} className="text-sky-500" /> About this Project & Goals
            </span>
            {canManage && !editing && (
                <button onClick={() => setEditing(true)} className="text-xs text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1 hover:underline">
                    <FaPen size={10} /> Edit
                </button>
            )}
        </h3>
    );
}

// ──────────────────────────────────────────────────────
// Inline Editable Goals Content (for owner in TeamDetails)
// ──────────────────────────────────────────────────────
function GoalsContent({ team, canManage, onRefresh, editing, setEditing }) {
    const [value, setValue] = useState(team.projectGoals || '');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setValue(team.projectGoals || '');
    }, [team.projectGoals]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put(`/teams/${team._id}/update`, { projectGoals: value });
            toast.success('Goals saved!');
            setEditing(false);
            onRefresh();
        } catch { toast.error('Failed to save'); }
        finally { setSaving(false); }
    };

    if (!team.projectGoals && !canManage) return null;

    return (
        <div className="mb-8">
            {editing ? (
                <div className="space-y-3">
                    <textarea
                        rows={6}
                        value={value}
                        onChange={e => setValue(e.target.value)}
                        placeholder="Describe your project, its goals, tech stack, what you're building and why. The more detail, the better applicants you'll attract."
                        className="w-full px-4 py-3 text-sm border border-sky-300 dark:border-gray-700 rounded-xl focus:outline-none focus:border-sky-500 bg-sky-50/30 dark:bg-gray-800 dark:text-white resize-none"
                        maxLength={2000}
                    />
                    <p className="text-right text-xs text-gray-400">{value.length}/2000</p>
                    <div className="flex gap-2">
                        <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-sky-600 text-white text-sm font-bold rounded-lg hover:bg-sky-700 transition disabled:opacity-50">
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button onClick={() => { setEditing(false); setValue(team.projectGoals || ''); }} className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                            Cancel
                        </button>
                    </div>
                </div>
            ) : team.projectGoals ? (
                <div className="bg-sky-50/40 dark:bg-sky-900/10 border border-sky-100 dark:border-sky-800/30 rounded-xl p-5">
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{team.projectGoals}</p>
                </div>
            ) : (
                <button
                    onClick={() => setEditing(true)}
                    className="w-full py-8 border-2 border-dashed border-sky-200 dark:border-gray-700 rounded-xl text-sm text-sky-500 dark:text-gray-400 hover:border-sky-400 dark:hover:border-sky-500 hover:text-sky-700 dark:hover:text-sky-400 transition flex flex-col items-center gap-2"
                >
                    <Target size={24} className="opacity-50" />
                    Add project goals & description to attract the right people
                </button>
            )}
        </div>
    );
}

// ──────────────────────────────────────────────────────
// Main TeamDetails
// ──────────────────────────────────────────────────────
const TeamDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [team, setTeam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [joinStatus, setJoinStatus] = useState('idle');
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [isEditingGoals, setIsEditingGoals] = useState(false);

    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    const [isJoiningChat, setIsJoiningChat] = useState(false);

    const fetchTeam = useCallback(async () => {
        try {
            const { data } = await api.get(`/teams/${id}`);
            setTeam(data);
        } catch (err) {
            setError('Failed to load team details');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { if (id) fetchTeam(); }, [fetchTeam, id]);

    // Separate effect: derive joinStatus from team data + currentUser
    // Runs whenever team is refreshed OR currentUser changes (auth loads)
    useEffect(() => {
        if (!team || !currentUser) return;
        const myId = String(currentUser._id || '');
        if (!myId) return;

        // members[] is the source of truth for actual membership
        const inMembers = team.members?.some(m => String(m._id || m) === myId);
        if (inMembers) { setJoinStatus('member'); return; }

        // Check join requests
        const myReq = team.joinRequests?.find(
            r => String(r.userId?._id || r.userId) === myId
        );
        if (myReq?.status === 'pending') { setJoinStatus('pending'); return; }
        // If it's 'accepted' but they aren't in members array (checked above), it's an orphaned request from a kicked user. Let them re-apply.
        if (myReq?.status === 'rejected') { setJoinStatus('rejected'); return; }

        setJoinStatus('idle');
    }, [team, currentUser]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 pt-6 px-4 max-w-5xl mx-auto space-y-4">
                <div className="pt-2">
                    <Skeleton className="h-8 w-32 mb-4" />
                </div>
                <Skeleton className="h-72 w-full rounded-2xl" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(n => <Skeleton key={n} className="h-40 w-full rounded-xl" />)}
                </div>
            </div>
        );
    }

    if (error || !team) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Team Not Found</h2>
                <p className="text-gray-600 mb-6">{error || "This team doesn't exist."}</p>
                <button onClick={() => navigate('/teams')} className="text-sky-600 font-semibold flex items-center gap-2">
                    <FaArrowLeft /> Back to Teams
                </button>
            </div>
        );
    }

    const myId = String(currentUser?._id || '');
    const isMember = team.members?.some(m => String(m._id || m) === myId);
    const isOwner = String(team.createdBy?._id || team.createdBy) === myId;
    const isCoLead = team.memberRoles?.some(
        mr => String(mr.userId?._id || mr.userId) === myId && mr.role === 'co-lead'
    );
    const canManage = isOwner || isCoLead;
    const openRoles = team.openRoles?.filter(r => r.isOpen) || [];
    const canRequestJoin = !isMember && !isOwner &&
        team.visibility === 'public' &&
        team.teamStatus === 'active' &&
        (team.isLookingForMembers || openRoles.length > 0);

    const handleLeaveTeam = async () => {
        setIsLeaving(true);
        try {
            await api.put(`/teams/${team._id}/leave`);
            toast.success('You have left the team.');
            navigate('/teams');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to leave team');
            setIsLeaving(false);
            setShowLeaveModal(false);
        }
    };

    const handleOpenTeamChat = async () => {
        if (isJoiningChat) return;
        setIsJoiningChat(true);
        try {
            const { data } = await api.post(`/chat/team/${team._id}`);
            navigate(`/chat/${data._id}`);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to open team chat');
            console.error('Error opening team chat', err);
        } finally {
            setIsJoiningChat(false);
        }
    };

    return (
        <>
            <div className="min-h-screen bg-gray-50 pt-6 pb-12 px-4 sm:px-6">
                <div className="max-w-5xl mx-auto">
                    <button onClick={() => navigate('/teams')} className="flex items-center text-gray-500 hover:text-gray-900 mb-6 transition-colors text-sm font-semibold">
                        <FaArrowLeft className="mr-2" /> Back to Teams
                    </button>

                    {/* Inline Join Request Panel for owner/co-lead */}
                    {canManage && (
                        <JoinRequestsPanel team={team} onRefresh={fetchTeam} />
                    )}

                    {/* ── Main Card ── */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                        {/* Banner */}
                        <div className="bg-white p-8 sm:p-12 text-gray-900 relative overflow-hidden rounded-t-3xl border-b border-gray-200">
                            {/* Decorative Background Elements */}
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] mix-blend-normal pointer-events-none"></div>



                            <div className="relative z-10 flex flex-col h-full justify-end">
                                {/* Top Badges Row */}
                                <div className="flex items-center gap-2 mb-6 flex-wrap">
                                    <span className="bg-gray-100 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest border border-gray-200 shadow-sm flex items-center gap-1.5 text-gray-700">
                                        {team.visibility === 'public' ? <Globe size={12} className="text-gray-500" /> : <Lock size={12} className="text-gray-500" />}
                                        {team.visibility}
                                    </span>
                                    <span className="bg-gray-100 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest border border-gray-200 shadow-sm flex items-center gap-1.5 text-gray-700">
                                        <Layers size={12} className="text-gray-500" /> {team.category}
                                    </span>

                                    {team.teamStatus && team.teamStatus !== 'active' && (
                                        <span className={`px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest shadow-sm border border-gray-200 ${STATUS_COLORS[team.teamStatus]}`}>
                                            {team.teamStatus}
                                        </span>
                                    )}

                                    {team.isLookingForMembers && (
                                        <span className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest text-emerald-700 shadow-sm">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                            </span>
                                            Hiring
                                        </span>
                                    )}
                                </div>

                                {/* Main Title & Description */}
                                <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-4 tracking-tight drop-shadow-sm leading-tight text-gray-900">
                                    {team.name}
                                </h1>
                                <p className="text-gray-500 text-lg md:text-xl max-w-3xl leading-relaxed font-medium">
                                    {team.description || 'No description provided.'}
                                </p>

                                {/* currentFocus block */}
                                {team.currentFocus && (
                                    <div className="mt-8 inline-flex items-stretch bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden shadow-sm max-w-fit">
                                        <div className="bg-yellow-100 px-4 flex items-center justify-center border-r border-gray-200">
                                            <Zap size={20} className="text-yellow-600" />
                                        </div>
                                        <div className="px-5 py-3">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Focusing on</p>
                                            <p className="text-sm font-semibold">{team.currentFocus}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Stats Bar */}
                        <div className="bg-white border-b border-gray-100 px-8 py-4 flex flex-wrap gap-6 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                                <FaUserShield className="text-sky-500" />
                                <span>Created by <span className="font-semibold text-gray-900">{team.createdBy?.name || 'Unknown'}</span></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FaUsers className="text-green-500" />
                                <span>{team.members?.length || 0} Members</span>
                            </div>
                            {openRoles.length > 0 && (
                                <div className="flex items-center gap-2 text-sky-600 font-semibold">
                                    <Briefcase size={14} />
                                    <span>{openRoles.length} open role{openRoles.length !== 1 ? 's' : ''}</span>
                                </div>
                            )}
                        </div>

                        {/* Content Grid */}
                        <div className="p-8 grid md:grid-cols-3 gap-x-8 gap-y-0">
                            {/* Row 1: Left has Header, Right is empty (for md+) */}
                            <div className="md:col-span-2">
                                <GoalsHeader
                                    team={team}
                                    canManage={canManage}
                                    editing={isEditingGoals}
                                    setEditing={setIsEditingGoals}
                                />
                            </div>
                            <div className="hidden md:block"></div>

                            {/* Row 2: Left Content & Right Actions start at same vertical point */}
                            <div className="md:col-span-2 space-y-0">
                                {/* Project Goals / About section content */}
                                <GoalsContent
                                    team={team}
                                    canManage={canManage}
                                    onRefresh={fetchTeam}
                                    editing={isEditingGoals}
                                    setEditing={setIsEditingGoals}
                                />

                                {/* Members */}
                                <div className="mb-8">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <span className="w-1 h-6 bg-sky-600 rounded-full" /> Team Members
                                    </h3>
                                    <div className="grid sm:grid-cols-2 gap-3">
                                        {team.members?.map(member => {
                                            const memberId = String(member._id || member);
                                            const isThisOwner = String(team.createdBy?._id || team.createdBy) === memberId;
                                            const roleMeta = team.memberRoles?.find(
                                                mr => String(mr.userId?._id || mr.userId) === memberId
                                            );
                                            const roleLabel = isThisOwner ? 'Owner' : (roleMeta?.role === 'co-lead' ? 'Co-Lead' : 'Member');
                                            return (
                                                <div
                                                    key={memberId}
                                                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-sky-100 hover:shadow-sm transition-all cursor-pointer group"
                                                    onClick={() => navigate(`/users/${member.username}`)}
                                                >
                                                    <Avatar src={member.profilePic} alt={member.name} size="md" />
                                                    <div>
                                                        <div className="flex items-center gap-1 text-sm">
                                                            <p className="font-bold text-gray-900 group-hover:text-sky-600 transition">{member.name}</p>
                                                            <VerifiedBadge verified={member.collegeVerified} />
                                                        </div>
                                                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${isThisOwner ? 'bg-sky-100 text-sky-700'
                                                            : roleMeta?.role === 'co-lead' ? 'bg-sky-100 text-sky-700'
                                                                : 'bg-gray-100 text-gray-500'
                                                            }`}>{roleLabel}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Open Roles */}
                                {openRoles.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <span className="w-1 h-6 bg-emerald-500 rounded-full" /> Open Positions
                                        </h3>
                                        <div className="space-y-3">
                                            {openRoles.map(role => (
                                                <div key={role._id} className="p-4 rounded-xl border border-gray-200 hover:border-emerald-200 hover:bg-emerald-50/20 transition-all text-left w-full group">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <p className="font-bold text-gray-900 text-sm group-hover:text-emerald-700 transition">{role.title}</p>
                                                        {(role.vacancies > 1 || role.filledCount > 0) && (
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                                                                {role.vacancies - (role.filledCount || 0)} spot{role.vacancies - (role.filledCount || 0) !== 1 ? 's' : ''} left
                                                            </span>
                                                        )}
                                                    </div>
                                                    {role.description && <p className="text-xs text-gray-500 mt-0.5">{role.description}</p>}
                                                    {role.requiredSkills?.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {role.requiredSkills.map((s, i) => (
                                                                <span key={i} className="px-2 py-0.5 text-[10px] bg-sky-50 text-sky-600 border border-sky-100 rounded-full font-semibold">{s}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right: Actions */}
                            <div className="space-y-4">
                                {/* Join request CTA */}
                                {canRequestJoin && (
                                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm relative overflow-hidden">
                                        {/* Subtle accent line at top */}
                                        <div className={`absolute top-0 left-0 w-full h-1 ${joinStatus === 'rejected' ? 'bg-orange-400' : 'bg-sky-600'}`} />

                                        <h3 className="font-extrabold text-gray-900 mb-2 text-base">
                                            {joinStatus === 'rejected' ? 'Application Declined' : 'Interested in joining?'}
                                        </h3>
                                        <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                                            {joinStatus === 'rejected'
                                                ? 'Your previous application was declined, but you are welcome to apply again.'
                                                : joinStatus === 'pending'
                                                    ? 'Your application is currently being reviewed by the team owners.'
                                                    : openRoles.length > 0
                                                        ? `${openRoles.length} open position${openRoles.length !== 1 ? 's' : ''} available. We're looking for great people to join us.`
                                                        : 'This team is open to new members. Tell us why you\'d be a great fit.'}
                                        </p>

                                        {joinStatus !== 'pending' && joinStatus !== 'member' && (
                                            <button
                                                onClick={() => setShowApplyModal(true)}
                                                className={`w-full py-2.5 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${joinStatus === 'rejected'
                                                    ? 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200'
                                                    : 'bg-sky-600 text-white hover:bg-sky-700 shadow-sm hover:shadow-md'
                                                    }`}
                                            >
                                                <Send size={15} />
                                                {joinStatus === 'rejected' ? 'Apply Again' : 'Apply Now'}
                                            </button>
                                        )}

                                        {joinStatus === 'pending' && (
                                            <button disabled className="w-full py-2.5 rounded-xl font-bold text-sm bg-gray-50 text-gray-500 border border-gray-200 cursor-default flex items-center justify-center gap-2">
                                                <FaClock size={14} className="text-gray-400" /> Application Sent
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Member notice */}
                                {isMember && !isOwner && (
                                    <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 text-center">
                                        <CheckCircle size={20} className="text-sky-500 mx-auto mb-1" />
                                        <p className="text-sm font-semibold text-sky-700">You're a member</p>
                                    </div>
                                )}

                                {/* Owner controls */}
                                {canManage && (
                                    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                                        <h3 className="font-bold text-gray-900 mb-3 text-sm flex items-center gap-2">
                                            <FaCog className="text-gray-500" /> Owner Controls
                                        </h3>
                                        <button
                                            onClick={() => navigate(`/teams/${id}/manage`)}
                                            className="w-full py-2.5 px-4 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition text-sm flex items-center justify-center gap-2 shadow-sm"
                                        >
                                            Manage Team
                                        </button>
                                    </div>
                                )}

                                <button
                                    onClick={handleOpenTeamChat}
                                    disabled={isJoiningChat}
                                    className="w-full py-3 px-4 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-700 transition-all shadow-lg shadow-sky-200 active:scale-95 text-sm disabled:opacity-50"
                                >
                                    {isJoiningChat ? 'Opening...' : 'Open Chat Room'}
                                </button>

                                {/* Leave Team Button for Members only */}
                                {isMember && !isOwner && (
                                    <button
                                        onClick={() => setShowLeaveModal(true)}
                                        className="w-full py-3 px-4 border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 hover:border-red-300 transition-all text-sm mt-3"
                                    >
                                        Leave Team
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Apply Modal */}
            {showApplyModal && (
                <ApplyModal
                    team={team}
                    onClose={() => setShowApplyModal(false)}
                    onSuccess={() => setJoinStatus('pending')}
                />
            )}

            {/* Leave Confirmation Modal */}
            {showLeaveModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm p-6 shadow-xl border border-red-100">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Leave Team?</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                            Are you sure you want to leave <strong>{team.name}</strong>? You will lose access to team resources and will need to re-apply if you want to join again.
                        </p>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowLeaveModal(false)}
                                className="flex-1 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-xl transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleLeaveTeam}
                                disabled={isLeaving}
                                className="flex-1 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-xl transition"
                            >
                                {isLeaving ? 'Leaving...' : 'Yes, Leave'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default TeamDetails;
