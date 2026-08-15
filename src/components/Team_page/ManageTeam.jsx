import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaUserMinus, FaUserShield, FaExchangeAlt, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { Briefcase, Settings, Users, Inbox, Plus, Trash2, Eye, EyeOff, Zap } from 'lucide-react';
import api from '../../api/axios';
import Avatar from '../common/Avatar';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const TABS = [
    { id: 'members', label: 'Members', icon: Users },
    { id: 'roles', label: 'Open Positions', icon: Briefcase },
    { id: 'requests', label: 'Join Requests', icon: Inbox },
    { id: 'settings', label: 'Settings', icon: Settings },
];

// ─── Shared confirm helper ────────────────────────────
function useConfirm() {
    return (msg) => window.confirm(msg);
}

// ─── Members Tab ─────────────────────────────────────
function MembersTab({ team, currentUserId, onRefresh }) {
    const confirm = useConfirm();
    const isOwner = team.createdBy?._id === currentUserId || team.createdBy === currentUserId;

    const getMemberRole = (memberId) => {
        const entry = team.memberRoles?.find(mr =>
            mr.userId === memberId || mr.userId?._id === memberId
        );
        return entry?.role || 'member';
    };

    const handleRemove = async (userId, name) => {
        if (!confirm(`Remove ${name} from the team?`)) return;
        try {
            await api.put(`/teams/${team._id}/remove/${userId}`);
            toast.success(`${name} removed`);
            onRefresh();
        } catch { toast.error('Failed to remove member'); }
    };

    const handlePromote = async (userId, name) => {
        if (!confirm(`Promote ${name} to Co-Lead?`)) return;
        try {
            await api.put(`/teams/${team._id}/members/${userId}/promote`);
            toast.success(`${name} promoted to Co-Lead`);
            onRefresh();
        } catch (err) { toast.error(err?.response?.data?.message || 'Failed to promote'); }
    };

    const handleTransfer = async (userId, name) => {
        if (!confirm(`Transfer ownership to ${name}? You will become a Co-Lead.`)) return;
        try {
            await api.put(`/teams/${team._id}/transfer`, { newOwnerId: userId });
            toast.success(`Ownership transferred to ${name}`);
            onRefresh();
        } catch (err) { toast.error(err?.response?.data?.message || 'Failed to transfer'); }
    };

    return (
        <div className="space-y-3">
            {team.members?.map(member => {
                const memberId = member._id || member;
                const memberRole = getMemberRole(String(memberId));
                const isSelf = String(memberId) === currentUserId;
                const isThisOwner = memberRole === 'owner' || String(team.createdBy?._id || team.createdBy) === String(memberId);

                return (
                    <div key={String(memberId)} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-white hover:border-gray-200 transition">
                        <Avatar src={member.profilePic} alt={member.name || 'Member'} size="md" />
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">{member.name || 'Unknown'}</p>
                            <span className={`text-[11px] font-bold capitalize px-2 py-0.5 rounded-full ${isThisOwner ? 'bg-sky-100 text-sky-700'
                                : memberRole === 'co-lead' ? 'bg-sky-100 text-sky-700'
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                {isThisOwner ? 'Owner' : memberRole}
                            </span>
                        </div>

                        {isOwner && !isSelf && !isThisOwner && (
                            <div className="flex items-center gap-1">
                                {memberRole !== 'co-lead' && (
                                    <button
                                        onClick={() => handlePromote(String(memberId), member.name)}
                                        title="Promote to Co-Lead"
                                        className="p-1.5 text-sky-500 hover:bg-sky-50 rounded-lg transition text-xs"
                                    >
                                        <FaUserShield />
                                    </button>
                                )}
                                <button
                                    onClick={() => handleTransfer(String(memberId), member.name)}
                                    title="Transfer Ownership"
                                    className="p-1.5 text-sky-500 hover:bg-sky-50 rounded-lg transition text-xs"
                                >
                                    <FaExchangeAlt />
                                </button>
                                <button
                                    onClick={() => handleRemove(String(memberId), member.name)}
                                    title="Remove Member"
                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition text-xs"
                                >
                                    <FaUserMinus />
                                </button>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ─── Open Positions Tab ───────────────────────────────
const PRESET_ROLES = [
    { title: 'UI/UX Designer', skills: ['Figma', 'Design'] },
    { title: 'Graphic Designer', skills: ['Illustrator', 'Photoshop'] },
    { title: '3D Artist', skills: ['Blender', '3D Modeling'] },
    { title: 'Filmmaker / Videographer', skills: ['Premiere Pro', 'Filming'] },
    { title: 'Video Editor', skills: ['After Effects', 'DaVinci Resolve'] },
    { title: 'Photographer', skills: ['Photography', 'Lightroom'] },
    { title: 'Frontend Developer', skills: ['React', 'CSS', 'JavaScript'] },
    { title: 'Backend Developer', skills: ['Node.js', 'Databases'] },
    { title: 'Full Stack Developer', skills: ['React', 'Node.js'] },
    { title: 'Mobile Developer', skills: ['React Native', 'Flutter'] },
    { title: 'ML / AI Engineer', skills: ['Python', 'TensorFlow'] },
    { title: 'Data Analyst', skills: ['Python', 'SQL', 'Excel'] },
    { title: 'Content Writer', skills: ['Writing', 'SEO'] },
    { title: 'Social Media Manager', skills: ['Content Strategy', 'Copywriting'] },
    { title: 'Marketing Strategist', skills: ['Marketing', 'Analytics'] },
    { title: 'Project Manager', skills: ['Jira', 'Agile'] },
    { title: 'Business Developer', skills: ['Pitching', 'Strategy'] },
    { title: 'Music Producer', skills: ['Ableton', 'Audio Engineering'] },
    { title: 'Animator', skills: ['After Effects', 'Animation'] },
];

function RolesTab({ team, onRefresh }) {
    const [adding, setAdding] = useState(false);
    const [form, setForm] = useState({ title: '', description: '', requiredSkills: '', vacancies: 1 });
    const [submitting, setSubmitting] = useState(false);
    const [showPresets, setShowPresets] = useState(true);

    const applyPreset = (preset) => {
        setForm(p => ({
            ...p,
            title: preset.title,
            requiredSkills: preset.skills.join(', '),
            vacancies: 1
        }));
        setShowPresets(false);
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!form.title.trim()) { toast.error('Role title required'); return; }
        setSubmitting(true);
        try {
            await api.post(`/teams/${team._id}/roles`, {
                title: form.title,
                description: form.description,
                requiredSkills: form.requiredSkills.split(',').map(s => s.trim()).filter(Boolean),
                vacancies: parseInt(form.vacancies, 10) || 1
            });
            toast.success('Role added');
            setForm({ title: '', description: '', requiredSkills: '', vacancies: 1 });
            setAdding(false);
            setShowPresets(true);
            onRefresh();
        } catch { toast.error('Failed to add role'); }
        finally { setSubmitting(false); }
    };

    const handleToggle = async (roleId, currentIsOpen) => {
        try {
            await api.put(`/teams/${team._id}/roles/${roleId}`, { isOpen: !currentIsOpen });
            toast.success(currentIsOpen ? 'Role closed' : 'Role opened');
            onRefresh();
        } catch { toast.error('Failed to update role'); }
    };

    const handleDelete = async (roleId, title) => {
        if (!window.confirm(`Delete the "${title}" role?`)) return;
        try {
            await api.delete(`/teams/${team._id}/roles/${roleId}`);
            toast.success('Role deleted');
            onRefresh();
        } catch { toast.error('Failed to delete role'); }
    };

    return (
        <div className="space-y-4">
            {team.openRoles?.length === 0 && !adding && (
                <div className="text-center py-8 text-gray-400">
                    <Briefcase size={32} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No open positions yet.</p>
                </div>
            )}

            {team.openRoles?.map(role => (
                <div key={role._id} className={`p-4 rounded-xl border transition ${role.isOpen ? 'border-sky-200 bg-sky-50/30' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <p className="font-bold text-gray-900 text-sm">{role.title}</p>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${role.isOpen ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                                    {role.isOpen ? 'Open' : 'Closed'}
                                </span>
                                {(role.vacancies > 1 || role.filledCount > 0) && (
                                    <span className="text-[10px] text-gray-400 font-semibold ml-1">
                                        ({role.filledCount || 0}/{role.vacancies || 1} filled)
                                    </span>
                                )}
                            </div>
                            {role.description && <p className="text-xs text-gray-500 mb-2">{role.description}</p>}
                            {role.requiredSkills?.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                    {role.requiredSkills.map((s, i) => (
                                        <span key={i} className="px-2 py-0.5 text-[10px] bg-white border border-gray-200 rounded-full text-gray-600">{s}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                            <button onClick={() => handleToggle(role._id, role.isOpen)} title={role.isOpen ? 'Close' : 'Open'} className="p-1.5 text-gray-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition">
                                {role.isOpen ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                            <button onClick={() => handleDelete(role._id, role.title)} title="Delete" className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            ))}

            {/* Add new role form */}
            {adding ? (
                <form onSubmit={handleAdd} className="border-2 border-dashed border-sky-300 rounded-xl bg-sky-50/20 overflow-hidden">
                    {/* Preset picker */}
                    {showPresets && (
                        <div className="p-4 border-b border-sky-200">
                            <p className="text-xs font-bold text-sky-700 uppercase tracking-wide mb-3">Quick pick a role type</p>
                            <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-1">
                                {PRESET_ROLES.map((p, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => applyPreset(p)}
                                        className="text-left px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:border-sky-400 hover:text-sky-700 hover:bg-sky-50 transition"
                                    >
                                        {p.title}
                                    </button>
                                ))}
                            </div>
                            <button type="button" onClick={() => setShowPresets(false)} className="mt-2 text-xs text-gray-400 hover:text-gray-600 underline">
                                Or enter a custom role ↓
                            </button>
                        </div>
                    )}

                    <div className="p-4 space-y-3">
                        <input
                            type="text" placeholder="Role title *" value={form.title}
                            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-sky-400 bg-white"
                        />
                        <input
                            type="text" placeholder="What will they do? (short description)" value={form.description}
                            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-sky-400 bg-white"
                        />
                        <input
                            type="text" placeholder="Required skills (comma separated, e.g. Figma, React)" value={form.requiredSkills}
                            onChange={e => setForm(p => ({ ...p, requiredSkills: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-sky-400 bg-white"
                        />
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Number of openings</label>
                            <input
                                type="number" min="1" max="100" value={form.vacancies}
                                onChange={e => setForm(p => ({ ...p, vacancies: e.target.value }))}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-sky-400 bg-white"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button type="submit" disabled={submitting} className="flex-1 py-2 bg-sky-600 text-white text-sm font-bold rounded-lg hover:bg-sky-700 transition disabled:opacity-50">
                                {submitting ? 'Adding...' : 'Add Position'}
                            </button>
                            <button type="button" onClick={() => { setAdding(false); setShowPresets(true); }} className="px-4 py-2 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50 transition">
                                Cancel
                            </button>
                        </div>
                    </div>
                </form>
            ) : (
                <button
                    onClick={() => setAdding(true)}
                    className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-sky-400 hover:text-sky-600 transition flex items-center justify-center gap-2"
                >
                    <Plus size={16} /> Add Open Position
                </button>
            )}
        </div>
    );
}

// ─── Join Requests Tab ────────────────────────────────
function RequestsTab({ team, onRefresh }) {
    const [expandedReqId, setExpandedReqId] = useState(null);
    const pending = team.joinRequests?.filter(r => r.status === 'pending') || [];

    const handle = async (reqId, action, userId) => {
        try {
            await api.put(`/teams/${team._id}/join-requests/${reqId}`, { action });
            toast.success(action === 'accept' ? 'Member added!' : 'Request rejected');
            onRefresh();
        } catch (err) { toast.error(err?.response?.data?.message || 'Action failed'); }
    };

    const toggleExpand = (id) => {
        setExpandedReqId(prev => prev === id ? null : id);
    };

    if (pending.length === 0) {
        return (
            <div className="text-center py-10 text-gray-400 dark:text-gray-500">
                <Inbox size={36} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">No pending join requests.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {pending.map(req => {
                const user = req.userId;
                const roleName = team.openRoles?.find(r => String(r._id) === String(req.roleId))?.title;
                const isExpanded = expandedReqId === req._id;
                const hasMessage = !!req.message;

                return (
                    <div
                        key={req._id}
                        className={`flex flex-col gap-3 p-4 rounded-xl border transition cursor-pointer select-none ${isExpanded
                            ? 'border-sky-200 bg-sky-50/20 dark:border-sky-800/50 dark:bg-sky-900/10'
                            : 'border-gray-100 bg-white hover:border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'
                            }`}
                        onClick={() => hasMessage && toggleExpand(req._id)}
                    >
                        <div className="flex items-start sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <Avatar src={user?.profilePic} alt={user?.name || 'User'} size="md" className="flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{user?.name || 'Unknown User'}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {roleName ? `Applying for: ${roleName}` : 'General application'}
                                    </p>
                                </div>
                            </div>

                            {/* Action Buttons Prevent Event Bubbling */}
                            <div className="flex items-center gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
                                <button
                                    onClick={() => handle(req._id, 'accept', user?._id)}
                                    title="Accept"
                                    className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition"
                                >
                                    <FaCheckCircle size={18} />
                                </button>
                                <button
                                    onClick={() => handle(req._id, 'reject', user?._id)}
                                    title="Reject"
                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                                >
                                    <FaTimesCircle size={18} />
                                </button>
                            </div>
                        </div>

                        {hasMessage && (
                            <div className="mt-1">
                                <div className={`text-sm text-gray-600 dark:text-gray-300 italic whitespace-pre-wrap leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                                    "{req.message}"
                                </div>
                                {!isExpanded && req.message.length > 100 && (
                                    <p className="text-[11px] font-bold text-sky-500 mt-1 uppercase tracking-wide">Show more</p>
                                )}
                                {isExpanded && (
                                    <p className="text-[11px] font-bold text-sky-500 mt-3 uppercase tracking-wide">Show less</p>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ─── Settings Tab ─────────────────────────────────────
function SettingsTab({ team, onRefresh, isOwner }) {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: team.name || '',
        description: team.description || '',
        projectGoals: team.projectGoals || '',
        category: team.category || '',
        visibility: team.visibility || 'public',
        currentFocus: team.currentFocus || '',
        teamStatus: team.teamStatus || 'active',
    });
    const [saving, setSaving] = useState(false);

    // Deletion Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put(`/teams/${team._id}/update`, form);
            toast.success('Team settings saved!');
            onRefresh();
        } catch { toast.error('Failed to save settings'); }
        finally { setSaving(false); }
    };

    const handleDeleteTeam = async () => {
        if (deleteConfirmText !== team.name) return;
        setIsDeleting(true);
        try {
            await api.delete(`/teams/${team._id}`);
            toast.success('Team permanently deleted');
            navigate('/teams');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to delete team');
            setIsDeleting(false);
            setShowDeleteModal(false);
        }
    };

    const inputClasses = "w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-sky-400 dark:focus:border-sky-500 bg-white dark:bg-gray-800 dark:text-white";

    return (
        <div className="space-y-8">
            <form onSubmit={handleSave} className="space-y-4">
                <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 block">Team Name</label>
                    <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                        className={inputClasses} required />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 block">Short Description</label>
                    <textarea rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                        className={`${inputClasses} resize-none`} />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 block">Project Goals & Full Description</label>
                    <textarea rows={5} value={form.projectGoals} placeholder="Describe your project vision, goals, tech stack, what you're building and why..."
                        onChange={e => setForm(p => ({ ...p, projectGoals: e.target.value }))}
                        className={`${inputClasses} resize-none`} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 block">Category</label>
                        <input
                            type="text" value={form.category}
                            onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                            className={inputClasses}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 block">Visibility</label>
                        <select
                            value={form.visibility}
                            onChange={e => setForm(p => ({ ...p, visibility: e.target.value }))}
                            className={inputClasses}
                        >
                            <option value="public">Public</option>
                            <option value="private">Private</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 block flex items-center gap-1">
                        <Zap size={11} /> Current Focus
                    </label>
                    <input
                        type="text" value={form.currentFocus} placeholder="What is your team building right now?"
                        onChange={e => setForm(p => ({ ...p, currentFocus: e.target.value }))}
                        className={inputClasses}
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 block">Team Status</label>
                    <select
                        value={form.teamStatus}
                        onChange={e => setForm(p => ({ ...p, teamStatus: e.target.value }))}
                        className={inputClasses}
                    >
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
                <button
                    type="submit" disabled={saving}
                    className="w-full py-3 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-700 transition disabled:opacity-50 shadow-sm hover:shadow-md"
                >
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </form>

            {/* Danger Zone: Only visible to the creator/owner */}
            {isOwner && (
                <div className="pt-6 border-t border-red-100 dark:border-red-900/30">
                    <h3 className="text-lg font-bold text-red-600 mb-2 whitespace-normal break-words">Danger Zone</h3>
                    <p className="text-sm text-gray-500 mb-4 whitespace-normal break-words">
                        Permanently delete this team and all of its data. This action cannot be undone.
                    </p>
                    <button
                        type="button"
                        onClick={() => setShowDeleteModal(true)}
                        className="px-4 py-2 border border-red-200 text-red-600 text-sm font-bold rounded-lg hover:bg-red-50 hover:border-red-300 transition"
                    >
                        Delete Team
                    </button>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-xl border border-red-100 dark:border-red-900/30">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 whitespace-normal break-words">Delete Team</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 whitespace-normal break-words">
                            This action is <strong>permanent</strong> and cannot be undone. All open roles, join requests, and team data will be erased.
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 whitespace-normal break-words">
                            Please type <strong className="select-all bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">{team.name}</strong> to confirm.
                        </p>
                        <input
                            type="text"
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            placeholder={team.name}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-red-500 bg-white dark:bg-gray-700 dark:text-white mb-6 font-mono text-sm"
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setDeleteConfirmText('');
                                }}
                                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteTeam}
                                disabled={deleteConfirmText !== team.name || isDeleting}
                                className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition"
                            >
                                {isDeleting ? 'Deleting...' : 'I understand, delete this team'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main ManageTeam Page ─────────────────────────────
export default function ManageTeam() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [team, setTeam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('members');

    const fetchTeam = useCallback(async () => {
        try {
            const { data } = await api.get(`/teams/${id}`);
            setTeam(data);
        } catch {
            toast.error('Failed to load team');
            navigate('/teams');
        } finally {
            setLoading(false);
        }
    }, [id, navigate]);

    useEffect(() => { fetchTeam(); }, [fetchTeam]);

    // Guard: only owner or co-lead may access this page
    useEffect(() => {
        if (!team || !currentUser) return;
        const myId = String(currentUser._id || '');
        const isOwner = String(team.createdBy?._id || team.createdBy) === myId;
        const isCoLead = team.memberRoles?.some(
            mr => String(mr.userId?._id || mr.userId) === myId && mr.role === 'co-lead'
        );
        if (!isOwner && !isCoLead) {
            toast.error('You do not have permission to manage this team');
            navigate(`/teams/${id}`);
        }
    }, [team, currentUser, id, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 pt-20 px-4 max-w-4xl mx-auto space-y-4">
                {[1, 2, 3].map(n => <div key={n} className="h-16 bg-white rounded-xl animate-pulse border border-gray-100" />)}
            </div>
        );
    }

    if (!team) return null;

    const pendingCount = team.joinRequests?.filter(r => r.status === 'pending').length || 0;

    return (
        <div className="min-h-screen bg-gray-50 pt-20 pb-12 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto">
                {/* Back nav */}
                <button
                    onClick={() => navigate(`/teams/${id}`)}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors text-sm font-semibold"
                >
                    <FaArrowLeft /> Back to Team
                </button>

                {/* Header */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                    <div className="bg-gradient-to-r from-sky-600 to-sky-600 px-8 py-6 text-white">
                        <p className="text-sky-200 text-sm font-semibold mb-1">Managing</p>
                        <h1 className="text-2xl font-extrabold">{team.name}</h1>
                        <p className="text-sky-200 text-sm mt-1">{team.members?.length} members · {team.category}</p>
                    </div>

                    {/* Tab nav */}
                    <div className="flex overflow-x-auto border-b border-gray-100">
                        {TABS.map(({ id: tid, label, icon: Icon }) => (
                            <button
                                key={tid}
                                onClick={() => setActiveTab(tid)}
                                className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold whitespace-nowrap transition-all relative flex-shrink-0 ${activeTab === tid ? 'text-sky-600' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
                            >
                                <Icon size={15} />
                                {label}
                                {tid === 'requests' && pendingCount > 0 && (
                                    <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                                        {pendingCount}
                                    </span>
                                )}
                                {activeTab === tid && (
                                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-600 rounded-t" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab content */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    {activeTab === 'members' && (
                        <MembersTab team={team} currentUserId={String(currentUser?._id || '')} onRefresh={fetchTeam} />
                    )}
                    {activeTab === 'roles' && (
                        <RolesTab team={team} onRefresh={fetchTeam} />
                    )}
                    {activeTab === 'requests' && (
                        <RequestsTab team={team} onRefresh={fetchTeam} />
                    )}
                    {activeTab === 'settings' && (
                        <SettingsTab
                            team={team}
                            onRefresh={fetchTeam}
                            isOwner={String(currentUser?._id || '') === String(team.createdBy?._id || team.createdBy)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
