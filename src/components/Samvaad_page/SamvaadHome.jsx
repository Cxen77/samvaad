import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiVideo, FiPlus, FiCalendar, FiShare2, FiEdit3, 
  FiChevronRight, FiClock, FiShield
} from 'react-icons/fi';
import { useSamvaad } from '../../context/SamvaadContext';
import NewMeetingModal from './NewMeetingModal';
import JoinModal from './JoinModal';
import ShareScreenModal from './ShareScreenModal';

const SamvaadHome = () => {
  const navigate = useNavigate();
  const { getTodayMeetings, getUpcomingMeetings, joinMeeting } = useSamvaad();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNewMeeting, setShowNewMeeting] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [newMeetingTab, setNewMeetingTab] = useState('new');
  const [showAllToday, setShowAllToday] = useState(false);
  const [hideEnded, setHideEnded] = useState(true);

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
    <div className="w-full h-full flex flex-col bg-white dark:bg-[#0b0f19] text-slate-800 dark:text-slate-100 overflow-y-auto transition-colors">
      
      {/* Hero Section — Zoom Style Clock + Action Tiles */}
      <div className="flex flex-col items-center pt-14 pb-10 border-b border-gray-100 dark:border-slate-800/80">
        
        {/* Minimal Large Clock */}
        <div className="text-center mb-10">
          <h1 className="text-5xl md:text-6xl font-semibold text-slate-800 dark:text-white tracking-tight leading-none mb-2">
            {timeString}
          </h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-normal">
            {dateString}
          </p>
        </div>

        {/* Action Buttons (Iconic Zoom Style) */}
        <div className="flex items-start justify-center gap-7 md:gap-9 px-4 flex-wrap">
          
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
            label="AI Notes" 
            color="bg-slate-700 hover:bg-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700" 
            onClick={() => navigate('/notes')} 
          />

        </div>
      </div>

      {/* Clean Schedule List */}
      <div className="max-w-3xl mx-auto w-full px-6 py-8 space-y-6">
        
        {/* Today's Schedule Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FiClock size={16} className="text-sky-600 dark:text-sky-400" />
              <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                Today's Schedule ({activeTodayMeetings.length})
              </h2>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Clean Inline Ended Meetings Indicator */}
              {endedTodayMeetings.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
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
                className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1"
              >
                <span>Full Calendar</span>
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
                className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
              >
                + Schedule a meeting
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {displayedList.map(m => {
                const isEnded = m.status === 'completed' || m.status === 'ENDED';

                return (
                  <div 
                    key={m.id} 
                    className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-slate-800/50 rounded-xl hover:bg-sky-50/40 dark:hover:bg-slate-800 border border-gray-100 dark:border-slate-800/80 transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-lg bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 flex flex-col items-center justify-center font-bold text-xs shrink-0">
                        <span>{m.startTime || '10:00'}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-xs text-slate-800 dark:text-slate-100 truncate">{m.title}</h4>
                          {isEnded && (
                            <span className="text-[10px] font-semibold text-slate-400">
                              • Ended
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{m.institute || 'AICTE Hearing'} • ID: {m.id}</p>
                      </div>
                    </div>

                    {/* Action Button: No Join button if ended */}
                    {isEnded ? (
                      <span className="text-xs font-medium text-slate-400 dark:text-slate-500 py-1.5 px-3">
                        Ended
                      </span>
                    ) : (
                      <button 
                        onClick={() => handleJoin(m.id)} 
                        className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shrink-0 transition-colors shadow-xs cursor-pointer"
                      >
                        Join
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FiCalendar size={15} className="text-slate-400" />
                <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                  Upcoming Meetings
                </h3>
              </div>
              <button 
                onClick={() => navigate('/scheduler')}
                className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-medium cursor-pointer"
              >
                All Meetings
              </button>
            </div>

            <div className="space-y-2">
              {upcomingMeetings.map(m => (
                <div 
                  key={m.id} 
                  onClick={() => handleJoin(m.id)}
                  className="flex items-center justify-between p-3 bg-gray-50/70 dark:bg-slate-800/40 rounded-xl hover:bg-sky-50/30 dark:hover:bg-slate-800 cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sky-600 dark:text-sky-400">{m.startTime}</span>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-100">{m.title}</p>
                      <p className="text-[11px] text-slate-400">{m.date} • {m.institute || 'AICTE Hearing'}</p>
                    </div>
                  </div>
                  <button className="text-sky-600 dark:text-sky-400 font-semibold hover:underline">
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
    className="flex flex-col items-center gap-2 group cursor-pointer"
  >
    <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl ${color} flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-all duration-150`}>
      <Icon size={26} strokeWidth={2} />
    </div>
    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
      {label}
    </span>
  </button>
);

export default SamvaadHome;
