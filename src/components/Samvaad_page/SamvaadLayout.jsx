import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { FiHome, FiCalendar, FiMessageSquare, FiClock, FiGrid, FiMoreHorizontal, FiSettings, FiBell, FiSearch, FiX, FiUser, FiShield, FiLogOut, FiCheck } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useSamvaad } from '../../context/SamvaadContext';

// ---- Sidebar Item ----
const SidebarItem = ({ to, icon: Icon, label, end }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) => `
      flex flex-col items-center justify-center py-2.5 rounded-xl transition-colors duration-200 w-full relative group
      ${isActive
        ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-white'}
    `}
  >
    <Icon size={20} className="mb-1" />
    <span className="text-[10px] font-semibold tracking-wider uppercase">{label}</span>
  </NavLink>
);

const SamvaadLayout = () => {
  const { currentUser, logout } = useAuth();
  const { search, getNotifications, getUnreadCount, markNotificationRead, markAllNotificationsRead, clearNotification } = useSamvaad();
  const navigate = useNavigate();

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);
  const searchResults = searchQuery.length >= 2 ? search(searchQuery) : null;
  const hasResults = searchResults && (searchResults.meetings.length > 0 || searchResults.institutes.length > 0 || searchResults.notes.length > 0);

  // Notifications
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const notifications = getNotifications();
  const unreadCount = getUnreadCount();

  // Profile
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Click outside handlers
  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    try { await logout(); navigate('/login'); } catch (e) { console.error(e); }
  };

  const handleSearchSelect = (type, item) => {
    setSearchQuery('');
    setSearchOpen(false);
    if (type === 'meeting') navigate(`/scheduler`);
    else if (type === 'institute') navigate(`/hub`);
    else if (type === 'note') navigate(`/notes`);
  };

  const notifIcons = {
    upcoming_meeting: '📅', meeting_scheduled: '📋', meeting_completed: '✅', document_uploaded: '📄',
    decision_pending: '⏳', recording_processed: '🎥', security_alert: '🔒', info: 'ℹ️',
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans overflow-hidden">
      {/* Top Bar */}
      <div className="h-16 w-full bg-white dark:bg-slate-900 flex items-center justify-between px-6 shrink-0 z-40 text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="flex items-center gap-2 text-base font-semibold tracking-tight text-slate-800 dark:text-slate-100 shrink-0">
          <span className="text-sky-600 font-bold">AICTE</span>
          <span className="text-slate-400 dark:text-slate-500 font-normal">|</span>
          <span>Samvaad</span>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md mx-8 relative" ref={searchRef}>
          <div className="relative">
            <FiSearch size={16} strokeWidth={1.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search meetings, institutes, notes..."
              className="w-full bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-full py-2 pl-11 pr-8 text-sm outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-sky-500 border border-slate-200/60 dark:border-slate-700/60 transition-all shadow-sm"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setSearchOpen(false); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <FiX size={14} />
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {searchOpen && searchQuery.length >= 2 && (
            <div className="absolute top-full mt-2 w-full bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 max-h-80 overflow-y-auto z-[100]">
              {!hasResults ? (
                <div className="p-6 text-center text-xs text-slate-400">No results found for "{searchQuery}"</div>
              ) : (
                <div className="py-2">
                  {searchResults.meetings.length > 0 && (
                    <div>
                      <p className="px-4 py-1 text-[10px] font-bold text-slate-400 uppercase">Meetings</p>
                      {searchResults.meetings.slice(0, 5).map(m => (
                        <button key={m.id} onClick={() => handleSearchSelect('meeting', m)} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-left">
                          <FiCalendar size={14} className="text-sky-500 shrink-0" />
                          <div className="min-w-0"><p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{m.title}</p><p className="text-[10px] text-slate-400">{m.date} • {m.startTime}</p></div>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.institutes.length > 0 && (
                    <div>
                      <p className="px-4 py-1 text-[10px] font-bold text-slate-400 uppercase border-t border-slate-100 dark:border-slate-800">Institutes</p>
                      {searchResults.institutes.slice(0, 5).map(i => (
                        <button key={i.id} onClick={() => handleSearchSelect('institute', i)} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-left">
                          <FiGrid size={14} className="text-sky-500 shrink-0" />
                          <div className="min-w-0"><p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{i.name}</p><p className="text-[10px] text-slate-400">{i.application}</p></div>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.notes.length > 0 && (
                    <div>
                      <p className="px-4 py-1 text-[10px] font-bold text-slate-400 uppercase border-t border-slate-100 dark:border-slate-800">Notes</p>
                      {searchResults.notes.slice(0, 5).map(n => (
                        <button key={n.id} onClick={() => handleSearchSelect('note', n)} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-left">
                          <FiMessageSquare size={14} className="text-sky-500 shrink-0" />
                          <div className="min-w-0"><p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{n.title}</p><p className="text-[10px] text-slate-400 truncate">{n.content}</p></div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors relative text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400">
              <FiBell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 max-h-[460px] overflow-hidden z-[100]">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="font-semibold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllNotificationsRead} className="text-[11px] text-sky-600 hover:underline font-medium">Mark all read</button>
                  )}
                </div>
                <div className="max-h-[380px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">No notifications</div>
                  ) : (
                    notifications.slice(0, 20).map(n => (
                      <div key={n.id} onClick={() => markNotificationRead(n.id)} className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer border-b border-slate-100 dark:border-slate-800/80 transition-colors ${!n.read ? 'bg-sky-50/40 dark:bg-sky-900/10' : ''}`}>
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs ${!n.read ? 'font-semibold text-slate-800 dark:text-slate-200' : 'text-slate-600 dark:text-slate-400'}`}>{n.title}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 truncate">{n.message}</p>
                          <p className="text-[10px] text-slate-400/80 mt-1">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-1.5 shrink-0" />}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative ml-1" ref={profileRef}>
            <button onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }} className="relative cursor-pointer flex items-center">
              <img src={currentUser?.profilePic || `https://ui-avatars.com/api/?name=${currentUser?.name || 'User'}&background=2563eb&color=fff`} alt="Profile" className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 hover:border-sky-500 transition-colors" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-60 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 z-[100] overflow-hidden">
                <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2.5">
                    <img src={currentUser?.profilePic || `https://ui-avatars.com/api/?name=${currentUser?.name || 'User'}&background=2563eb&color=fff`} alt="" className="w-9 h-9 rounded-full" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{currentUser?.name || 'AICTE Official'}</p>
                      <p className="text-[11px] text-slate-400 truncate">{currentUser?.email || 'official@aicte.gov.in'}</p>
                    </div>
                  </div>
                </div>
                <div className="py-1">
                  <button onClick={() => { navigate('/profile'); setProfileOpen(false); }} className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-300"><FiUser size={14} />Profile</button>
                  <button onClick={() => { navigate('/more'); setProfileOpen(false); }} className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-300"><FiShield size={14} />Security</button>
                  <button onClick={() => { navigate('/settings'); setProfileOpen(false); }} className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-300"><FiSettings size={14} />Settings</button>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-800">
                  <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs text-red-600 dark:text-red-400"><FiLogOut size={14} />Sign Out</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-[76px] bg-white dark:bg-[#080d1a] flex flex-col items-center py-2 shrink-0 z-50 border-r border-slate-200 dark:border-slate-800 transition-colors">
          <div className="flex flex-col gap-2 w-full px-2">
            <SidebarItem to="/" icon={FiHome} label="Home" end />
            <SidebarItem to="/calendar" icon={FiCalendar} label="Calendar" />
            <SidebarItem to="/chat" icon={FiMessageSquare} label="Chat" />
            <SidebarItem to="/scheduler" icon={FiClock} label="Scheduler" />
            <SidebarItem to="/hub" icon={FiGrid} label="Hub" />
            <SidebarItem to="/more" icon={FiMoreHorizontal} label="More" />
          </div>

          <div className="mt-auto flex flex-col gap-2 w-full px-2 mb-2">
            <SidebarItem to="/settings" icon={FiSettings} label="Settings" />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-50 dark:bg-[#0b0f19]">
          {/* Page Content */}
          <div className="flex-1 overflow-auto relative bg-slate-50 dark:bg-[#0b0f19]">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SamvaadLayout;
