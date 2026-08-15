import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiGrid, FiCalendar, FiLogOut, FiMenu, FiX, FiInfo, FiUsers, FiDownload, FiAward, FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import OrganizerEventsTab from './OrganizerEventsTab';
import OrganizerCreateEventTab from './OrganizerCreateEventTab';
import OrganizerParticipantsTab from './OrganizerParticipantsTab';
import OrganizerExportTab from './OrganizerExportTab';
import OrganizerCertificatesTab from './OrganizerCertificatesTab';

export default function OrganizerDashboard() {
    const navigate = useNavigate();
    const { logout, currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('my_events');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const tabs = [
        { id: 'my_events', label: 'My Events', icon: FiCalendar, component: OrganizerEventsTab },
        { id: 'create_event', label: 'Create Event', icon: FiGrid, component: OrganizerCreateEventTab },
        { id: 'participants', label: 'Participants', icon: FiUsers, component: OrganizerParticipantsTab },
        { id: 'export', label: 'Export Data', icon: FiDownload, component: OrganizerExportTab },
        { id: 'certificates', label: 'Certificates', icon: FiAward, component: OrganizerCertificatesTab },
    ];

    const ActiveComponent = tabs.find(t => t.id === activeTab)?.component || OrganizerEventsTab;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white flex font-sans">
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
                className={`fixed lg:sticky top-0 h-screen w-64 bg-white dark:bg-[#121212] border-r border-gray-200 dark:border-gray-800 flex flex-col z-40 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
            >
                {/* Header */}
                <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center shadow-lg">
                            <span className="font-bold text-white">O</span>
                        </div>
                        <div>
                            <h1 className="font-bold text-base leading-tight text-gray-900 dark:text-white">Organizer</h1>
                            <p className="text-xs text-gray-400">Panel</p>
                        </div>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-black dark:hover:text-white">
                        <FiX size={18} />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto custom-scrollbar">
                    {/* College info banner */}
                    <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800/50 rounded-xl p-3 mb-4">
                        <div className="flex items-center gap-2">
                            <FiInfo className="text-sky-500 shrink-0 w-4 h-4" />
                            <p className="text-xs text-sky-600 dark:text-sky-400 leading-relaxed">
                                Managing events for <span className="font-bold text-gray-900 dark:text-white">{currentUser?.college || 'Your College'}</span>
                            </p>
                        </div>
                    </div>

                    <p className="px-3 text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Menu</p>
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id); setIsSidebarOpen(false); }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group border ${isActive
                                    ? 'bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800/50'
                                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 border-transparent dark:hover:bg-black dark:hover:text-white'
                                    }`}
                            >
                                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-sky-600 dark:text-sky-400' : 'text-gray-400 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-white'}`} />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
                <div className="p-4 border-t border-gray-200 dark:border-gray-800 shrink-0">
                    <button
                        onClick={() => navigate('/')}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-black dark:hover:text-white transition-colors"
                    >
                        <FiArrowLeft size={14} /> Back to Home
                    </button>
                </div>
            </motion.aside>

            {/* Main */}
            <main className="flex-1 min-w-0 bg-gray-50 dark:bg-black flex flex-col" style={{ minHeight: '100vh', overflowX: 'hidden' }}>
                {/* Mobile Top Bar */}
                <div className="lg:hidden sticky top-0 z-30 bg-white dark:bg-[#121212] border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-1 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-black dark:hover:text-white">
                            <FiMenu size={20} />
                        </button>
                        <span className="font-bold text-gray-900 dark:text-white">Organizer Panel</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                        <span className="font-bold text-sky-600 dark:text-sky-400 text-sm">O</span>
                    </div>
                </div>

                <div className="p-4 sm:p-8 max-w-7xl w-full mx-auto">
                    <ActiveComponent />
                </div>
            </main>
        </div>
    );
}
