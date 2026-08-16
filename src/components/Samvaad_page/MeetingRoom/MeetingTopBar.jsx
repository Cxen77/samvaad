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
      <div className="topbar-left">
        <div className="topbar-logo">
          <FiShield size={15} />
        </div>
        <div className="topbar-info flex items-center gap-2">
          <h1 className="topbar-meeting-title font-semibold text-slate-100">{meeting.title || 'AICTE Samvaad Hearing'}</h1>
          <span className="topbar-divider">|</span>
          <button 
            onClick={handleCopyId}
            className="topbar-meta-btn flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors"
            title="Click to copy Meeting ID"
          >
            <span className="font-mono text-xs text-slate-300">{meeting.id}</span>
            {copied ? <FiCheck size={12} className="text-sky-400" /> : <FiCopy size={11} />}
          </button>
        </div>
      </div>

      {/* Center: View Layout Switcher (Zoom Style) */}
      <div className="topbar-center flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
        <button
          onClick={() => setLayout('gallery')}
          className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
            layout === 'gallery' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Gallery View"
        >
          <FiGrid size={12} />
          <span>Gallery</span>
        </button>
        <button
          onClick={() => setLayout('speaker')}
          className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
            layout === 'speaker' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Speaker View"
        >
          <FiUser size={12} />
          <span>Speaker</span>
        </button>
      </div>

      {/* Right: Security, Status & Minimal Icon Tools */}
      <div className="topbar-right flex items-center gap-3">
        {/* Minimal Encrypted Indicator (No box, no border) */}
        <span className="flex items-center gap-1 text-xs text-sky-400 font-medium" title="End-to-End Encrypted Session">
          <FiLock size={12} />
          <span>Encrypted</span>
        </span>

        {isRecording && (
          <div className="flex items-center gap-1.5 text-xs text-red-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span>REC {formatRecTime(recSeconds)}</span>
            {isRecPaused && <span className="text-amber-400 font-bold">(PAUSED)</span>}
          </div>
        )}

        {isLocked && (
          <span className="flex items-center gap-1 text-xs text-sky-400 font-medium">
            <FiLock size={12} /> Locked
          </span>
        )}

        {isMeetingSealed && (
          <span className="text-xs text-amber-400 font-medium">
            Sealed
          </span>
        )}

        {/* Minimal Settings & Info Icons Only (No boxes, no text) */}
        <div className="flex items-center gap-2 border-l border-slate-800/80 pl-2">
          <button
            onClick={() => handleOpenPanel('settings')}
            className={`p-1 text-slate-400 hover:text-white transition-colors cursor-pointer ${
              activePanel === 'settings' && !isPanelCollapsed ? 'text-sky-400' : ''
            }`}
            title="Meeting Settings"
          >
            <FiSliders size={16} />
          </button>

          <button
            onClick={() => handleOpenPanel('info')}
            className={`p-1 text-slate-400 hover:text-white transition-colors cursor-pointer ${
              activePanel === 'info' && !isPanelCollapsed ? 'text-sky-400' : ''
            }`}
            title="Meeting Information"
          >
            <FiInfo size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeetingTopBar;
