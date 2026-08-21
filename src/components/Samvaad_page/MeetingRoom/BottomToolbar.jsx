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
      <div className="bottom-toolbar__inner overflow-x-auto scrollbar-none flex items-center justify-start md:justify-center w-full max-w-full px-1 sm:px-2 gap-1 sm:gap-1.5">
        {/* Microphone */}
        <button
          onClick={toggleMute}
          disabled={isMeetingSealed}
          className={`toolbar-control-btn shrink-0 ${isMuted ? 'toolbar-control-btn--danger' : ''}`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <FiMicOff size={17} /> : <FiMic size={17} />}
          <span className="toolbar-control-label">{isMuted ? 'Unmute' : 'Mute'}</span>
        </button>

        {/* Camera */}
        <button
          onClick={toggleVideo}
          disabled={isMeetingSealed}
          className={`toolbar-control-btn shrink-0 ${isVideoOff ? 'toolbar-control-btn--danger' : ''}`}
          title={isVideoOff ? 'Start Video' : 'Stop Video'}
        >
          {isVideoOff ? <FiVideoOff size={17} /> : <FiVideo size={17} />}
          <span className="toolbar-control-label">{isVideoOff ? 'Start' : 'Stop'}</span>
        </button>

        <div className="toolbar-separator shrink-0" />

        {/* Share Screen */}
        <button
          onClick={toggleScreenShare}
          disabled={isMeetingSealed}
          className={`toolbar-control-btn shrink-0 ${isScreenSharing ? 'toolbar-control-btn--active' : ''}`}
          title="Share Screen"
        >
          <FiMonitor size={17} />
          <span className="toolbar-control-label">Share</span>
        </button>

        {/* Raise Hand */}
        <button
          onClick={toggleHandRaise}
          disabled={isMeetingSealed}
          className={`toolbar-control-btn shrink-0 ${handRaised ? 'toolbar-control-btn--amber' : ''}`}
          title={handRaised ? 'Lower Hand' : 'Raise Hand'}
        >
          <HandIcon size={17} />
          <span className="toolbar-control-label">{handRaised ? 'Lower' : 'Hand'}</span>
        </button>

        {/* Reactions */}
        <div className="relative shrink-0">
          <button 
            onClick={() => setShowReactions(!showReactions)}
            className="toolbar-control-btn"
            title="Reactions"
          >
            <FiSmile size={17} />
            <span className="toolbar-control-label">React</span>
          </button>

          {showReactions && (
            <div className="absolute bottom-14 sm:bottom-16 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-1.5 shadow-2xl flex gap-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              {QUICK_REACTIONS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => {
                    sendReaction(emoji);
                    setShowReactions(false);
                  }}
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-base transition-transform hover:scale-125 cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="toolbar-separator shrink-0" />

        {/* Chat */}
        <button
          onClick={() => togglePanel('chat')}
          className={`toolbar-control-btn shrink-0 ${activePanel === 'chat' ? 'toolbar-control-btn--active' : ''}`}
          title="Meeting Chat"
        >
          <FiMessageSquare size={17} />
          <span className="toolbar-control-label">Chat</span>
        </button>

        {/* Participants */}
        <button
          onClick={() => togglePanel('participants')}
          className={`toolbar-control-btn shrink-0 ${activePanel === 'participants' ? 'toolbar-control-btn--active' : ''}`}
          title="Participants"
        >
          <div className="relative">
            <FiUsers size={17} />
            <span className="absolute -top-1.5 -right-2 bg-sky-600 text-white font-bold text-[8px] sm:text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center">
              {participants.length}
            </span>
          </div>
          <span className="toolbar-control-label">People</span>
        </button>

        {/* Voting */}
        <button
          onClick={() => togglePanel('voting')}
          className={`toolbar-control-btn shrink-0 ${activePanel === 'voting' ? 'toolbar-control-btn--active' : ''}`}
          title="Committee Voting"
        >
          <FiBarChart2 size={17} />
          <span className="toolbar-control-label">Voting</span>
        </button>

        {/* Dossier Documents */}
        <button
          onClick={() => togglePanel('dossier')}
          className={`toolbar-control-btn shrink-0 ${activePanel === 'dossier' ? 'toolbar-control-btn--active' : ''}`}
          title="Dossier Attachments"
        >
          <FiFileText size={17} />
          <span className="toolbar-control-label">Dossier</span>
        </button>

        {/* AI Live Transcript Notes */}
        <button
          onClick={() => togglePanel('transcript')}
          className={`toolbar-control-btn relative shrink-0 ${activePanel === 'transcript' ? 'toolbar-control-btn--active' : ''}`}
          title="AI Live Notes"
        >
          <div className="relative">
            <FiCpu size={17} />
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
            className={`toolbar-control-btn shrink-0 ${activePanel === 'host' ? 'toolbar-control-btn--active' : ''}`}
            title="Host Controls"
          >
            <FiShield size={17} />
            <span className="toolbar-control-label">Host</span>
          </button>
        ) : (
          <button
            onClick={() => togglePanel('settings')}
            className={`toolbar-control-btn shrink-0 ${activePanel === 'settings' ? 'toolbar-control-btn--active' : ''}`}
            title="Settings"
          >
            <FiSliders size={17} />
            <span className="toolbar-control-label">Settings</span>
          </button>
        )}

        <div className="toolbar-separator shrink-0" />

        {/* Leave / End Meeting Button */}
        <button
          onClick={() => setShowEndModal(true)}
          className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 shadow-md shadow-red-600/20 ml-1 shrink-0"
          title={isHost ? 'End Meeting' : 'Leave Meeting'}
        >
          <FiPhoneOff size={13} />
          <span>{isHost ? 'End' : 'Leave'}</span>
        </button>
      </div>
    </div>
  );
};

export default BottomToolbar;
