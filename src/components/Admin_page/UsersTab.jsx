import { useState, useEffect } from 'react';
import { FiUsers, FiSearch, FiShield, FiSlash, FiCheck, FiChevronLeft, FiChevronRight, FiTrash2 } from 'react-icons/fi';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const roleColors = {
    admin: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20',
    moderator: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
    user: 'bg-gray-100 text-gray-500',
};

export default function UsersTab() {
    const { currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [actionLoading, setActionLoading] = useState(null);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/admin/users?page=${page}&limit=15&search=${search}`);
            setUsers(data.users);
            setTotalPages(data.pages);
        } catch (err) {
            console.error('Failed to load users:', err);
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, [page, search]);

    const handleRoleChange = async (id, role) => {
        setActionLoading(id);
        try {
            await api.patch(`/admin/users/${id}/role`, { role });
            toast.success(`Role updated to ${role}`);
            fetchUsers();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to update role');
        } finally {
            setActionLoading(null);
        }
    };

    const handleSuspend = async (id, suspend) => {
        setActionLoading(id);
        try {
            await api.patch(`/admin/users/${id}/${suspend ? 'suspend' : 'unsuspend'}`);
            fetchUsers();
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Soft-delete this user? They will be suspended and marked as deleted.')) return;
        setActionLoading(id);
        try {
            await api.delete(`/admin/users/${id}`);
            fetchUsers();
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <FiUsers className="w-5 h-5 text-sky-500" />
                    <h2 className="text-lg font-bold text-gray-900">User Management</h2>
                </div>
                <div className="relative w-full sm:w-64">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                        className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-sky-500/40 focus:ring-1 focus:ring-sky-500/20 transition-all"
                    />
                </div>
            </div>

            <div className="admin-glass rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full admin-table">
                        <thead>
                            <tr className="bg-white/[0.02]">
                                <th className="text-left">User</th>
                                <th className="text-left">Email</th>
                                <th className="text-center">Role</th>
                                <th className="text-center">Status</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan={5}><div className="h-10 bg-gray-100 rounded animate-pulse" /></td>
                                    </tr>
                                ))
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center text-gray-400 py-8">No users found</td>
                                </tr>
                            ) : users.map(user => (
                                <tr key={user._id}>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={user.profilePic || `https://ui-avatars.com/api/?name=${user.name}&background=1e293b&color=94a3b8&size=32`}
                                                alt=""
                                                className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-200"
                                            />
                                            <div>
                                                <p className="font-medium text-gray-900 text-sm">{user.name}</p>
                                                <p className="text-xs text-gray-400">@{user.username}</p>
                                                {user.college && (
                                                    <p className="text-[10px] text-sky-600/70 mt-0.5 truncate max-w-[150px]" title={user.college}>
                                                        {user.college}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="text-gray-500 text-xs">{user.email}</td>
                                    <td className="text-center">
                                        {currentUser?.role === 'admin' ? (
                                            <select
                                                value={user.role}
                                                onChange={e => handleRoleChange(user._id, e.target.value)}
                                                disabled={actionLoading === user._id || (user._id === currentUser._id && user.role === 'admin')}
                                                className={`w-full min-w-[140px] bg-white dark:bg-transparent border border-gray-200 dark:border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-sky-500/40 cursor-pointer ${user.role === 'admin' ? 'text-sky-600 font-bold' :
                                                    user.role === 'moderator' ? 'text-amber-600 dark:text-amber-400' :
                                                        user.role === 'organizer' ? 'text-sky-600 dark:text-sky-400' : 'text-gray-500'
                                                    }`}
                                            >
                                                <option value="user" className="bg-gray-100 text-gray-400">User</option>
                                                <option value="moderator" className="bg-gray-100 text-amber-400">Moderator</option>
                                                <option
                                                    value="organizer"
                                                    className="bg-gray-100 text-sky-400"
                                                    disabled={!user.collegeId}
                                                    title={!user.collegeId ? "User must have a linked college (CollegeID) to be an Organizer" : ""}
                                                >
                                                    Organizer {!user.collegeId ? '(No College Linked)' : ''}
                                                </option>
                                                <option value="admin" className="bg-gray-100 text-sky-400">Admin</option>
                                            </select>
                                        ) : (
                                            <span className={`text-xs capitalize font-medium ${user.role === 'admin' ? 'text-sky-600' :
                                                user.role === 'moderator' ? 'text-amber-600 dark:text-amber-400' :
                                                    user.role === 'organizer' ? 'text-sky-600 dark:text-sky-400' : 'text-gray-400'
                                                }`}>
                                                {user.role}
                                            </span>
                                        )}
                                    </td>
                                    <td className="text-center">
                                        <span className={`admin-badge ${user.isSuspended ? 'bg-red-500/20 text-red-400' : 'bg-sky-500/20 text-sky-400'}`}>
                                            {user.isSuspended ? 'Suspended' : 'Active'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleSuspend(user._id, !user.isSuspended)}
                                                disabled={actionLoading === user._id || user.role === 'admin'}
                                                className={`admin-btn ${user.isSuspended ? 'admin-btn-blue' : 'admin-btn-amber'} disabled:opacity-30 disabled:cursor-not-allowed`}
                                                title={user.isSuspended ? 'Unsuspend' : 'Suspend (Cannot suspend admins)'}
                                            >
                                                {user.isSuspended ? <FiCheck className="w-3.5 h-3.5" /> : <FiSlash className="w-3.5 h-3.5" />}
                                            </button>

                                            {currentUser?.role === 'admin' && (
                                                <button
                                                    onClick={() => handleDelete(user._id)}
                                                    disabled={actionLoading === user._id || user.role === 'admin'}
                                                    className="admin-btn admin-btn-red disabled:opacity-30 disabled:cursor-not-allowed"
                                                    title="Soft Delete (Cannot delete admins)"
                                                >
                                                    <FiTrash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
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
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="admin-btn admin-btn-blue disabled:opacity-30"
                            >
                                <FiChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="admin-btn admin-btn-blue disabled:opacity-30"
                            >
                                <FiChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
