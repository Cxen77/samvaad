import { useState, useEffect } from 'react';
import { FiShield, FiCheck, FiX, FiChevronLeft, FiChevronRight, FiMessageSquare } from 'react-icons/fi';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const STATUS_FILTERS = [
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
];

const statusBadge = (v) => {
    if (v === true) return <span className="admin-badge bg-sky-500/20 text-sky-400">Approved</span>;
    if (v === 'pending') return <span className="admin-badge bg-amber-500/20 text-amber-400">Pending</span>;
    if (v === 'rejected') return <span className="admin-badge bg-red-500/20 text-red-400">Rejected</span>;
    return <span className="admin-badge bg-gray-100 text-gray-400">None</span>;
};

export default function VerificationsTab() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [actionLoading, setActionLoading] = useState(null);
    // Reject reason modal state
    const [rejectTarget, setRejectTarget] = useState(null); // { id, name }
    const [rejectReason, setRejectReason] = useState('');

    const fetchVerifications = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/admin/verifications?status=${filter}&page=${page}&limit=15`);
            setUsers(data.users);
            setTotalPages(data.pages);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load verification requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchVerifications(); }, [filter, page]);

    const handleApprove = async (id, name) => {
        setActionLoading(id);
        try {
            await api.patch(`/admin/verifications/${id}/approve`);
            toast.success(`✅ ${name} verified!`);
            fetchVerifications();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to approve');
        } finally {
            setActionLoading(null);
        }
    };

    const handleRejectSubmit = async () => {
        if (!rejectTarget) return;
        setActionLoading(rejectTarget.id);
        try {
            await api.patch(`/admin/verifications/${rejectTarget.id}/reject`, { reason: rejectReason });
            toast.success(`Verification rejected for ${rejectTarget.name}`);
            setRejectTarget(null);
            setRejectReason('');
            fetchVerifications();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to reject');
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <FiShield className="w-5 h-5 text-sky-500" />
                    <h2 className="text-lg font-bold text-gray-900">Student Verifications</h2>
                </div>
                {/* Filter tabs */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                    {STATUS_FILTERS.map(f => (
                        <button
                            key={f.value}
                            onClick={() => { setFilter(f.value); setPage(1); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === f.value
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-800'
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="admin-glass rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full admin-table">
                        <thead>
                            <tr className="bg-white/[0.02]">
                                <th className="text-left">User</th>
                                <th className="text-left">College</th>
                                <th className="text-center">Year / Section</th>
                                <th className="text-center">ID Card</th>
                                <th className="text-center">Status</th>
                                <th className="text-left">Note</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan={6}><div className="h-10 bg-gray-100 rounded animate-pulse" /></td>
                                    </tr>
                                ))
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center text-gray-400 py-10">
                                        No {filter} verification requests
                                    </td>
                                </tr>
                            ) : users.map(user => (
                                <tr key={user._id}>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={user.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1e293b&color=94a3b8&size=32`}
                                                alt=""
                                                className="w-8 h-8 rounded-full object-cover border border-gray-200 shrink-0"
                                            />
                                            <div>
                                                <p className="font-medium text-gray-900 text-sm">{user.name}</p>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <p className="text-xs text-gray-400">@{user.username}</p>
                                                    {user.collegeVerificationMethod && (
                                                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${user.collegeVerificationMethod === 'email'
                                                                ? 'bg-sky-50 text-sky-600'
                                                                : 'bg-sky-50 text-sky-600'
                                                            }`}>
                                                            {user.collegeVerificationMethod === 'email' ? 'Email' : 'ID Card'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <p className="text-sm text-gray-700 truncate max-w-[180px]" title={user.college}>
                                            {user.college || <span className="text-gray-400 italic">Not set</span>}
                                        </p>
                                    </td>
                                    <td className="text-center">
                                        <span className="text-sm text-gray-500">
                                            {[user.year, user.section].filter(Boolean).join(' · ') || '—'}
                                        </span>
                                    </td>
                                    {/* ID Card thumbnail */}
                                    <td className="text-center">
                                        {user.collegeIdCardUrl ? (
                                            <a href={user.collegeIdCardUrl} target="_blank" rel="noopener noreferrer">
                                                <img
                                                    src={user.collegeIdCardUrl}
                                                    alt="ID Card"
                                                    className="w-16 h-10 object-cover rounded-lg border border-gray-200 mx-auto hover:opacity-80 transition-opacity cursor-pointer"
                                                    title="Click to view full image"
                                                />
                                            </a>
                                        ) : (
                                            <span className="text-gray-300 text-xs">—</span>
                                        )}
                                    </td>
                                    <td className="text-center">{statusBadge(user.collegeVerified)}</td>
                                    <td>
                                        {user.verificationNote ? (
                                            <p className="text-xs text-red-500 truncate max-w-[140px]" title={user.verificationNote}>
                                                {user.verificationNote}
                                            </p>
                                        ) : (
                                            <span className="text-gray-300">—</span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="flex items-center justify-end gap-2">
                                            {/* Approve */}
                                            <button
                                                onClick={() => handleApprove(user._id, user.name)}
                                                disabled={actionLoading === user._id || user.collegeVerified === true}
                                                className="admin-btn admin-btn-blue disabled:opacity-30 disabled:cursor-not-allowed"
                                                title="Approve Verification"
                                            >
                                                <FiCheck className="w-3.5 h-3.5" />
                                            </button>
                                            {/* Reject */}
                                            <button
                                                onClick={() => { setRejectTarget({ id: user._id, name: user.name }); setRejectReason(''); }}
                                                disabled={actionLoading === user._id || user.collegeVerified === 'rejected'}
                                                className="admin-btn admin-btn-red disabled:opacity-30 disabled:cursor-not-allowed"
                                                title="Reject Verification"
                                            >
                                                <FiX className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                        <p className="text-xs text-gray-400">Page {page} of {totalPages}</p>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="admin-btn admin-btn-blue disabled:opacity-30">
                                <FiChevronLeft className="w-4 h-4" />
                            </button>
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="admin-btn admin-btn-blue disabled:opacity-30">
                                <FiChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Reject Reason Modal */}
            {rejectTarget && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-50 rounded-xl">
                                <FiX className="w-5 h-5 text-red-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Reject Verification</h3>
                                <p className="text-sm text-gray-500">For: <span className="font-medium">{rejectTarget.name}</span></p>
                            </div>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Rejection reason <span className="text-gray-400 font-normal">(optional, shown to user)</span>
                            </label>
                            <div className="relative">
                                <FiMessageSquare className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                                <textarea
                                    value={rejectReason}
                                    onChange={e => setRejectReason(e.target.value)}
                                    maxLength={300}
                                    rows={3}
                                    placeholder="e.g. Incomplete profile — please add your college and year before reapplying."
                                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400/20 transition-all resize-none"
                                />
                            </div>
                            <p className="text-right text-xs text-gray-400 mt-1">{rejectReason.length}/300</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setRejectTarget(null)}
                                className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium text-sm transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRejectSubmit}
                                disabled={actionLoading === rejectTarget?.id}
                                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                {actionLoading === rejectTarget?.id ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <FiX className="w-4 h-4" /> Reject
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
