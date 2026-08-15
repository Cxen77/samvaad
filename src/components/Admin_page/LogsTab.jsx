import { useState, useEffect } from 'react';
import { FiClock, FiChevronLeft, FiChevronRight, FiUser, FiTarget } from 'react-icons/fi';
import api from '../../api/axios';

const actionColors = {
    ROLE_CHANGE: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400',
    SUSPEND_USER: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
    UNSUSPEND_USER: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20',
    SOFT_DELETE_USER: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400',
    APPROVE_EVENT: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20',
    REJECT_EVENT: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400',
    SOFT_DELETE_EVENT: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400',
    SOFT_DELETE_POST: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400',
    SOFT_DELETE_FORUM_POST: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400',
    UPDATE_SETTINGS: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400',
};

export default function LogsTab() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/admin/logs?page=${page}&limit=20`);
            setLogs(data.logs);
            setTotalPages(data.pages);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLogs(); }, [page]);

    const formatTime = (date) => {
        const d = new Date(date);
        const now = new Date();
        const diffMs = now - d;
        const diffMin = Math.floor(diffMs / 60000);
        const diffHr = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHr / 24);

        if (diffMin < 1) return 'Just now';
        if (diffMin < 60) return `${diffMin}m ago`;
        if (diffHr < 24) return `${diffHr}h ago`;
        if (diffDay < 7) return `${diffDay}d ago`;
        return d.toLocaleDateString();
    };

    return (
        <div>
            <div className="flex items-center gap-3 mb-6">
                <FiClock className="w-5 h-5 text-sky-500" />
                <h2 className="text-lg font-bold text-gray-900">Audit Logs</h2>
            </div>

            <div className="admin-glass rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="p-4 space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : logs.length === 0 ? (
                    <div className="text-center text-gray-400 py-12">No audit logs yet</div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {logs.map(log => (
                            <div key={log._id} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`admin-badge ${actionColors[log.action] || 'bg-gray-100 text-gray-500'}`}>
                                                {log.action?.replace(/_/g, ' ')}
                                            </span>
                                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                                <FiUser className="w-3 h-3" />
                                                {log.adminId?.name || log.adminId?.username || 'System'}
                                            </span>
                                        </div>
                                        {log.details && (
                                            <p className="text-xs text-gray-500 mt-1.5 truncate">{log.details}</p>
                                        )}
                                    </div>
                                    <span className="text-[11px] text-gray-400 whitespace-nowrap flex items-center gap-1">
                                        <FiClock className="w-3 h-3" />
                                        {formatTime(log.createdAt)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

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
        </div>
    );
}
