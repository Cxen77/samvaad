import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiClock, FiCalendar, FiUsers, FiShield, FiPlus, FiTrash2, FiVideo } from 'react-icons/fi';
import { useSamvaad } from '../../context/SamvaadContext';
import NewMeetingModal from './NewMeetingModal';
import toast from 'react-hot-toast';

const TABS = [
  { key: 'today', label: 'Today' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const SchedulerPage = () => {
  const navigate = useNavigate();
  const { 
    getMeetings, 
    getTodayMeetings, 
    getUpcomingMeetings, 
    getCompletedMeetings, 
    getCancelledMeetings, 
    joinMeeting, 
    deleteMeeting 
  } = useSamvaad();

  const [activeTab, setActiveTab] = useState('today');
  const [showSchedule, setShowSchedule] = useState(false);
  const [hideEnded, setHideEnded] = useState(true);

  const handleStartRoom = (roomId) => {
    joinMeeting(roomId);
    navigate(`/samvaad/waiting-room/${roomId}`);
  };

  const handleJoin = (id) => {
    joinMeeting(id);
    navigate(`/samvaad/waiting-room/${id}`);
  };

  const handleDeleteMeeting = (m) => {
    if (!m) return;
    if (window.confirm(`Delete meeting "${m.title}"?`)) {
      deleteMeeting(m.id);
      toast.success('Meeting deleted');
    }
  };

  const rawMeetings = useMemo(() => {
    switch (activeTab) {
      case 'today': return getTodayMeetings();
      case 'upcoming': return getUpcomingMeetings();
      case 'completed': return getCompletedMeetings();
      case 'cancelled': return getCancelledMeetings();
      default: return [];
    }
  }, [activeTab, getTodayMeetings, getUpcomingMeetings, getCompletedMeetings, getCancelledMeetings]);

  // Ended meetings count within the current tab (for tabs like 'today' or 'upcoming')
  const endedMeetingsInTab = useMemo(() => {
    return rawMeetings.filter(m => m.status === 'completed' || m.status === 'ENDED');
  }, [rawMeetings]);

  // Filtered meetings list
  const meetings = useMemo(() => {
    if (activeTab === 'completed') {
      return rawMeetings;
    }
    if (hideEnded) {
      return rawMeetings.filter(m => m.status !== 'completed' && m.status !== 'ENDED');
    }
    return rawMeetings;
  }, [rawMeetings, activeTab, hideEnded]);

  const counts = {
    today: getTodayMeetings().length,
    upcoming: getUpcomingMeetings().length,
    completed: getCompletedMeetings().length,
    cancelled: getCancelledMeetings().length,
  };

  const handleCleanAllEnded = () => {
    const targetList = activeTab === 'completed' ? rawMeetings : endedMeetingsInTab;
    if (targetList.length === 0) {
      toast('No ended meetings to clean', { icon: 'ℹ️' });
      return;
    }

    if (window.confirm(`Clean and delete ${targetList.length} ended meeting${targetList.length > 1 ? 's' : ''}?`)) {
      targetList.forEach(m => deleteMeeting(m.id));
      toast.success(`Cleaned ${targetList.length} ended meeting${targetList.length > 1 ? 's' : ''}`);
    }
  };

  return (
    <div className="h-full bg-white dark:bg-[#0b0f19] text-slate-800 dark:text-slate-100 p-3.5 sm:p-6 overflow-y-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FiClock className="text-sky-600 dark:text-sky-400" size={22} />
            <span>Scheduler</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Administrative hearings and session management
          </p>
        </div>
        <button 
          onClick={() => setShowSchedule(true)} 
          className="flex items-center gap-2 px-3.5 sm:px-4.5 py-2 sm:py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <FiPlus size={16} />
          <span>New Meeting</span>
        </button>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5 mb-4 sm:mb-6">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all text-left cursor-pointer ${
              activeTab === tab.key 
                ? 'border-sky-500/50 bg-sky-50/60 dark:bg-sky-950/30 shadow-xs ring-1 ring-sky-500/30' 
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-[#080d1a] hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{counts[tab.key]}</p>
            <p className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">{tab.label}</p>
          </button>
        ))}
      </div>

      {/* Filter Tabs & Clean Ended Meetings Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.key 
                  ? 'bg-sky-600 text-white shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
              }`}
            >
              {tab.label} ({counts[tab.key]})
            </button>
          ))}
        </div>

        {/* Clean Ended Meetings Options */}
        {activeTab !== 'completed' && endedMeetingsInTab.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>
              {endedMeetingsInTab.length} ended {endedMeetingsInTab.length > 1 ? 'meetings' : 'meeting'}
            </span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <button
              onClick={handleCleanAllEnded}
              className="text-sky-600 dark:text-sky-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              title="Delete all ended meetings in this view"
            >
              <FiTrash2 size={12} />
              <span>Clean All</span>
            </button>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <button
              onClick={() => setHideEnded(!hideEnded)}
              className={`font-semibold cursor-pointer ${hideEnded ? 'text-sky-500' : 'text-slate-400'}`}
            >
              {hideEnded ? 'Hidden' : 'Show'}
            </button>
          </div>
        )}

        {/* Clean all in completed tab */}
        {activeTab === 'completed' && rawMeetings.length > 0 && (
          <button
            onClick={handleCleanAllEnded}
            className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer self-start sm:self-end"
          >
            <FiTrash2 size={13} />
            <span>Clean All Completed</span>
          </button>
        )}
      </div>

      {/* Meeting Cards List */}
      {meetings.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <FiCalendar size={36} className="text-slate-300 dark:text-slate-600 mx-auto" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No {activeTab} meetings found.</p>
          <button 
            onClick={() => setShowSchedule(true)} 
            className="text-xs sm:text-sm text-sky-600 dark:text-sky-400 hover:underline font-semibold cursor-pointer inline-flex items-center gap-1"
          >
            <FiPlus size={14} /> Schedule a meeting
          </button>
        </div>
      ) : (
        <div className="space-y-2.5 sm:space-y-3">
          {meetings.map(m => {
            const isEnded = m.status === 'completed' || m.status === 'ENDED';
            const isLive = m.status === 'active';

            return (
              <div 
                key={m.id} 
                className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 bg-slate-50/70 dark:bg-[#080d1a] rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all gap-3 sm:gap-4 shadow-xs"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] sm:text-xs font-bold ${
                      isEnded 
                        ? 'text-slate-400 dark:text-slate-500' 
                        : isLive 
                          ? 'text-emerald-500 dark:text-emerald-400 animate-pulse' 
                          : 'text-sky-600 dark:text-sky-400'
                    }`}>
                      • {m.status.toUpperCase()}
                    </span>

                    {m.type && (
                      <span className="text-[10px] sm:text-xs text-slate-400 font-medium truncate">
                        {m.type}
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    {m.title}
                  </p>
                  {m.institute && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {m.institute}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 pt-1 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1"><FiCalendar size={12} className="text-slate-400 shrink-0" /> {m.date}</span>
                    <span className="flex items-center gap-1"><FiClock size={12} className="text-slate-400 shrink-0" /> {m.startTime} - {m.endTime}</span>
                    {m.participants && (
                      <span className="flex items-center gap-1"><FiUsers size={12} className="text-slate-400 shrink-0" /> {m.participants.split(',').length} members</span>
                    )}
                    <span className="font-mono text-slate-400 text-[10px]">{m.id}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-slate-800 w-full sm:w-auto justify-end">
                  {/* Delete Meeting Button */}
                  <button
                    onClick={() => handleDeleteMeeting(m)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                    title="Delete Meeting"
                  >
                    <FiTrash2 size={15} />
                  </button>

                  {/* Join Action Button */}
                  {!isEnded && (
                    <button 
                      onClick={() => handleJoin(m.id)} 
                      className="px-4 sm:px-5 py-2 sm:py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <FiVideo size={14} />
                      <span>Join</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <NewMeetingModal 
        isOpen={showSchedule} 
        onClose={() => setShowSchedule(false)} 
        onStartMeeting={handleStartRoom}
        initialTab="schedule"
      />
    </div>
  );
};

export default SchedulerPage;
