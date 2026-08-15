import React, { useState, useEffect, useRef } from 'react';
import { 
  FiX, FiVideo, FiMic, FiCalendar, FiClock, 
  FiShield, FiLock, FiUsers, FiUserPlus, FiCheck, FiCopy, 
  FiChevronDown, FiSliders, FiFileText, FiAward,
  FiZap, FiGlobe, FiLayers, FiRadio, FiCheckCircle, FiRefreshCw, FiTrash2
} from 'react-icons/fi';
import { useSamvaad } from '../../context/SamvaadContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';

// 4 Preset Meeting Templates
const TEMPLATES = [
  {
    id: 'standard',
    name: 'Standard Meeting',
    tag: 'Collaboration',
    description: 'Open discussion session for general team and institutional collaboration.',
    meetingType: 'Standard Meeting',
    waitingRoom: false,
    securityLevel: 'Standard',
    participantPermissions: { microphone: true, camera: true, chat: true, screenShare: true, reactions: true },
    aicteFeatures: { committeeVoting: false, documentReview: false, liveTranscript: true, aiSummary: true, evidenceRecording: false, cryptographicSeal: false, blockchainAnchoring: false }
  },
  {
    id: 'hearing',
    name: 'Committee Hearing',
    tag: 'Official Hearing',
    description: 'Formal AICTE approval hearing with waiting room, voting, evidence recording, and restricted permissions.',
    meetingType: 'Committee Hearing',
    waitingRoom: true,
    securityLevel: 'Confidential',
    participantPermissions: { microphone: true, camera: true, chat: true, screenShare: false, reactions: true },
    aicteFeatures: { committeeVoting: true, documentReview: true, liveTranscript: true, aiSummary: true, evidenceRecording: true, cryptographicSeal: true, blockchainAnchoring: true }
  },
  {
    id: 'review',
    name: 'Institute Review',
    tag: 'Inspection & Review',
    description: 'Comprehensive dossier and infrastructure review with document verification and AI summaries.',
    meetingType: 'Institute Review',
    waitingRoom: true,
    securityLevel: 'Confidential',
    participantPermissions: { microphone: true, camera: true, chat: true, screenShare: true, reactions: true },
    aicteFeatures: { committeeVoting: true, documentReview: true, liveTranscript: true, aiSummary: true, evidenceRecording: true, cryptographicSeal: true, blockchainAnchoring: false }
  },
  {
    id: 'accreditation',
    name: 'Accreditation Review',
    tag: 'High Assurance',
    description: 'Highest security evaluation meeting with full cryptographic sealing and blockchain proof anchoring.',
    meetingType: 'Accreditation Review',
    waitingRoom: true,
    securityLevel: 'Restricted',
    participantPermissions: { microphone: true, camera: true, chat: true, screenShare: true, reactions: true },
    aicteFeatures: { committeeVoting: true, documentReview: true, liveTranscript: true, aiSummary: true, evidenceRecording: true, cryptographicSeal: true, blockchainAnchoring: true }
  }
];

