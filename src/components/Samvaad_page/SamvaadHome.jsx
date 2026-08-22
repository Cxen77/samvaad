import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiVideo, FiPlus, FiCalendar, FiShare2, FiEdit3, 
  FiChevronRight, FiClock, FiShield, FiSearch, FiX, FiGrid, FiMessageSquare
} from 'react-icons/fi';
import { useSamvaad } from '../../context/SamvaadContext';
import NewMeetingModal from './NewMeetingModal';
import JoinModal from './JoinModal';
import ShareScreenModal from './ShareScreenModal';

const SamvaadHome = () => {
  const navigate = useNavigate();
  const { getTodayMeetings, getUpcomingMeetings, joinMeeting, search } = useSamvaad();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNewMeeting, setShowNewMeeting] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [newMeetingTab, setNewMeetingTab] = useState('new');
  const [showAllToday, setShowAllToday] = useState(false);
  const [hideEnded, setHideEnded] = useState(true);

  // Search state for Mobile Search Box below Timer
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);
  const searchResults = searchQuery.length >= 2 ? search(searchQuery) : null;
  const hasResults = searchResults && (searchResults.meetings.length > 0 || searchResults.institutes.length > 0 || searchResults.notes.length > 0);

  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearchSelect = (type, item) => {
    setSearchQuery('');
    setSearchOpen(false);
    if (type === 'meeting') navigate(`/scheduler`);
    else if (type === 'institute') navigate(`/hub`);
    else if (type === 'note') navigate(`/notes`);
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const dateString = currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const handleStartMeetingRoom = (roomId) => {
    joinMeeting(roomId);
    navigate(`/samvaad/waiting-room/${roomId}`);
  };

  const handleJoin = (meetingId) => {
    joinMeeting(meetingId);
    navigate(`/samvaad/waiting-room/${meetingId}`);
  };

  const allTodayMeetings = getTodayMeetings();
  
  const endedTodayMeetings = useMemo(() => {
    return allTodayMeetings.filter(m => m.status === 'completed' || m.status === 'ENDED');
  }, [allTodayMeetings]);

  const activeTodayMeetings = useMemo(() => {
    return allTodayMeetings.filter(m => m.status !== 'completed' && m.status !== 'ENDED');
  }, [allTodayMeetings]);

  const displayedList = useMemo(() => {
    const baseList = hideEnded ? activeTodayMeetings : allTodayMeetings;
    return showAllToday ? baseList : baseList.slice(0, 5);
  }, [hideEnded, activeTodayMeetings, allTodayMeetings, showAllToday]);

  const hasMoreToday = (hideEnded ? activeTodayMeetings.length : allTodayMeetings.length) > 5;
  const upcomingMeetings = getUpcomingMeetings().slice(0, 3);

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-[#0b0f19] text-slate-800 dark:text-slate-100 overflow-y-auto transition-colors font-sans">
      
      {/* Hero Section — Clock + Mobile Search Box + Action Shortcuts */}
      <div className="flex flex-col items-center pt-6 sm:pt-12 pb-6 sm:pb-10 border-b border-gray-100 dark:border-slate-800/80 px-3">
        
        {/* Large Clock Display */}
        <div className="text-center mb-4 sm:mb-9">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold text-slate-800 dark:text-white tracking-tight leading-none mb-1 sm:mb-2">
            {timeString}
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-slate-500 dark:text-slate-400 font-normal">
            {dateString}
          </p>
        </div>

        {/* Mobile-Only Search Box (Positioned cleanly below Timer & Date) */}
        <div className="md:hidden w-full max-w-md px-1 mb-5 relative" ref={searchRef}>
          <div className="relative flex items-center">
            <FiSearch 
              size={15} 
              strokeWidth={2} 
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sky-600 dark:text-sky-400 pointer-events-none" 
            />
            <input
              type="text"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search meetings, notes, institutes..."
              className="w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl py-2.5 pl-9 pr-8 text-xs font-medium outline-none focus:bg-white dark:focus:bg-black focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 border border-slate-200 dark:border-slate-800 transition-all shadow-xs"
            />
            {searchQuery && (
              <button 
                onClick={() => { setSearchQuery(''); setSearchOpen(false); }} 
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                title="Clear search"
              >
                <FiX size={13} />
              </button>
            )}
          </div>

          {/* Search Results Dropdown for Mobile */}
          {searchOpen && searchQuery.length >= 2 && (
            <div className="absolute top-full left-1 right-1 mt-1.5 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-72 overflow-y-auto z-[100]">
              {!hasResults ? (
                <div className="p-4 text-center text-xs text-slate-400">No results found for "{searchQuery}"</div>
              ) : (
                <div className="py-2">
                  {searchResults.meetings.length > 0 && (
                    <div>
                      <p className="px-3.5 py-1 text-[10px] font-bold text-slate-400 uppercase">Meetings</p>
                      {searchResults.meetings.slice(0, 4).map(m => (
                        <button key={m.id} onClick={() => handleSearchSelect('meeting', m)} className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-left cursor-pointer transition-colors">
                          <FiCalendar size={13} className="text-sky-500 shrink-0" />
                          <div className="min-w-0"><p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{m.title}</p><p className="text-[10px] text-slate-400">{m.date} • {m.startTime}</p></div>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.institutes.length > 0 && (
                    <div>
                      <p className="px-3.5 py-1 text-[10px] font-bold text-slate-400 uppercase border-t border-slate-100 dark:border-slate-800">Institutes</p>
                      {searchResults.institutes.slice(0, 4).map(i => (
                        <button key={i.id} onClick={() => handleSearchSelect('institute', i)} className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-left cursor-pointer transition-colors">
                          <FiGrid size={13} className="text-sky-500 shrink-0" />
                          <div className="min-w-0"><p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{i.name}</p><p className="text-[10px] text-slate-400">{i.application}</p></div>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.notes.length > 0 && (
                    <div>
                      <p className="px-3.5 py-1 text-[10px] font-bold text-slate-400 uppercase border-t border-slate-100 dark:border-slate-800">Notes</p>
                      {searchResults.notes.slice(0, 4).map(n => (
                        <button key={n.id} onClick={() => handleSearchSelect('note', n)} className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-left cursor-pointer transition-colors">
                          <FiMessageSquare size={13} className="text-sky-500 shrink-0" />
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

        {/* Action Shortcuts Dock (5-Item Responsive Grid on Mobile, Flex on Desktop) */}
        <div className="grid grid-cols-5 gap-1.5 xs:gap-3 sm:flex sm:items-start sm:justify-center sm:gap-7 md:gap-9 max-w-xl mx-auto w-full px-1 sm:px-4">
          
          <ActionBtn 
            icon={FiVideo} 
            label="New Meeting" 
            color="bg-[#FF742E] hover:bg-[#e86624]" 
            onClick={() => { setNewMeetingTab('new'); setShowNewMeeting(true); }} 
          />

          <ActionBtn 
            icon={FiPlus} 
            label="Join" 
            color="bg-[#0E72ED] hover:bg-[#0c62ce]" 
            onClick={() => setShowJoin(true)} 
          />

          <ActionBtn 
            icon={FiCalendar} 
            label="Schedule" 
            color="bg-[#0E72ED] hover:bg-[#0c62ce]" 
            onClick={() => { setNewMeetingTab('schedule'); setShowNewMeeting(true); }} 
          />

          <ActionBtn 
            icon={FiShare2} 
            label="Share screen" 
            color="bg-[#0E72ED] hover:bg-[#0c62ce]" 
            onClick={() => setShowShare(true)} 
          />

          <ActionBtn 
            icon={FiEdit3} 
            label="Notes" 
            color="bg-slate-700 hover:bg-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700" 
            onClick={() => navigate('/notes')} 
          />

        </div>
      </div>

      {/* Clean Schedule List */}
      <div className="max-w-3xl mx-auto w-full px-3.5 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6">
        
        {/* Today's Schedule Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-slate-800 p-4 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-3.5 sm:mb-4">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <FiClock size={16} className="text-sky-600 dark:text-sky-400 shrink-0" />
              <h2 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider truncate">
                Today's Schedule ({activeTodayMeetings.length})
              </h2>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Ended Meetings Indicator */}
              {endedTodayMeetings.length > 0 && (
                <div className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs text-slate-400">
                  <span>{endedTodayMeetings.length} ended</span>
                  <span>•</span>
                  <button
                    onClick={() => setHideEnded(!hideEnded)}
                    className={`font-semibold cursor-pointer ${hideEnded ? 'text-slate-400 hover:text-sky-500' : 'text-sky-500'}`}
                  >
                    {hideEnded ? 'Show' : 'Hidden'}
                  </button>
                </div>
              )}

              <button 
                onClick={() => navigate('/calendar')}
                className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-0.5 sm:gap-1"
              >
                <span>Calendar</span>
                <FiChevronRight size={13} />
              </button>
            </div>
          </div>

          {displayedList.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">
                {activeTodayMeetings.length === 0 && endedTodayMeetings.length > 0 && hideEnded
                  ? "All meetings for today have ended."
                  : "No meetings scheduled for today."}
              </p>
              <button 
                onClick={() => { setNewMeetingTab('schedule'); setShowNewMeeting(true); }}
                className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                <FiPlus size={13} /> Schedule a meeting
              </button>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-2.5">
              {displayedList.map(m => {
                const isEnded = m.status === 'completed' || m.status === 'ENDED';
                const isLive = m.status === 'active';

                return (
                  <div 
                    key={m.id} 
                    className="flex items-center justify-between p-2.5 sm:p-3.5 bg-gray-50 dark:bg-slate-800/50 rounded-xl hover:bg-sky-50/40 dark:hover:bg-slate-800 border border-gray-100 dark:border-slate-800/80 transition-colors gap-2.5 sm:gap-3.5"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 flex flex-col items-center justify-center font-bold text-[11px] sm:text-xs shrink-0">
                        <span>{m.startTime || '10:00'}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <h4 className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-100 truncate">
                            {m.title}
                          </h4>
                          {isEnded && (
                            <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                              • Ended
                            </span>
                          )}
                          {isLive && (
                            <span className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400 shrink-0 animate-pulse">
                              • LIVE
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] sm:text-[11px] text-slate-400 truncate mt-0.5">
                          {m.institute || 'AICTE Session'} • ID: {m.id}
                        </p>
                      </div>
                    </div>

                    {/* Action Button */}
                    {isEnded ? (
                      <span className="text-[11px] sm:text-xs font-medium text-slate-400 dark:text-slate-500 py-1 px-2 shrink-0">
                        Ended
                      </span>
                    ) : (
                      <button 
                        onClick={() => handleJoin(m.id)} 
                        className="px-3 sm:px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shrink-0 transition-colors shadow-xs cursor-pointer flex items-center gap-1"
                      >
                        <FiVideo size={13} />
                        <span>Join</span>
                      </button>
                    )}
                  </div>
                );
              })}

              {/* View More / View Less Toggle */}
              {hasMoreToday && (
                <div className="pt-2 text-center border-t border-gray-100 dark:border-slate-800/80">
                  <button
                    onClick={() => setShowAllToday(!showAllToday)}
                    className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1 py-1 cursor-pointer"
                  >
                    <span>{showAllToday ? 'Show Less' : `View More (${(hideEnded ? activeTodayMeetings.length : allTodayMeetings.length) - 5} more)`}</span>
                    <FiChevronRight size={13} className={`transition-transform duration-200 ${showAllToday ? '-rotate-90' : 'rotate-90'}`} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Upcoming Section */}
        {upcomingMeetings.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-slate-800 p-4 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-3.5 sm:mb-4">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <FiCalendar size={15} className="text-slate-400 shrink-0" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider truncate">
                  Upcoming Meetings
                </h3>
              </div>
              <button 
                onClick={() => navigate('/scheduler')}
                className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-medium cursor-pointer shrink-0"
              >
                All Meetings
              </button>
            </div>

            <div className="space-y-2">
              {upcomingMeetings.map(m => (
                <div 
                  key={m.id} 
                  onClick={() => handleJoin(m.id)}
                  className="flex items-center justify-between p-2.5 sm:p-3 bg-gray-50/70 dark:bg-slate-800/40 rounded-xl hover:bg-sky-50/30 dark:hover:bg-slate-800 cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all text-xs gap-2"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <span className="font-bold text-sky-600 dark:text-sky-400 shrink-0">{m.startTime}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">{m.title}</p>
                      <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">{m.date} • {m.institute || 'AICTE Hearing'}</p>
                    </div>
                  </div>
                  <button className="text-sky-600 dark:text-sky-400 font-semibold hover:underline shrink-0">
                    Join
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Modals */}
      <NewMeetingModal 
        isOpen={showNewMeeting} 
        onClose={() => setShowNewMeeting(false)} 
        onStartMeeting={handleStartMeetingRoom}
        initialTab={newMeetingTab}
      />

      <JoinModal 
        isOpen={showJoin} 
        onClose={() => setShowJoin(false)} 
        onJoin={handleJoin}
      />

      <ShareScreenModal 
        isOpen={showShare} 
        onClose={() => setShowShare(false)} 
      />

    </div>
  );
};

// Reusable Action Button (Zoom Style)
const ActionBtn = ({ icon: Icon, label, color, onClick }) => (
  <button 
    onClick={onClick}
    className="flex flex-col items-center gap-1.5 sm:gap-2 group cursor-pointer w-full sm:w-auto"
  >
    <div className={`w-12 h-12 xs:w-13 xs:h-13 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl ${color} flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-all duration-150 shrink-0`}>
      <Icon className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2} />
    </div>
    <span className="text-[10px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors text-center truncate max-w-[58px] xs:max-w-[70px] sm:max-w-none">
      {label}
    </span>
  </button>
);

export default SamvaadHome;
