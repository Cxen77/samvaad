import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiClock, FiCalendar, FiUsers, FiShield, FiFilter, FiPlus } from 'react-icons/fi';
import { useSamvaad } from '../../context/SamvaadContext';
import NewMeetingModal from './NewMeetingModal';

const TABS = [
  { key: 'today', label: 'Today' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const SchedulerPage = () => {
  const navigate = useNavigate();
  const { getMeetings, getTodayMeetings, getUpcomingMeetings, getCompletedMeetings, getCancelledMeetings, joinMeeting } = useSamvaad();
  const [activeTab, setActiveTab] = useState('today');
  const [showSchedule, setShowSchedule] = useState(false);

  const handleStartRoom = (roomId) => {
    joinMeeting(roomId);
    navigate(`/samvaad/waiting-room/${roomId}`);
  };


  const getData = () => {
    switch (activeTab) {
      case 'today': return getTodayMeetings();
      case 'upcoming': return getUpcomingMeetings();
      case 'completed': return getCompletedMeetings();
      case 'cancelled': return getCancelledMeetings();
      default: return [];
    }
  };

  const meetings = getData();
  const allMeetings = getMeetings();
  const counts = {
    today: getTodayMeetings().length,
    upcoming: getUpcomingMeetings().length,
    completed: getCompletedMeetings().length,
    cancelled: getCancelledMeetings().length,
  };

  const handleJoin = (id) => {
    joinMeeting(id);
    navigate(`/samvaad/waiting-room/${id}`);
  };

  const statusColors = {
    scheduled: 'bg-sky-100 text-sky-700',
    active: 'bg-sky-100 text-sky-700',
    completed: 'bg-gray-100 text-gray-600',
    cancelled: 'bg-red-100 text-red-600',
  };

  return (
    <div className="h-full bg-white p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Scheduler</h1>
          <p className="text-sm text-slate-400 mt-1">Administrative meeting management dashboard</p>
        </div>
        <button onClick={() => setShowSchedule(true)} className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-semibold transition-colors">
          <FiPlus size={16} /> New Meeting
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`p-4 rounded-xl border transition-all text-left ${activeTab === tab.key ? 'border-sky-300 bg-sky-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <p className="text-2xl font-bold text-slate-800">{counts[tab.key]}</p>
            <p className="text-xs font-medium text-slate-500 mt-1">{tab.label}</p>
          </button>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-gray-200">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${activeTab === tab.key ? 'border-sky-600 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            {tab.label} ({counts[tab.key]})
          </button>
        ))}
      </div>

      {/* Meeting Cards */}
      {meetings.length === 0 ? (
        <div className="text-center py-16">
          <FiCalendar size={48} className="text-gray-200 mx-auto mb-4" />
          <p className="text-slate-400">No {activeTab} meetings found.</p>
          <button onClick={() => setShowSchedule(true)} className="text-sm text-sky-600 hover:underline mt-2 font-medium">Schedule a meeting</button>
        </div>
      ) : (
        <div className="space-y-3">
          {meetings.map(m => (
            <div key={m.id} className="flex items-center justify-between p-5 bg-gray-50 rounded-xl border border-gray-100 hover:border-sky-200 transition-colors">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${statusColors[m.status]}`}>{m.status.toUpperCase()}</span>
                  <span className="text-[11px] text-slate-400 font-medium">{m.type}</span>
                  {m.securityLevel !== 'Standard' && <FiShield size={12} className="text-amber-500" />}
                </div>
                <p className="text-sm font-semibold text-slate-800">{m.title}</p>
                {m.institute && <p className="text-xs text-slate-500 mt-0.5">{m.institute}</p>}
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><FiCalendar size={11} /> {m.date}</span>
                  <span className="flex items-center gap-1"><FiClock size={11} /> {m.startTime} - {m.endTime}</span>
                  {m.participants && <span className="flex items-center gap-1"><FiUsers size={11} /> {m.participants.split(',').length} members</span>}
                </div>
              </div>
              {(m.status === 'scheduled' || m.status === 'active') && (
                <button onClick={() => handleJoin(m.id)} className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-xl transition-colors shrink-0 ml-4">
                  Join
                </button>
              )}
            </div>
          ))}
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
