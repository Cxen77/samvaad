import React, { useState } from 'react';
import { 
  FiMic, FiMicOff, FiVideo, FiVideoOff, FiMonitor, 
  FiPhoneOff, FiMessageSquare, FiUsers, FiSliders, 
  FiSmile, FiBarChart2, FiFileText, FiCpu, FiShield
} from 'react-icons/fi';

const QUICK_REACTIONS = ['👍', '👏', '❤️', '💡', '🎉'];

// Clean Hand SVG Icon
const HandIcon = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
    <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
    <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
    <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
  </svg>
);

const BottomToolbar = ({ session }) => {
  const {
    isMuted, toggleMute,
    isVideoOff, toggleVideo,
    isScreenSharing, toggleScreenShare,
    handRaised, toggleHandRaise,
    sendReaction,
    activePanel, togglePanel,
    setShowEndModal,
    isMeetingSealed,
    participants,
    isHost,
    isTranscribing
  } = session;

  const [showReactions, setShowReactions] = useState(false);

  return (
    <div className="bottom-toolbar">
      <div className="bottom-toolbar__inner">
        {/* Microphone */}
        <button
          onClick={toggleMute}
          disabled={isMeetingSealed}
          className={`toolbar-control-btn ${isMuted ? 'toolbar-control-btn--danger' : ''}`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <FiMicOff size={18} /> : <FiMic size={18} />}
          <span className="toolbar-control-label">{isMuted ? 'Unmute' : 'Mute'}</span>
        </button>

        {/* Camera */}
        <button
          onClick={toggleVideo}
          disabled={isMeetingSealed}
          className={`toolbar-control-btn ${isVideoOff ? 'toolbar-control-btn--danger' : ''}`}
          title={isVideoOff ? 'Start Video' : 'Stop Video'}
        >
          {isVideoOff ? <FiVideoOff size={18} /> : <FiVideo size={18} />}
          <span className="toolbar-control-label">{isVideoOff ? 'Start Video' : 'Stop Video'}</span>
        </button>

        <div className="toolbar-separator" />

        {/* Share Screen */}
        <button
          onClick={toggleScreenShare}
          disabled={isMeetingSealed}
          className={`toolbar-control-btn ${isScreenSharing ? 'toolbar-control-btn--active' : ''}`}
          title="Share Screen"
        >
          <FiMonitor size={18} />
          <span className="toolbar-control-label">Share</span>
        </button>

        {/* Raise Hand */}
        <button
          onClick={toggleHandRaise}
          disabled={isMeetingSealed}
          className={`toolbar-control-btn ${handRaised ? 'toolbar-control-btn--amber' : ''}`}
          title={handRaised ? 'Lower Hand' : 'Raise Hand'}
        >
          <HandIcon size={18} />
          <span className="toolbar-control-label">{handRaised ? 'Lower' : 'Raise Hand'}</span>
        </button>

        {/* Reactions */}
        <div className="relative">
          <button 
            onClick={() => setShowReactions(!showReactions)}
            className="toolbar-control-btn"
            title="Reactions"
          >
            <FiSmile size={18} />
            <span className="toolbar-control-label">React</span>
          </button>

          {showReactions && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 rounded-2xl p-1.5 shadow-2xl flex gap-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              {QUICK_REACTIONS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => {
                    sendReaction(emoji);
                    setShowReactions(false);
                  }}
                  className="w-8 h-8 rounded-lg hover:bg-slate-800 flex items-center justify-center text-base transition-transform hover:scale-125"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="toolbar-separator" />

        {/* Chat */}
        <button
          onClick={() => togglePanel('chat')}
          className={`toolbar-control-btn ${activePanel === 'chat' ? 'toolbar-control-btn--active' : ''}`}
          title="Meeting Chat"
        >
          <FiMessageSquare size={18} />
          <span className="toolbar-control-label">Chat</span>
        </button>

        {/* Participants */}
        <button
          onClick={() => togglePanel('participants')}
          className={`toolbar-control-btn ${activePanel === 'participants' ? 'toolbar-control-btn--active' : ''}`}
          title="Participants"
        >
          <div className="relative">
            <FiUsers size={18} />
            <span className="absolute -top-1.5 -right-2 bg-sky-600 text-white font-bold text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center">
              {participants.length}
            </span>
          </div>
          <span className="toolbar-control-label">People</span>
        </button>

        {/* Voting */}
        <button
          onClick={() => togglePanel('voting')}
          className={`toolbar-control-btn ${activePanel === 'voting' ? 'toolbar-control-btn--active' : ''}`}
          title="Committee Voting"
        >
          <FiBarChart2 size={18} />
          <span className="toolbar-control-label">Voting</span>
        </button>

        {/* Dossier Documents */}
        <button
          onClick={() => togglePanel('dossier')}
          className={`toolbar-control-btn ${activePanel === 'dossier' ? 'toolbar-control-btn--active' : ''}`}
          title="Dossier Attachments"
        >
          <FiFileText size={18} />
          <span className="toolbar-control-label">Dossier</span>
        </button>

        {/* AI Live Transcript Notes */}
        <button
          onClick={() => togglePanel('transcript')}
          className={`toolbar-control-btn relative ${activePanel === 'transcript' ? 'toolbar-control-btn--active' : ''}`}
          title="AI Live Notes"
        >
          <div className="relative">
            <FiCpu size={18} />
            {isTranscribing && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            )}
          </div>
          <span className="toolbar-control-label">AI Notes</span>
        </button>

        {/* Host Controls / Settings */}
        {isHost ? (
          <button
            onClick={() => togglePanel('host')}
            className={`toolbar-control-btn ${activePanel === 'host' ? 'toolbar-control-btn--active' : ''}`}
            title="Host Controls"
          >
            <FiShield size={18} />
            <span className="toolbar-control-label">Host</span>
          </button>
        ) : (
          <button
            onClick={() => togglePanel('settings')}
            className={`toolbar-control-btn ${activePanel === 'settings' ? 'toolbar-control-btn--active' : ''}`}
            title="Settings"
          >
            <FiSliders size={18} />
            <span className="toolbar-control-label">Settings</span>
          </button>
        )}

        <div className="toolbar-separator" />

        {/* Leave / End Meeting Button */}
        <button
          onClick={() => setShowEndModal(true)}
          className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-red-600/20 ml-1 shrink-0"
          title={isHost ? 'End Meeting' : 'Leave Meeting'}
        >
          <FiPhoneOff size={14} />
          <span>{isHost ? 'End' : 'Leave'}</span>
        </button>
      </div>
    </div>
  );
};

export default BottomToolbar;
