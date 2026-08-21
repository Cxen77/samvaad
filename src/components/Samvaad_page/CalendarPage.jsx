import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiChevronLeft, FiChevronRight, FiPlus, FiClock, 
  FiShield, FiTrash2, FiCalendar, FiVideo, FiUsers 
} from 'react-icons/fi';
import { useSamvaad } from '../../context/SamvaadContext';
import NewMeetingModal from './NewMeetingModal';
import toast from 'react-hot-toast';

const CalendarPage = () => {
  const navigate = useNavigate();
  const { getMeetings, deleteMeeting, joinMeeting } = useSamvaad();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showSchedule, setShowSchedule] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);

  const handleStartRoom = (roomId) => {
    joinMeeting(roomId);
    navigate(`/samvaad/waiting-room/${roomId}`);
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const meetings = getMeetings();
  const fmt = (d) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const meetingsForDate = (d) => meetings.filter(m => m.date === d && m.status !== 'cancelled');

  const selectedMeetings = meetingsForDate(selectedDate);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => { setCurrentDate(new Date()); setSelectedDate(new Date().toISOString().split('T')[0]); };

  const handleDelete = (id) => {
    if (window.confirm('Cancel this meeting?')) {
      deleteMeeting(id);
      toast.success('Meeting cancelled');
      setSelectedMeeting(null);
    }
  };

  const handleJoin = (id) => {
    joinMeeting(id);
    navigate(`/samvaad/waiting-room/${id}`);
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="flex flex-col lg:flex-row h-full bg-white dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 overflow-y-auto lg:overflow-hidden font-sans">
      {/* Calendar Grid Section */}
      <div className="flex-1 p-3.5 sm:p-6 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FiCalendar className="text-sky-600 dark:text-sky-400" size={22} />
              <span>Calendar</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              View and organize upcoming AICTE committee hearings & sessions
            </p>
          </div>
          <button 
            onClick={() => setShowSchedule(true)} 
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer self-start sm:self-auto"
          >
            <FiPlus size={16} />
            <span>Schedule Meeting</span>
          </button>
        </div>

        {/* Month Navigation Toolbar */}
        <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4 bg-slate-50/60 dark:bg-[#080d1a] border border-slate-200 dark:border-slate-800 p-2 sm:p-3 rounded-2xl">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button 
              onClick={goToday} 
              className="px-2.5 sm:px-3 py-1 sm:py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-xs sm:text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            >
              Today
            </button>
            <button 
              onClick={prevMonth} 
              className="p-1.5 sm:p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors text-slate-600 dark:text-slate-300"
              title="Previous Month"
            >
              <FiChevronLeft size={16} />
            </button>
            <button 
              onClick={nextMonth} 
              className="p-1.5 sm:p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors text-slate-600 dark:text-slate-300"
              title="Next Month"
            >
              <FiChevronRight size={16} />
            </button>
          </div>
          <h2 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white truncate">
            {monthName}
          </h2>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 mb-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center text-[10px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500 py-1 sm:py-2 uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Days Matrix */}
        <div className="grid grid-cols-7 border-t border-l border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          {/* Empty padding cells before first day */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div 
              key={'e' + i} 
              className="border-r border-b border-slate-200 dark:border-slate-800 p-1 sm:p-2 min-h-[48px] sm:min-h-[75px] bg-slate-50/40 dark:bg-slate-900/20" 
            />
          ))}

          {/* Active day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = fmt(day);
            const dayMeetings = meetingsForDate(dateStr);
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDate;

            return (
              <div
                key={day}
                onClick={() => {
                  setSelectedDate(dateStr);
                  setSelectedMeeting(null);
                }}
                className={`border-r border-b border-slate-200 dark:border-slate-800 p-1 sm:p-2 min-h-[48px] sm:min-h-[75px] cursor-pointer transition-all ${
                  isSelected 
                    ? 'bg-sky-50 dark:bg-sky-950/40 ring-1 ring-inset ring-sky-500' 
                    : 'bg-white dark:bg-[#080d1a] hover:bg-slate-50 dark:hover:bg-slate-900/50'
                }`}
              >
                <div className={`text-[11px] sm:text-xs font-bold mb-1 w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full ${
                  isToday 
                    ? 'bg-sky-600 text-white shadow-xs' 
                    : isSelected
                      ? 'text-sky-600 dark:text-sky-400'
                      : 'text-slate-700 dark:text-slate-300'
                }`}>
                  {day}
                </div>

                {/* Mobile indicators: Compact dots */}
                <div className="flex sm:hidden gap-1 justify-center flex-wrap">
                  {dayMeetings.slice(0, 3).map(m => (
                    <span 
                      key={m.id} 
                      className={`w-1.5 h-1.5 rounded-full ${
                        m.status === 'active' 
                          ? 'bg-emerald-500 animate-pulse' 
                          : 'bg-sky-500'
                      }`} 
                    />
                  ))}
                  {dayMeetings.length > 3 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  )}
                </div>

                {/* Desktop items: Title tags */}
                <div className="hidden sm:block space-y-0.5">
                  {dayMeetings.slice(0, 2).map(m => (
                    <div 
                      key={m.id} 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setSelectedMeeting(m); 
                        setSelectedDate(dateStr); 
                      }} 
                      className={`text-[10px] px-1.5 py-0.5 rounded truncate cursor-pointer font-medium transition-colors ${
                        m.status === 'completed' 
                          ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' 
                          : m.status === 'active'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold'
                            : 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300'
                      }`}
                    >
                      {m.startTime} {m.title}
                    </div>
                  ))}
                  {dayMeetings.length > 2 && (
                    <p className="text-[9px] text-slate-400 font-semibold pl-1">
                      +{dayMeetings.length - 2} more
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Date Details / Bottom Drawer on Mobile */}
      <div className="w-full lg:w-80 xl:w-96 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#080d1a] p-4 sm:p-5 overflow-y-auto shrink-0">
        {selectedMeeting ? (
          /* Single Meeting Detail View */
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <FiClock size={16} className="text-sky-600 dark:text-sky-400" />
                <span>Meeting Details</span>
              </h3>
              <button 
                onClick={() => setSelectedMeeting(null)} 
                className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-semibold cursor-pointer"
              >
                ← Back to List
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  selectedMeeting.status === 'completed' 
                    ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' 
                    : selectedMeeting.status === 'active'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300'
                }`}>
                  {selectedMeeting.status.toUpperCase()}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {selectedMeeting.id}
                </span>
              </div>

              <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                {selectedMeeting.title}
              </h4>

              {selectedMeeting.institute && (
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  {selectedMeeting.institute}
                </p>
              )}

              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <FiCalendar size={13} className="text-slate-400 shrink-0" />
                  <span>{selectedMeeting.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiClock size={13} className="text-slate-400 shrink-0" />
                  <span>{selectedMeeting.startTime} - {selectedMeeting.endTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiShield size={13} className="text-sky-500 shrink-0" />
                  <span>{selectedMeeting.securityLevel || 'Standard'} Security</span>
                </div>
                {selectedMeeting.participants && (
                  <div className="flex items-center gap-2">
                    <FiUsers size={13} className="text-slate-400 shrink-0" />
                    <span className="truncate">{selectedMeeting.participants}</span>
                  </div>
                )}
              </div>

              {selectedMeeting.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 leading-relaxed">
                  {selectedMeeting.description}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              {(selectedMeeting.status === 'scheduled' || selectedMeeting.status === 'active') && (
                <button 
                  onClick={() => handleJoin(selectedMeeting.id)} 
                  className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <FiVideo size={14} />
                  <span>Join Session</span>
                </button>
              )}
              <button 
                onClick={() => handleDelete(selectedMeeting.id)} 
                className="px-3.5 py-2.5 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-semibold cursor-pointer transition-colors"
                title="Cancel Meeting"
              >
                <FiTrash2 size={15} />
              </button>
            </div>
          </div>
        ) : (
          /* Day Meeting List View */
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {selectedDate === today 
                  ? 'Today’s Sessions' 
                  : new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </h3>
              <span className="text-xs font-semibold text-slate-400">
                {selectedMeetings.length} {selectedMeetings.length === 1 ? 'meeting' : 'meetings'}
              </span>
            </div>

            {selectedMeetings.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <FiCalendar size={28} className="text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  No sessions scheduled on this date.
                </p>
                <button 
                  onClick={() => setShowSchedule(true)} 
                  className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-semibold cursor-pointer inline-flex items-center gap-1"
                >
                  <FiPlus size={12} /> Schedule a meeting
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {selectedMeetings.map(m => (
                  <div 
                    key={m.id} 
                    onClick={() => setSelectedMeeting(m)} 
                    className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-sky-500 dark:hover:border-sky-500 cursor-pointer transition-all shadow-xs space-y-1"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {m.title}
                      </p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                        m.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {m.status.toUpperCase()}
                      </span>
                    </div>
                    {m.institute && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {m.institute}
                      </p>
                    )}
                    <p className="text-[10px] text-slate-400 flex items-center gap-1 pt-0.5">
                      <FiClock size={10} />
                      <span>{m.startTime} - {m.endTime}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <NewMeetingModal 
        isOpen={showSchedule} 
        onClose={() => setShowSchedule(false)} 
        onStartMeeting={handleStartRoom}
        initialTab="schedule"
      />
    </div>
  );
};

export default CalendarPage;