// Clean Enterprise Switch Toggle (Zoom / Teams Style)
const SwitchToggle = ({ enabled, onChange, label, icon: Icon, description }) => (
  <div 
    onClick={() => onChange(!enabled)}
    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
      enabled 
        ? 'bg-slate-50 dark:bg-slate-800/80 border-sky-500/40 dark:border-sky-500/40' 
        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
    }`}
  >
    <div className="flex items-center gap-3 min-w-0 pr-2">
      {Icon && (
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
          enabled ? 'bg-sky-600' : 'bg-slate-700'
        }`}>
          <Icon size={15} className="text-white" />
        </div>
      )}
      <div className="min-w-0">
        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block truncate">{label}</span>
        {description && <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">{description}</span>}
      </div>
    </div>

    <div className={`w-9 h-5 rounded-full transition-colors relative flex items-center px-0.5 shrink-0 ${
      enabled ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-700'
    }`}>
      <span className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${enabled ? 'translate-x-4' : 'translate-x-0'}`} />
    </div>
  </div>
);

const NewMeetingModal = ({ isOpen, onClose, onStartMeeting, initialTab = 'new' }) => {
  const { createMeeting } = useSamvaad();
  const { currentUser } = useAuth();

  // Active Tab: 'new' | 'schedule' | 'templates' | 'invitation'
  const [activeTab, setActiveTab] = useState(initialTab);

  // Form State
  const [title, setTitle] = useState('AICTE Review Committee Meeting');
  const [institute, setInstitute] = useState('AICTE Institution');
  const [meetingType, setMeetingType] = useState('Standard Meeting');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('10:30');
  const [endTime, setEndTime] = useState('11:30');
  const [timeZone, setTimeZone] = useState('IST (UTC+05:30)');
  const [reminder, setReminder] = useState('15 mins before');

  // Basic Toggles
  const [videoDefault, setVideoDefault] = useState(true);
  const [audioDefault, setAudioDefault] = useState(true);
  const [waitingRoom, setWaitingRoom] = useState(false);
  const [requirePassword, setRequirePassword] = useState(false);
  const [password, setPassword] = useState('');

  // Advanced Options (Collapsible)
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [allowJoinBeforeHost, setAllowJoinBeforeHost] = useState(false);
  const [lockAfterStart, setLockAfterStart] = useState(false);
  const [securityLevel, setSecurityLevel] = useState('Confidential');

  // Participant Permissions
  const [permissions, setPermissions] = useState({
    microphone: true,
    camera: true,
    chat: true,
    screenShare: true,
    reactions: true
  });

  // AICTE Hearing Features
  const [aicteFeatures, setAicteFeatures] = useState({
    committeeVoting: true,
    documentReview: true,
    liveTranscript: true,
    aiSummary: true,
    evidenceRecording: true,
    cryptographicSeal: true,
    blockchainAnchoring: false
  });

  // Real User Search & Participants List
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchDropdownRef = useRef(null);

  // Created Meeting Result (for Invitation step)
  const [createdMeeting, setCreatedMeeting] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setRequirePassword(false);
      setActiveTab(initialTab || 'new');
      setCreatedMeeting(null);
      setIsSubmitting(false);
    }
  }, [isOpen, initialTab]);

  // Click outside search dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live Directory User Search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await api.get(`/users/directory?q=${encodeURIComponent(searchQuery.trim())}`);
        setSearchResults(res.data || []);
      } catch (err) {
        console.error('Directory search error:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (!isOpen) return null;

  // Apply template pre-configuration
  const handleApplyTemplate = (template) => {
    setMeetingType(template.meetingType);
    setWaitingRoom(template.waitingRoom);
    setSecurityLevel(template.securityLevel);
    setPermissions(template.participantPermissions);
    setAicteFeatures(template.aicteFeatures);
    setActiveTab('new');
    toast.success(`Applied "${template.name}" template settings`);
  };

  // Add / Remove Participants
  const handleSelectUser = (user) => {
    if (selectedParticipants.some(p => p._id === user._id)) {
      toast.error('User already added');
      return;
    }
    setSelectedParticipants(prev => [...prev, user]);
    setSearchQuery('');
    setShowSearchDropdown(false);
  };

  const handleRemoveUser = (userId) => {
    setSelectedParticipants(prev => prev.filter(p => p._id !== userId));
  };

  // Meeting Creation Handler
  const handleCreateMeetingSubmit = async (isScheduled = false) => {
    if (!title.trim()) {
      toast.error('Please enter a meeting title');
      return;
    }

    setIsSubmitting(true);
    const roomId = 'AICTE-' + new Date().getFullYear() + '-' + Math.random().toString(36).substring(2, 7).toUpperCase();
    const finalPassword = requirePassword ? (password || Math.random().toString(36).substring(2, 8).toUpperCase()) : '';

    const meetingPayload = {
      id: roomId,
      roomId,
      title: title.trim(),
      institute: institute.trim(),
      meetingType,
      password: finalPassword,
      date: isScheduled ? date : new Date().toISOString().split('T')[0],
      startTime: isScheduled ? startTime : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      endTime: isScheduled ? endTime : '12:00',
      timeZone,
      reminder,
      isInstant: !isScheduled,
      waitingRoom,
      allowJoinBeforeHost,
      lockAfterStart,
      securityLevel,
      videoDefault,
      audioDefault,
      participantPermissions: permissions,
      aiFeatures: {
        liveTranscription: aicteFeatures.liveTranscript,
        aiSummary: aicteFeatures.aiSummary,
        actionItemDetection: true,
        decisionExtraction: true
      },
      aicteFeatures,
      members: selectedParticipants,
      participantsList: selectedParticipants,
      participants: selectedParticipants.map(p => p.name).join(', ')
    };

    try {
      // 1. Create in local Samvaad Store
      const newM = createMeeting(meetingPayload);

      // 2. Sync with Backend
      await api.post('/samvaad/meetings/create', meetingPayload);

      setCreatedMeeting(newM);
      setActiveTab('invitation');
      toast.success(isScheduled ? 'Meeting scheduled successfully!' : 'Meeting ready to launch!');
    } catch (err) {
      console.error('Meeting creation error:', err);
      toast.error('Failed to create meeting');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy Full Invitation
  const handleCopyInvitation = () => {
    if (!createdMeeting) return;
    const inviteText = `AICTE SAMVAAD - Secure Meeting Invitation
Meeting: ${createdMeeting.title}
Type: ${createdMeeting.meetingType || 'Standard Meeting'}
Date: ${createdMeeting.date}
Time: ${createdMeeting.startTime} - ${createdMeeting.endTime} ${createdMeeting.timeZone || 'IST'}
Meeting ID: ${createdMeeting.id}
Passcode: ${createdMeeting.password || 'None required'}
Security Level: ${createdMeeting.securityLevel || 'Confidential'}
Join Link: ${window.location.origin}/samvaad/waiting-room/${createdMeeting.id}`;

    navigator.clipboard.writeText(inviteText);
    toast.success('Invitation copied to clipboard');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 font-sans"
        onClick={e => e.stopPropagation()}
      >
        {/* HEADER & SEGMENTED TABS */}
        <div className="p-4 px-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-sky-600 flex items-center justify-center shrink-0">
                <FiVideo size={18} className="text-white" />
              </div>
              <div>
                <h2 className="text-sm md:text-base font-bold text-slate-900 dark:text-white">
                  {activeTab === 'invitation' ? 'Meeting Ready' : 'New Meeting'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {activeTab === 'invitation' 
                    ? 'Your secure AICTE session is ready to start.' 
                    : 'Configure meeting settings and invite participants.'}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
            >
              <FiX size={18} />
            </button>
          </div>

          {/* Segmented Tab Navigation (Zoom / Teams Style) */}
          {activeTab !== 'invitation' && (
            <div className="flex items-center bg-slate-200/80 dark:bg-slate-800/90 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setActiveTab('new')}
                className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'new'
                    ? 'bg-sky-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <FiZap size={14} className={activeTab === 'new' ? 'text-white' : ''} /> New Meeting
              </button>
              <button
                onClick={() => setActiveTab('schedule')}
                className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'schedule'
                    ? 'bg-sky-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <FiCalendar size={14} className={activeTab === 'schedule' ? 'text-white' : ''} /> Schedule
              </button>
              <button
                onClick={() => setActiveTab('templates')}
                className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'templates'
                    ? 'bg-sky-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <FiLayers size={14} className={activeTab === 'templates' ? 'text-white' : ''} /> Templates
              </button>
            </div>
          )}
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-white dark:bg-slate-900">
          {/* ========================================================= */}
          {/* TAB 1 & 2: NEW / SCHEDULE FORM                            */}
          {/* ========================================================= */}
          {(activeTab === 'new' || activeTab === 'schedule') && (
            <>
              {/* Meeting Name & Type */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Meeting Topic / Name
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. ABC Institute Review Committee"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:border-sky-600 focus:ring-1 focus:ring-sky-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Meeting Type
                  </label>
                  <select
                    value={meetingType}
                    onChange={e => {
                      const val = e.target.value;
                      setMeetingType(val);
                      const matchingTmpl = TEMPLATES.find(t => t.meetingType === val);
                      if (matchingTmpl) {
                        setWaitingRoom(matchingTmpl.waitingRoom);
                        setSecurityLevel(matchingTmpl.securityLevel);
                        setPermissions(matchingTmpl.participantPermissions);
                        setAicteFeatures(matchingTmpl.aicteFeatures);
                      }
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-sky-600 focus:ring-1 focus:ring-sky-600 cursor-pointer transition-colors"
                  >
                    <option value="Standard Meeting">Standard Meeting</option>
                    <option value="Committee Hearing">Committee Hearing</option>
                    <option value="Institute Review">Institute Review</option>
                    <option value="Accreditation Review">Accreditation Review</option>
                  </select>
                </div>
              </div>

              {/* Schedule Details (Only in Schedule Tab) */}
              {activeTab === 'schedule' && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Date</label>
                      <input
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Start Time</label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={e => setStartTime(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">End Time</label>
                      <input
                        type="time"
                        value={endTime}
                        onChange={e => setEndTime(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Time Zone</label>
                      <input
                        type="text"
                        value={timeZone}
                        onChange={e => setTimeZone(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Calendar Reminder</label>
                      <select
                        value={reminder}
                        onChange={e => setReminder(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-600 cursor-pointer"
                      >
                        <option value="5 mins before">5 mins before</option>
                        <option value="15 mins before">15 mins before</option>
                        <option value="30 mins before">30 mins before</option>
                        <option value="1 hour before">1 hour before</option>
                        <option value="1 day before">1 day before</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Basic Meeting Options (Zoom/Teams-Style Switches) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Meeting Options
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <SwitchToggle 
                    enabled={videoDefault} 
                    onChange={setVideoDefault} 
                    label="Host Video" 
                    description="Turn on camera upon joining"
                    icon={FiVideo} 
                  />
                  <SwitchToggle 
                    enabled={audioDefault} 
                    onChange={setAudioDefault} 
                    label="Host Audio" 
                    description="Turn on microphone upon joining"
                    icon={FiMic} 
                  />
                  <SwitchToggle 
                    enabled={waitingRoom} 
                    onChange={setWaitingRoom} 
                    label="Waiting Room" 
                    description="Host admits participants"
                    icon={FiUsers} 
                  />
                  <SwitchToggle 
                    enabled={requirePassword} 
                    onChange={(val) => {
                      setRequirePassword(val);
                      if (val && !password) {
                        setPassword(Math.random().toString(36).substring(2, 8).toUpperCase());
                      }
                    }} 
                    label="Require Passcode" 
                    description={requirePassword ? (password ? `Passcode: ${password}` : 'Custom passcode active') : 'Off (Direct link join)'}
                    icon={FiLock} 
                  />
                </div>

                {/* Editable Passcode Field when Passcode is Enabled */}
                {requirePassword && (
                  <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1">
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Meeting Passcode (Editable)
                      </label>
                      <input
                        type="text"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Type a custom passcode (e.g. 123456)"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 transition-colors"
                      />
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto sm:mt-5">
                      <button
                        type="button"
                        onClick={() => setPassword(Math.random().toString(36).substring(2, 8).toUpperCase())}
                        className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                      >
                        <FiRefreshCw size={12} className="text-white" /> Generate
                      </button>
                      <button
                        type="button"
                        onClick={() => setPassword('')}
                        className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                      >
                        <FiTrash2 size={12} className="text-slate-600 dark:text-slate-300" /> Clear
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Invite Participants (Directory Search) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Invite Participants
                </label>
                <div className="relative" ref={searchDropdownRef}>
                  <div className="relative">
                    <FiUserPlus className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => {
                        setSearchQuery(e.target.value);
                        setShowSearchDropdown(true);
                      }}
                      onFocus={() => setShowSearchDropdown(true)}
                      placeholder="Search registered officials and members..."
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:border-sky-600 focus:ring-1 focus:ring-sky-600 transition-colors"
                    />
                  </div>

                  {/* Autocomplete Dropdown */}
                  {showSearchDropdown && searchQuery.trim() !== '' && (
                    <div className="absolute top-full mt-1.5 left-0 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50 p-1.5 space-y-1">
                      {searchLoading ? (
                        <div className="p-3 text-center text-xs text-slate-400">Searching user directory...</div>
                      ) : searchResults.length === 0 ? (
                        <div className="p-3 text-center text-xs text-slate-500">No users found matching "{searchQuery}"</div>
                      ) : (
                        searchResults.map(user => {
                          const isAdded = selectedParticipants.some(p => p._id === user._id);
                          return (
                            <div
                              key={user._id}
                              onClick={() => handleSelectUser(user)}
                              className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-xs transition-colors"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-[10px]">
                                  {user.name?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-900 dark:text-white">{user.name}</p>
                                  <p className="text-[10px] text-slate-400">{user.role || 'Member'} • {user.college || user.email}</p>
                                </div>
                              </div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isAdded ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-sky-600 text-white'}`}>
                                {isAdded ? 'Added' : '+ Add'}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                {/* Selected Participants List */}
                {selectedParticipants.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedParticipants.map(user => (
                      <div 
                        key={user._id}
                        className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-lg text-xs"
                      >
                        <div className="w-5 h-5 rounded-full bg-sky-600 flex items-center justify-center text-[10px] font-bold text-white">
                          {user.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{user.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveUser(user._id)}
                          className="text-slate-400 hover:text-red-500 ml-0.5"
                        >
                          <FiX size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Advanced Options Accordion */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-950/40">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full p-3 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-sky-600 flex items-center justify-center shrink-0">
                      <FiSliders className="text-white" size={11} />
                    </div>
                    <span>Advanced Meeting Options & AICTE Hearing Settings</span>
                  </div>
                  <FiChevronDown size={15} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                </button>

                {showAdvanced && (
                  <div className="p-4 pt-0 border-t border-slate-200 dark:border-slate-800 space-y-4">
                    {/* Security Sub-Options */}
                    <div>
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                        Security & Join Controls
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {requirePassword && (
                          <div>
                            <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">Passcode</label>
                            <input
                              type="text"
                              value={password}
                              onChange={e => setPassword(e.target.value.toUpperCase())}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-xs text-slate-900 dark:text-white uppercase focus:outline-none focus:border-sky-600"
                            />
                          </div>
                        )}
                        <div>
                          <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">Security Level</label>
                          <select
                            value={securityLevel}
                            onChange={e => setSecurityLevel(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-600 cursor-pointer"
                          >
                            <option value="Standard">Standard</option>
                            <option value="Confidential">Confidential</option>
                            <option value="Restricted">Restricted</option>
                          </select>
                        </div>
                      </div>

                      <div className="mt-3 space-y-2 text-xs">
                        <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={allowJoinBeforeHost}
                            onChange={e => setAllowJoinBeforeHost(e.target.checked)}
                            className="rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-sky-600 focus:ring-0"
                          />
                          <span>Allow participants to join before host</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={lockAfterStart}
                            onChange={e => setLockAfterStart(e.target.checked)}
                            className="rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-sky-600 focus:ring-0"
                          />
                          <span>Automatically lock meeting 10 minutes after start</span>
                        </label>
                      </div>
                    </div>

                    {/* Participant Permissions */}
                    <div>
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                        Participant Permissions
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        {[
                          { key: 'microphone', label: 'Allow Microphone' },
                          { key: 'camera', label: 'Allow Camera' },
                          { key: 'chat', label: 'Allow Chat' },
                          { key: 'screenShare', label: 'Allow Screen Share' },
                          { key: 'reactions', label: 'Allow Reactions' }
                        ].map(perm => (
                          <label key={perm.key} className="flex items-center gap-2 cursor-pointer p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                            <input
                              type="checkbox"
                              checked={permissions[perm.key]}
                              onChange={e => setPermissions(p => ({ ...p, [perm.key]: e.target.checked }))}
                              className="rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-sky-600 focus:ring-0"
                            />
                            <span className="text-[11px]">{perm.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* AICTE Specific Features */}
                    <div>
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                        AICTE Hearing Intelligence & Integrity
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {[
                          { key: 'committeeVoting', label: 'Committee Voting System' },
                          { key: 'documentReview', label: 'Dossier & Document Review' },
                          { key: 'liveTranscript', label: 'Live AI Transcription' },
                          { key: 'aiSummary', label: 'AI Decision Summary & Minutes' },
                          { key: 'evidenceRecording', label: 'Official Evidence Recording' },
                          { key: 'cryptographicSeal', label: 'Cryptographic Meeting Seal' },
                          { key: 'blockchainAnchoring', label: 'Blockchain Evidence Anchoring' }
                        ].map(feat => (
                          <label key={feat.key} className="flex items-center gap-2 cursor-pointer p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                            <input
                              type="checkbox"
                              checked={aicteFeatures[feat.key]}
                              onChange={e => setAicteFeatures(p => ({ ...p, [feat.key]: e.target.checked }))}
                              className="rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-sky-600 focus:ring-0"
                            />
                            <span className="text-[11px]">{feat.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ========================================================= */}
          {/* TAB 3: TEMPLATES SELECTOR                                  */}
          {/* ========================================================= */}
          {activeTab === 'templates' && (
            <div className="space-y-3">
              <div className="mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Select a Meeting Configuration Template
                </h3>
                <p className="text-xs text-slate-500">
                  Pre-configures security levels, participant permissions, and AICTE hearing parameters.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TEMPLATES.map(tmpl => (
                  <div
                    key={tmpl.id}
                    className="p-4 bg-white dark:bg-slate-900 hover:border-sky-500 dark:hover:border-sky-500 border border-slate-200 dark:border-slate-800 rounded-xl transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
                          {tmpl.tag}
                        </span>
                        <span className="text-[10px] text-slate-400">{tmpl.securityLevel}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                        {tmpl.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {tmpl.description}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApplyTemplate(tmpl)}
                      className="mt-4 w-full py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <FiCheck size={13} className="text-white" /> Use Template
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: INVITATION / CONFIRMATION STEP                    */}
          {/* ========================================================= */}
          {activeTab === 'invitation' && createdMeeting && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div>
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20 uppercase tracking-wider">
                    {createdMeeting.isInstant ? 'Instant Meeting Ready' : 'Meeting Scheduled'}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1.5">{createdMeeting.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {createdMeeting.isInstant 
                      ? 'Launch now or copy the credentials below to invite participants.' 
                      : `${createdMeeting.date} • ${createdMeeting.startTime} - ${createdMeeting.endTime} ${createdMeeting.timeZone || 'IST'}`}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Meeting ID</span>
                      <span className="font-mono font-bold text-sm text-slate-900 dark:text-white select-all">{createdMeeting.id}</span>
                    </div>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(createdMeeting.id);
                        toast.success('Meeting ID copied');
                      }}
                      className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1"
                      title="Copy ID"
                    >
                      <FiCopy size={14} />
                    </button>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Passcode</span>
                      <span className="font-mono font-bold text-sm text-sky-600 dark:text-sky-400 select-all">
                        {createdMeeting.password || 'None'}
                      </span>
                    </div>
                    {createdMeeting.password && (
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(createdMeeting.password);
                          toast.success('Passcode copied');
                        }}
                        className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1"
                        title="Copy Passcode"
                      >
                        <FiCopy size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs">
                  <div className="min-w-0 pr-2">
                    <span className="text-[10px] text-slate-400 block">Direct Join Link</span>
                    <span className="font-mono text-xs text-slate-600 dark:text-slate-300 truncate block select-all">
                      {window.location.origin}/samvaad/waiting-room/{createdMeeting.id}
                    </span>
                  </div>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/samvaad/waiting-room/${createdMeeting.id}`);
                      toast.success('Join link copied');
                    }}
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 shrink-0"
                    title="Copy Link"
                  >
                    <FiCopy size={14} />
                  </button>
                </div>
              </div>

              <button
                onClick={handleCopyInvitation}
                className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 transition-colors"
              >
                <FiCopy size={14} /> Copy Full Invitation Text
              </button>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between shrink-0">
          {/* Subtle Security Indicator */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <FiShield size={13} className="text-emerald-500 shrink-0" />
            <span>Secure session • DTLS-SRTP • Audit logged</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {activeTab === 'invitation' ? (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  Done
                </button>
                <button
                  onClick={() => {
                    onStartMeeting(createdMeeting.id);
                    onClose();
                  }}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/30 transition-colors flex items-center gap-1.5"
                >
                  <FiVideo size={14} className="text-white" /> Join Pre-Join & Start
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting || !title.trim()}
                  onClick={() => handleCreateMeetingSubmit(activeTab === 'schedule')}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/30 transition-colors flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    'Creating...'
                  ) : activeTab === 'schedule' ? (
                    <>
                      <FiCalendar size={14} className="text-white" /> Schedule Meeting
                    </>
                  ) : (
                    <>
                      <FiVideo size={14} className="text-white" /> Start Meeting
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewMeetingModal;
