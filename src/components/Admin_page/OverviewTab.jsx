import { useState, useEffect } from 'react';
import { FiUsers, FiCalendar, FiFileText, FiMessageSquare, FiAlertTriangle, FiActivity, FiTrendingUp } from 'react-icons/fi';
import api from '../../api/axios';

const StatCard = ({ icon: Icon, label, value, gradient, loading }) => (
    <div className="admin-stat-card admin-glass rounded-2xl p-5 flex items-center gap-4 hover:scale-[1.02] transition-all duration-300 cursor-default"
        style={{ '--admin-accent': gradient?.split(' ')[0] || '#34d399' }}>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br ${gradient} shadow-lg`}>
            <Icon className="w-5 h-5 text-gray-900" />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 font-medium truncate">{label}</p>
            {loading ? (
                <div className="h-7 w-16 bg-gray-200 rounded-lg animate-pulse mt-1" />
            ) : (
                <p className="text-2xl font-bold text-gray-900 tracking-tight">{value?.toLocaleString() || 0}</p>
            )}
        </div>
    </div>
);

export default function OverviewTab() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await api.get('/admin');
                setStats(data);
            } catch (err) {
                console.error('Failed to load stats:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const cards = [
        { icon: FiUsers, label: 'Total Users', value: stats?.totalUsers, gradient: 'from-sky-500 to-sky-600' },
        { icon: FiActivity, label: 'Active Today', value: stats?.activeToday, gradient: 'from-sky-600 to-sky-700' },
        { icon: FiAlertTriangle, label: 'Suspended', value: stats?.suspendedUsers, gradient: 'from-red-400 to-rose-600' },
        { icon: FiCalendar, label: 'Total Events', value: stats?.totalEvents, gradient: 'from-violet-400 to-sky-600' },
        { icon: FiFileText, label: 'Total Posts', value: stats?.totalPosts, gradient: 'from-orange-400 to-amber-600' },
        { icon: FiFileText, label: 'Forum Posts', value: stats?.totalForumPosts, gradient: 'from-cyan-500 to-sky-600' },
        { icon: FiMessageSquare, label: 'Messages Today', value: stats?.messagesToday, gradient: 'from-sky-400 to-sky-600' },
    ];

    return (
        <div>
            <div className="flex items-center gap-3 mb-6">
                <FiTrendingUp className="w-5 h-5 text-sky-500" />
                <h2 className="text-lg font-bold text-gray-900">Dashboard Overview</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {cards.map((card, i) => (
                    <StatCard key={i} {...card} loading={loading} />
                ))}
            </div>
        </div>
    );
}
