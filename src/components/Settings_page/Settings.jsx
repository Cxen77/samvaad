import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
    User,
    Shield,
    Bell,
    Eye,
    AlertTriangle,
    LogOut,
    Briefcase,
    Zap,
    Monitor,
    ChevronRight,
    Menu,
    FileText
} from 'lucide-react';
import { ToastProvider } from '../common/Toast';
import AccountSettings from './sections/AccountSettings';
import ProfileSettings from './sections/ProfileSettings';
import PrivacySettings from './sections/PrivacySettings';
import NotificationSettings from './sections/NotificationSettings';
import AutoTeamSettings from './sections/AutoTeamSettings';
import InterfaceSettings from './sections/InterfaceSettings';
import { SecuritySettings, DangerZone } from './sections/SecuritySettings';
import LegalSettings from './sections/LegalSettings';

const Settings = () => {
    const { currentUser } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    // Parse query param or default to 'account'
    const getInitialSection = () => {
        const searchParams = new URLSearchParams(location.search);
        return searchParams.get('section') || 'account';
    };

    const [activeSection, setActiveSection] = useState(getInitialSection());
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showMobileMenu, setShowMobileMenu] = useState(true);

    // Sync state with URL
    useEffect(() => {
        const section = getInitialSection();
        if (section !== activeSection) {
            setActiveSection(section);
        }
    }, [location.search]);

    // Update URL when section changes
    const handleSectionChange = (sectionId) => {
        navigate(`?section=${sectionId}`, { replace: true });
        setActiveSection(sectionId);
        setShowMobileMenu(false); // Close menu on mobile selection
    };

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data } = await api.get('/users/profile');
                setUser(data);
            } catch (err) {
                console.error("Failed to fetch profile", err);
                if (currentUser) {
                    setUser({
                        name: currentUser.displayName,
                        email: currentUser.email,
                        username: currentUser.email?.split('@')[0],
                        profilePic: currentUser.photoURL,
                        bio: "Welcome to your settings!",
                        socials: {},
                        settings: {}
                    });
                }
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [currentUser]);

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout');
            navigate('/login');
        } catch (err) {
            console.error("Logout failed", err);
            navigate('/login');
        }
    };

    const menuItems = [
        {
            id: 'account',
            label: 'Account',
            icon: User,
            description: "Manage your personal account information."
        },
        {
            id: 'profile',
            label: 'Profile',
            icon: Briefcase,
            description: "Customize how others see you on Samvaad."
        },
        {
            id: 'privacy',
            label: 'Privacy',
            icon: Eye,
            description: "Control who can see your profile and contact you."
        },
        {
            id: 'notifications',
            label: 'Notifications',
            icon: Bell,
            description: "Manage how you receive updates and alerts."
        },
        {
            id: 'autoteam',
            label: 'Auto-Team',
            icon: Zap,
            description: "Configure matchmaking preferences for teams.",
            badge: "New"
        },
        {
            id: 'interface',
            label: 'Interface',
            icon: Monitor,
            description: "Customize your app experience."
        },
        {
            id: 'security',
            label: 'Security',
            icon: Shield,
            description: "Keep your account safe and secure."
        },
        {
            id: 'danger',
            label: 'Danger Zone',
            icon: AlertTriangle,
            description: "Irreversible and destructive actions."
        },
        {
            id: 'legal',
            label: 'Legal',
            icon: FileText,
            description: "Review our policies and terms of service."
        },
    ];

    const activeItem = menuItems.find(item => item.id === activeSection);

    const renderSection = () => {
        if (loading) return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
            </div>
        );
        if (!user) return <div className="p-8 text-center text-gray-500">Failed to load user data.</div>;

        switch (activeSection) {
            case 'account': return <AccountSettings user={user} setUser={setUser} />;
            case 'profile': return <ProfileSettings user={user} setUser={setUser} />;
            case 'privacy': return <PrivacySettings user={user} setUser={setUser} />;
            case 'notifications': return <NotificationSettings user={user} setUser={setUser} />;
            case 'autoteam': return <AutoTeamSettings user={user} setUser={setUser} />;
            case 'interface': return <InterfaceSettings user={user} setUser={setUser} />;
            case 'security': return <SecuritySettings />;
            case 'danger': return <DangerZone />;
            case 'legal': return <LegalSettings />;
            default: return <AccountSettings user={user} setUser={setUser} />;
        }
    };

    return (
        <ToastProvider>
            {/* Full Height Container with Zero Gap Below Navbar */}
            <div className="w-full h-full flex bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100 overflow-hidden">
                {/* Sidebar */}
                <div className={`${showMobileMenu ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} fixed md:static top-0 bottom-0 inset-x-0 md:inset-auto z-40 bg-white dark:bg-slate-900 md:bg-transparent transition-transform duration-300 ease-in-out md:flex w-full md:w-80 flex-shrink-0 flex-col md:border-r border-gray-200 dark:border-slate-800 overflow-hidden h-full z-[100]`}>
                    <div className="p-4 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10 flex items-center justify-between md:hidden">
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h1>
                        <button onClick={() => setShowMobileMenu(false)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="bg-white dark:bg-slate-900 h-full flex flex-col">
                        <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
                            {['admin', 'moderator', 'organizer'].includes(currentUser?.role) && (
                                <div className="md:hidden pb-2 mb-2 border-b border-gray-100 dark:border-slate-800">
                                    <button
                                        onClick={() => {
                                            const role = currentUser?.role;
                                            window.location.href = role === 'organizer' ? '/organizer' : role === 'moderator' ? '/moderator' : '/admin';
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                                    >
                                        <div className="p-1.5 rounded-lg transition-colors bg-gray-100 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700">
                                            <Shield size={18} strokeWidth={2} />
                                        </div>
                                        <span className="flex-1 text-left">
                                            {currentUser?.role === 'admin' ? 'Admin Panel' : currentUser?.role === 'moderator' ? 'Mod Panel' : 'Organizer Panel'}
                                        </span>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="m9 18 6-6-6-6" /></svg>
                                    </button>
                                </div>
                            )}

                            {menuItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleSectionChange(item.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${activeSection === item.id
                                        ? item.activeClassName || 'bg-sky-50 dark:bg-slate-800 text-sky-700 dark:text-sky-400 font-bold shadow-sm'
                                        : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/60 hover:text-gray-900 dark:hover:text-white'
                                        } ${item.className || ''}`}
                                >
                                    <div className={`p-1.5 rounded-lg transition-colors ${activeSection === item.id ? 'bg-white dark:bg-slate-700' : 'bg-gray-100 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700'}`}>
                                        <item.icon size={18} strokeWidth={2} />
                                    </div>
                                    <span className="flex-1 text-left">{item.label}</span>
                                    {item.badge && <span className="px-2 py-0.5 bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 text-[10px] font-bold uppercase rounded-full tracking-wider">{item.badge}</span>}
                                    {activeSection === item.id && <ChevronRight size={16} className="text-sky-400" />}
                                </button>
                            ))}
                        </nav>

                        {/* Fixed Logout Section */}
                        <div className="p-3 border-t border-gray-100 dark:border-slate-800 mt-auto bg-white dark:bg-slate-900">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 group"
                            >
                                <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 group-hover:bg-red-100 dark:group-hover:bg-red-900/50 transition-colors">
                                    <LogOut size={18} strokeWidth={2} />
                                </div>
                                <span className="flex-1 text-left">Log Out</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className={`${activeSection && !showMobileMenu ? 'flex' : 'hidden md:flex'} flex-1 bg-white dark:bg-slate-900 overflow-hidden flex-col h-full z-20`}>
                    {/* Mobile Header */}
                    <div className="px-4 py-4 md:hidden bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 flex items-center gap-3 sticky top-0 z-10">
                        <button
                            onClick={() => setShowMobileMenu(true)}
                            className="p-2 -ml-2 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition"
                        >
                            <Menu size={24} />
                        </button>
                        <span className="font-bold text-lg text-gray-900 dark:text-white">{activeItem?.label}</span>
                    </div>

                    {/* Desktop Header */}
                    <div className="hidden md:flex px-8 py-5 border-b border-gray-100 dark:border-slate-800 items-center justify-between bg-white dark:bg-slate-900">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-0.5">
                                {activeItem?.label || 'Settings'}
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-slate-400">
                                {activeItem?.description || 'Manage your settings'}
                            </p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar scroll-smooth">
                        <div className="max-w-3xl mx-auto md:mx-0">
                            {renderSection()}
                        </div>
                    </div>
                </div>
            </div>
        </ToastProvider>
    );
};

export default Settings;
