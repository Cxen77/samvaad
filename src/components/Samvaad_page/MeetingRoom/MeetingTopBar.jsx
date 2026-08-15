import React from 'react';
import { FiShield, FiLock, FiCopy, FiCheck, FiGrid, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';

const MeetingTopBar = ({ 
  meeting, isRecording, recSeconds, formatRecTime, isRecPaused, 
  isLocked, isMeetingSealed, layout, setLayout 
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(meeting.id);
    setCopied(true);
    toast.success('Meeting ID copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
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

      {/* Right: Security & Status Badges */}
      <div className="topbar-right">
        <span className="topbar-badge topbar-badge--secure" title="End-to-End Encrypted Session">
          <FiLock size={11} />
          <span>Encrypted</span>
        </span>

        <span className="topbar-badge topbar-badge--security">
          {meeting.securityLevel || 'Confidential'}
        </span>

        {isRecording && (
          <div className="topbar-badge topbar-badge--recording">
            <span className="topbar-rec-dot" />
            <span>REC {formatRecTime(recSeconds)}</span>
            {isRecPaused && <span className="rec-paused font-bold">(PAUSED)</span>}
          </div>
        )}

        {isLocked && (
          <span className="topbar-badge topbar-badge--locked">
            <FiLock size={11} /> Locked
          </span>
        )}

        {isMeetingSealed && (
          <span className="topbar-badge topbar-badge--sealed">
            Sealed
          </span>
        )}
      </div>
    </div>
  );
};

export default MeetingTopBar;
