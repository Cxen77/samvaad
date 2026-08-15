import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight, FiPlus, FiClock, FiShield, FiTrash2, FiEdit2 } from 'react-icons/fi';
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
    if (confirm('Cancel this meeting?')) {
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
    <div className="flex h-full bg-white">
      {/* Calendar Grid */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Calendar</h1>
          <button onClick={() => setShowSchedule(true)} className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-semibold transition-colors">
            <FiPlus size={16} /> Schedule Meeting
          </button>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={goToday} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">Today</button>
            <button onClick={prevMonth} className="p-1.5 hover:bg-gray-100 rounded-lg"><FiChevronLeft size={18} /></button>
            <button onClick={nextMonth} className="p-1.5 hover:bg-gray-100 rounded-lg"><FiChevronRight size={18} /></button>
          </div>
          <h2 className="text-lg font-semibold text-slate-800">{monthName}</h2>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 mb-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center text-xs font-semibold text-slate-400 py-2">{d}</div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 border-t border-l border-gray-200">
          {/* Empty cells before first day */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={'e' + i} className="border-r border-b border-gray-200 p-2 min-h-[80px] bg-gray-50" />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = fmt(day);
            const dayMeetings = meetingsForDate(dateStr);
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDate;

            return (
              <div
                key={day}
                onClick={() => setSelectedDate(dateStr)}
                className={`border-r border-b border-gray-200 p-2 min-h-[80px] cursor-pointer transition-colors ${isSelected ? 'bg-sky-50' : 'hover:bg-gray-50'}`}
              >
                <div className={`text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-sky-600 text-white' : 'text-slate-700'}`}>
                  {day}
                </div>
                {dayMeetings.slice(0, 2).map(m => (
                  <div key={m.id} className={`text-[10px] px-1.5 py-0.5 rounded mb-0.5 truncate cursor-pointer ${m.status === 'completed' ? 'bg-gray-200 text-gray-600' : 'bg-sky-100 text-sky-700'}`} onClick={e => { e.stopPropagation(); setSelectedMeeting(m); setSelectedDate(dateStr); }}>
                    {m.startTime} {m.title}
                  </div>
                ))}
                {dayMeetings.length > 2 && <p className="text-[10px] text-slate-400">+{dayMeetings.length - 2} more</p>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Panel — Selected Date / Meeting Detail */}
      <div className="w-80 border-l border-gray-200 bg-gray-50 p-5 overflow-y-auto shrink-0">
        {selectedMeeting ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Meeting Details</h3>
              <button onClick={() => setSelectedMeeting(null)} className="text-xs text-slate-400 hover:text-slate-600">← Back</button>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-3">
              <h4 className="font-semibold text-slate-800">{selectedMeeting.title}</h4>
              {selectedMeeting.institute && <p className="text-sm text-slate-500">{selectedMeeting.institute}</p>}
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <FiClock size={14} />
                <span>{selectedMeeting.date} • {selectedMeeting.startTime} - {selectedMeeting.endTime}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <FiShield size={14} className="text-emerald-500" />
                <span>{selectedMeeting.securityLevel}</span>
              </div>
              {selectedMeeting.participants && <p className="text-xs text-slate-400">Participants: {selectedMeeting.participants}</p>}
              {selectedMeeting.description && <p className="text-xs text-slate-400">{selectedMeeting.description}</p>}
              <div className={`text-xs font-bold px-2 py-1 rounded-full inline-block ${selectedMeeting.status === 'completed' ? 'bg-gray-100 text-gray-600' : selectedMeeting.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'}`}>{selectedMeeting.status.toUpperCase()}</div>
            </div>
            <div className="flex gap-2">
              {(selectedMeeting.status === 'scheduled' || selectedMeeting.status === 'active') && (
                <button onClick={() => handleJoin(selectedMeeting.id)} className="flex-1 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-lg">Join</button>
              )}
              <button onClick={() => handleDelete(selectedMeeting.id)} className="px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm"><FiTrash2 size={14} /></button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800">
              {selectedDate === today ? 'Today' : new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </h3>
            {selectedMeetings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-slate-400 mb-3">No meetings scheduled.</p>
                <button onClick={() => setShowSchedule(true)} className="text-sm text-sky-600 hover:underline font-medium"><FiPlus size={12} className="inline mr-1" />Schedule a meeting</button>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedMeetings.map(m => (
                  <div key={m.id} onClick={() => setSelectedMeeting(m)} className="p-3 bg-white rounded-xl border border-gray-200 hover:border-sky-300 cursor-pointer transition-colors">
                    <p className="text-sm font-semibold text-slate-800 truncate">{m.title}</p>
                    {m.institute && <p className="text-xs text-slate-400 truncate">{m.institute}</p>}
                    <p className="text-xs text-slate-400 mt-1"><FiClock size={10} className="inline mr-1" />{m.startTime} - {m.endTime}</p>
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
