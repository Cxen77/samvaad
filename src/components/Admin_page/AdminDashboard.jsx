import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiGrid, FiUsers, FiCalendar, FiFileText, FiMessageCircle, FiToggleRight, FiClock, FiArrowLeft, FiShield, FiMenu, FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import OverviewTab from './OverviewTab';
import UsersTab from './UsersTab';
import EventsTab from './EventsTab';
import PostsTab from './PostsTab';
import ForumsTab from './ForumsTab';
import SettingsTab from './SettingsTab';
import LogsTab from './LogsTab';
import CollegesTab from './CollegesTab';
import VerificationsTab from './VerificationsTab';
import './admin.css';

const ALL_TABS = [
    { id: 'overview', label: 'Overview', icon: FiGrid, component: OverviewTab },
    { id: 'users', label: 'Users', icon: FiUsers, component: UsersTab },
    { id: 'verifications', label: 'Verifications', icon: FiShield, component: VerificationsTab },
    { id: 'events', label: 'Events', icon: FiCalendar, component: EventsTab },
    { id: 'posts', label: 'Posts', icon: FiFileText, component: PostsTab },
    { id: 'forums', label: 'Forums', icon: FiMessageCircle, component: ForumsTab },
    { id: 'settings', label: 'Flags', icon: FiToggleRight, component: SettingsTab },
    { id: 'logs', label: 'Logs', icon: FiClock, component: LogsTab },
    { id: 'colleges', label: 'Colleges', icon: FiShield, component: CollegesTab },
];

const MODERATOR_TAB_IDS = ['overview', 'events', 'posts', 'forums', 'verifications'];

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('overview');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const visibleTabs = ALL_TABS.filter(tab => {
        if (currentUser?.role === 'admin') return true;
        if (currentUser?.role === 'moderator') return MODERATOR_TAB_IDS.includes(tab.id);
        return false;
    });

    const safeActiveTab = visibleTabs.find(t => t.id === activeTab) ? activeTab : visibleTabs[0]?.id || 'overview';
    const ActiveComponent = visibleTabs.find(t => t.id === safeActiveTab)?.component || OverviewTab;

    const isAdmin = currentUser?.role === 'admin';
    const panelTitle = isAdmin ? 'Admin' : 'Moderator';

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 flex font-sans">
            {/* Mobile Overlay */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.aside
                className={`fixed lg:sticky top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col z-50 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
            >
                {/* Header */}
                <div className="p-5 border-b border-gray-200 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-lg ${isAdmin ? 'bg-gradient-to-br from-sky-600 to-sky-700' : 'bg-gradient-to-br from-sky-500 to-sky-600'}`}>
                            <FiShield className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-base leading-tight text-gray-900">{panelTitle}</h1>
                            <p className="text-xs text-gray-400">Control Panel</p>
                        </div>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100">
                        <FiX size={18} />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto custom-scrollbar">
                    <p className="px-3 text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2 mt-1">
                        {isAdmin ? 'Administration' : 'Moderation'}
                    </p>
                    {visibleTabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = safeActiveTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id); setIsSidebarOpen(false); }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive
                                    ? isAdmin
                                        ? 'bg-sky-50 text-sky-700 border border-sky-100'
                                        : 'bg-sky-50 text-sky-700 border border-sky-100'
                                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 border border-transparent'
                                    }`}
                            >
                                <Icon className={`w-4 h-4 shrink-0 ${isActive
                                    ? isAdmin ? 'text-sky-600' : 'text-sky-600'
                                    : 'text-gray-400 group-hover:text-gray-700'
                                    }`}
                                />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 shrink-0">
                    <div className="flex items-center gap-3 px-1 mb-3">
                        <img
                            src={currentUser?.profilePic || `https://ui-avatars.com/api/?name=${currentUser?.name}&background=random`}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover border border-gray-200"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{currentUser?.name}</p>
                            <p className="text-xs text-gray-400 capitalize truncate">{currentUser?.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                    >
                        <FiArrowLeft size={14} /> Back to Home
                    </button>
                </div>
            </motion.aside>

            {/* Main */}
            <main className="flex-1 min-w-0 bg-gray-50 flex flex-col" style={{ minHeight: '100vh', overflowX: 'hidden' }}>
                {/* Mobile Top Bar */}
                <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-1 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100">
                            <FiMenu size={20} />
                        </button>
                        <span className="font-bold text-gray-900">{panelTitle} Panel</span>
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isAdmin ? 'bg-sky-100' : 'bg-sky-100'}`}>
                        <FiShield className={`w-4 h-4 ${isAdmin ? 'text-sky-600' : 'text-sky-600'}`} />
                    </div>
                </div>

                <div className="p-4 sm:p-8 max-w-7xl w-full mx-auto">
                    <div key={safeActiveTab} className="admin-fade-in">
                        <ActiveComponent />
                    </div>
                </div>
            </main>
        </div>
    );
}
