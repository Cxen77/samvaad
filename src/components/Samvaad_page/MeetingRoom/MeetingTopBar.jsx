import React from 'react';
import { FiShield, FiLock, FiCopy, FiCheck, FiGrid, FiUser, FiSliders, FiInfo } from 'react-icons/fi';
import toast from 'react-hot-toast';

const MeetingTopBar = ({ 
  meeting, isRecording, recSeconds, formatRecTime, isRecPaused, 
  isLocked, isMeetingSealed, layout, setLayout,
  activePanel, togglePanel, isPanelCollapsed, setIsPanelCollapsed
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(meeting.id);
    setCopied(true);
    toast.success('Meeting ID copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenPanel = (panelId) => {
    if (togglePanel) {
      togglePanel(panelId);
      if (setIsPanelCollapsed) setIsPanelCollapsed(false);
    }
  };

  return (
    <div className="meeting-topbar">
      {/* Left: Meeting Title & ID */}
      <div className="topbar-left min-w-0">
        <div className="topbar-logo shrink-0">
          <FiShield size={14} />
        </div>
        <div className="topbar-info flex items-center gap-1.5 sm:gap-2 min-w-0">
          <h1 className="topbar-meeting-title font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[85px] xs:max-w-[120px] sm:max-w-[200px] md:max-w-none text-xs sm:text-sm">
            {meeting.title || 'AICTE Hearing'}
          </h1>
          <span className="topbar-divider text-slate-300 dark:text-slate-700 hidden xs:inline">|</span>
          <button 
            onClick={handleCopyId}
            className="topbar-meta-btn flex items-center gap-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors shrink-0"
            title="Click to copy Meeting ID"
          >
            <span className="font-mono text-[10px] sm:text-xs text-slate-700 dark:text-slate-300">{meeting.id}</span>
            {copied ? <FiCheck size={11} className="text-sky-600 dark:text-sky-400" /> : <FiCopy size={10} />}
          </button>
        </div>
      </div>

      {/* Center: View Layout Switcher (Zoom Style) */}
      <div className="topbar-center flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 text-xs shrink-0">
        <button
          onClick={() => setLayout('gallery')}
          className={`px-1.5 sm:px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
            layout === 'gallery' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
          title="Gallery View"
        >
          <FiGrid size={12} />
          <span className="hidden sm:inline">Gallery</span>
        </button>
        <button
          onClick={() => setLayout('speaker')}
          className={`px-1.5 sm:px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
            layout === 'speaker' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
          title="Speaker View"
        >
          <FiUser size={12} />
          <span className="hidden sm:inline">Speaker</span>
        </button>
      </div>

      {/* Right: Security, Status & Minimal Icon Tools */}
      <div className="topbar-right flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Minimal Encrypted Indicator */}
        <span className="hidden sm:flex items-center gap-1 text-xs text-sky-600 dark:text-sky-400 font-medium" title="End-to-End Encrypted Session">
          <FiLock size={12} />
          <span>Encrypted</span>
        </span>

        {isRecording && (
          <div className="flex items-center gap-1 text-[10px] sm:text-xs text-red-500 dark:text-red-400 font-medium">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500 animate-pulse" />
            <span>REC {formatRecTime(recSeconds)}</span>
            {isRecPaused && <span className="text-amber-500 dark:text-amber-400 font-bold hidden sm:inline">(PAUSED)</span>}
          </div>
        )}

        {isLocked && (
          <span className="flex items-center gap-1 text-xs text-sky-600 dark:text-sky-400 font-medium">
            <FiLock size={12} /> <span className="hidden sm:inline">Locked</span>
          </span>
        )}

        {isMeetingSealed && (
          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium hidden sm:inline">
            Sealed
          </span>
        )}

        {/* Settings & Info Icons */}
        <div className="flex items-center gap-1.5 sm:gap-2 border-l border-slate-200 dark:border-slate-800/80 pl-1.5 sm:pl-2">
          <button
            onClick={() => handleOpenPanel('settings')}
            className={`p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer ${
              activePanel === 'settings' && !isPanelCollapsed ? 'text-sky-600 dark:text-sky-400' : ''
            }`}
            title="Meeting Settings"
          >
            <FiSliders size={15} />
          </button>

          <button
            onClick={() => handleOpenPanel('info')}
            className={`p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer ${
              activePanel === 'info' && !isPanelCollapsed ? 'text-sky-600 dark:text-sky-400' : ''
            }`}
            title="Meeting Information"
          >
            <FiInfo size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeetingTopBar;
