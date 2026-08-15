import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiGrid, FiList, FiMessageSquare, FiLogOut, FiMenu, FiX, FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import OverviewTab from '../Admin_page/OverviewTab';
import EventsTab from '../Admin_page/EventsTab';
import PostsTab from '../Admin_page/PostsTab';
import UsersTab from '../Admin_page/UsersTab';

export default function ModeratorDashboard() {
    const navigate = useNavigate();
    const { logout, currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('posts');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const tabs = [
        { id: 'posts', label: 'Posts', icon: FiMessageSquare, component: PostsTab },
        { id: 'events', label: 'Events', icon: FiList, component: EventsTab },
        { id: 'users', label: 'Users', icon: FiGrid, component: UsersTab },
    ];

    const ActiveComponent = tabs.find(t => t.id === activeTab)?.component || PostsTab;

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
                className={`fixed lg:sticky top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col z-40 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
            >
                {/* Header */}
                <div className="p-5 border-b border-gray-200 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center shadow-lg">
                            <span className="font-bold text-white">M</span>
                        </div>
                        <div>
                            <h1 className="font-bold text-base leading-tight text-gray-900">Moderator</h1>
                            <p className="text-xs text-gray-400">Panel</p>
                        </div>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100">
                        <FiX size={18} />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto custom-scrollbar">
                    <p className="px-3 text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2 mt-1">Content Moderation</p>
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id); setIsSidebarOpen(false); }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group border ${isActive
                                    ? 'bg-sky-50 text-sky-700 border-sky-100'
                                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 border-transparent'
                                    }`}
                            >
                                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-sky-600' : 'text-gray-400 group-hover:text-gray-700'}`} />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
                <div className="p-4 border-t border-gray-200 shrink-0">
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
                        <span className="font-bold text-gray-900">Moderator Panel</span>
                    </div>
                </div>

                <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full min-h-full">
                    <ActiveComponent />
                </div>
            </main>
        </div>
    );
}
