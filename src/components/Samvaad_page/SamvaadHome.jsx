import React, { useState, useEffect } from 'react';
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

  const [showAllToday, setShowAllToday] = useState(false);

  const todayMeetings = getTodayMeetings();
  const displayedTodayMeetings = showAllToday ? todayMeetings : todayMeetings.slice(0, 5);
  const hasMoreToday = todayMeetings.length > 5;
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

      {/* Clean Schedule List (Fixed Max 5 + View More) */}
      <div className="max-w-3xl mx-auto w-full px-6 py-8 space-y-6">
        
        {/* Today's Schedule Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <FiClock size={16} className="text-sky-600 dark:text-sky-400" />
              <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                Today's Schedule ({todayMeetings.length})
              </h2>
            </div>
            <button 
              onClick={() => navigate('/calendar')}
              className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1"
            >
              <span>Full Calendar</span>
              <FiChevronRight size={13} />
            </button>
          </div>

          {todayMeetings.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">No meetings scheduled for today.</p>
              <button 
                onClick={() => { setNewMeetingTab('schedule'); setShowNewMeeting(true); }}
                className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
              >
                + Schedule a meeting
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {displayedTodayMeetings.map(m => (
                <div 
                  key={m.id} 
                  className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-slate-800/50 rounded-xl hover:bg-sky-50/40 dark:hover:bg-slate-800 border border-gray-100 dark:border-slate-800/80 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-lg bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 flex flex-col items-center justify-center font-bold text-xs shrink-0">
                      <span>{m.startTime || '10:00'}</span>
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-xs text-slate-800 dark:text-slate-100 truncate">{m.title}</h4>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{m.institute || 'AICTE Hearing'} • ID: {m.id}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleJoin(m.id)} 
                    className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shrink-0 transition-colors shadow-xs"
                  >
                    Join
                  </button>
                </div>
              ))}

              {/* View More / View Less Toggle */}
              {hasMoreToday && (
                <div className="pt-2 text-center border-t border-gray-100 dark:border-slate-800/80">
                  <button
                    onClick={() => setShowAllToday(!showAllToday)}
                    className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1 py-1"
                  >
                    <span>{showAllToday ? 'Show Less' : `View More (${todayMeetings.length - 5} more)`}</span>
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
                className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-medium"
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
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{m.title}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{m.date} • {m.startTime || '10:00 AM'}</p>
                  </div>
                  <FiChevronRight size={14} className="text-slate-400 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Security Footer Note */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 pt-2 pb-4">
          <FiShield size={12} className="text-sky-500" />
          <span>Secure Session • End-to-End Encrypted</span>
        </div>

      </div>

      {/* Modals */}
      <NewMeetingModal 
        isOpen={showNewMeeting} 
        onClose={() => setShowNewMeeting(false)} 
        onStartMeeting={handleStartMeetingRoom}
        initialTab={newMeetingTab}
      />
      <JoinModal isOpen={showJoin} onClose={() => setShowJoin(false)} onJoin={handleJoin} />
      <ShareScreenModal isOpen={showShare} onClose={() => setShowShare(false)} />
    </div>
  );
};

// Clean Action Button (Iconic Zoom Style)
const ActionBtn = ({ icon: Icon, label, color, onClick }) => (
  <div className="flex flex-col items-center gap-2.5 group cursor-pointer" onClick={onClick}>
    <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl ${color} shadow-xs flex items-center justify-center transition-all duration-150 group-hover:scale-105 active:scale-95 text-white`}>
      <Icon size={32} className="md:text-[36px]" />
    </div>
    <span className="text-xs md:text-[13px] text-slate-700 dark:text-slate-300 font-medium text-center">
      {label}
    </span>
  </div>
);

export default SamvaadHome;
