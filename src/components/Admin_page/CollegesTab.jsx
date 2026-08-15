import { useState, useEffect } from 'react';
import { FiCheck, FiX, FiBook, FiMapPin, FiClock } from 'react-icons/fi';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';

export default function CollegesTab() {
    const [colleges, setColleges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    const fetchPendingColleges = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/colleges/pending');
            setColleges(data);
        } catch (err) {
            console.error('Failed to load pending colleges:', err);
            toast.error('Failed to load pending requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingColleges();
    }, []);

    const handleApprove = async (id) => {
        if (!window.confirm('Approve this institution? It will become publicly searchable.')) return;
        setActionLoading(id);
        try {
            await api.put(`/colleges/${id}/approve`);
            toast.success('Institution approved');
            setColleges(prev => prev.filter(c => c._id !== id));
        } catch (err) {
            toast.error('Failed to approve');
            console.error(err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (id) => {
        if (!window.confirm('Reject and delete this request?')) return;
        setActionLoading(id);
        try {
            await api.delete(`/colleges/${id}/reject`);
            toast.success('Request rejected');
            setColleges(prev => prev.filter(c => c._id !== id));
        } catch (err) {
            toast.error('Failed to reject');
            console.error(err);
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <FiBook className="w-5 h-5 text-sky-500" />
                    <h2 className="text-lg font-bold text-gray-900">Pending Verification</h2>
                </div>
                <div className="text-sm text-gray-400">
                    {colleges.length} pending requests
                </div>
            </div>

            <div className="admin-glass rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full admin-table">
                        <thead>
                            <tr className="bg-white/[0.02]">
                                <th className="text-left py-4 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400 font-mono">Institution</th>
                                <th className="text-left py-4 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400 font-mono">Location</th>
                                <th className="text-center py-4 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400 font-mono">Type</th>
                                <th className="text-right py-4 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400 font-mono">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan={4}><div className="h-16 bg-gray-100 rounded animate-pulse m-2" /></td>
                                    </tr>
                                ))
                            ) : colleges.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center text-gray-400 py-12 flex flex-col items-center justify-center">
                                        <div className="p-4 bg-gray-100 rounded-full mb-3">
                                            <FiCheck className="w-6 h-6 text-sky-500/50" />
                                        </div>
                                        <p>No pending requests</p>
                                    </td>
                                </tr>
                            ) : colleges.map(college => (
                                <tr key={college._id} className="group hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-sky-500/20 flex items-center justify-center text-sky-400 font-bold border border-sky-500/20">
                                                {college.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 text-sm">{college.name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-100 text-gray-500 border border-gray-200 dark:border-gray-200/50">
                                                        {college.source}
                                                    </span>
                                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                                        <FiClock className="w-3 h-3" />
                                                        {new Date(college.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2 text-sm text-gray-700">
                                            <FiMapPin className="w-3.5 h-3.5 text-gray-400" />
                                            {college.city || 'Unknown'}, {college.state || 'Unknown'}
                                            <span className="ml-1 text-xs text-gray-400">({college.country})</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <span className="text-xs px-2 py-1 rounded-md bg-sky-100 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-500/20">
                                            {college.type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleApprove(college._id)}
                                                disabled={actionLoading === college._id}
                                                className="p-2 rounded-lg bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 border border-sky-500/20 transition-all disabled:opacity-50"
                                                title="Approve"
                                            >
                                                <FiCheck className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleReject(college._id)}
                                                disabled={actionLoading === college._id}
                                                className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all disabled:opacity-50"
                                                title="Reject"
                                            >
                                                <FiX className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
