import React, { useRef, useEffect } from 'react';
import { FiMicOff, FiVideoOff } from 'react-icons/fi';

// Clean Hand SVG Icon
const HandBadge = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
    <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
    <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
    <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
  </svg>
);

// Clean Pin SVG Icon
const PinIcon = ({ size = 11, className = "text-white" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="12" y1="17" x2="12" y2="22" />
    <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a1 1 0 0 0 0-2H8a1 1 0 0 0 0 2h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
  </svg>
);

const VideoTile = ({ 
  participant, 
  isLocal, 
  videoRef, 
  isVideoOff, 
  localStream,
  stream, 
  reactions, 
  isSpeaking, 
  isPinned, 
  onPin,
  isThumbnail = false
}) => {
  const initial = participant?.name?.[0]?.toUpperCase() || 'U';
  const effectiveStream = isLocal ? localStream : stream;
  const isCamOn = isLocal ? (!isVideoOff && Boolean(localStream)) : (participant?.cam !== false && Boolean(effectiveStream));
  const showAvatar = isLocal ? (isVideoOff || !localStream) : (!isCamOn || !effectiveStream);
  const isMuted = isLocal ? false : (participant?.mic === false);
  const tileReaction = reactions?.find(r => r.socketId === participant?.socketId);

  return (
    <div 
      className={`video-tile group ${participant?.isScreenSharing ? 'video-tile--presenting' : ''} ${
        isSpeaking ? 'video-tile--speaking' : ''
      } ${isThumbnail ? 'video-tile--thumbnail' : ''}`}
    >
      {/* Remote Audio Track Player (Always plays audio even if camera is off) */}
      {!isLocal && effectiveStream && (
        <audio 
          ref={el => {
            if (el && el.srcObject !== effectiveStream) {
              el.srcObject = effectiveStream;
              el.play().catch(() => {});
            }
          }} 
          autoPlay 
          playsInline 
        />
      )}

      {/* Video Stream or Avatar Placeholder */}
      {showAvatar ? (
        <div className="video-tile__avatar">
          <div className={`video-tile__avatar-circle ${isLocal ? '' : 'video-tile__avatar-circle--remote'} ${
            isSpeaking ? 'ring-4 ring-sky-500/60 animate-pulse' : ''
          }`}>
            {initial}
          </div>
          {!isThumbnail && (
            <span className="video-tile__avatar-label">{participant?.name || 'User'} (Camera off)</span>
          )}
        </div>
      ) : (
        <video 
          ref={el => {
            if (isLocal && videoRef) {
              videoRef.current = el;
            }
            if (el && effectiveStream && el.srcObject !== effectiveStream) {
              el.srcObject = effectiveStream;
              el.play().catch(() => {});
            }
          }} 
          autoPlay 
          muted={isLocal} 
          playsInline 
          className={`video-tile__video ${isLocal ? 'video-tile__video--mirrored' : ''}`} 
        />
      )}

      {/* Participant Name Badge (Bottom-Left) */}
      <div className="video-tile__name-badge">
        <span className="video-tile__name truncate max-w-[140px]">
          {participant?.name || 'Participant'}
          {isLocal && ' (You)'}
        </span>
        {participant?.isHost && <span className="video-tile__host-badge">HOST</span>}
      </div>

      {/* Mic Mute / Speaking Indicator (Bottom-Right) */}
      <div className="video-tile__status-icons">
        {isMuted ? (
          <span className="video-tile__icon video-tile__icon--muted" title="Muted">
            <FiMicOff size={12} className="text-white" />
          </span>
        ) : isSpeaking ? (
          <span className="video-tile__icon bg-sky-600 animate-pulse" title="Speaking">
            <span className="w-2 h-2 rounded-full bg-white" />
          </span>
        ) : null}
      </div>

      {/* Pin Button & Pinned Badge (Top-Right) */}
      <div className="absolute top-2 right-2 flex items-center gap-1.5 z-20">
        {isPinned && (
          <span className="px-1.5 py-0.5 rounded bg-sky-600/90 text-white text-[10px] font-bold shadow-xs flex items-center gap-1">
            <PinIcon size={10} className="text-white" /> Pinned
          </span>
        )}
        {onPin && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPin(participant?.id || participant?.socketId);
            }}
            className={`p-1 rounded-md text-white transition-opacity shadow-xs ${
              isPinned 
                ? 'bg-sky-600 opacity-100' 
                : 'bg-black/60 opacity-0 group-hover:opacity-100 hover:bg-sky-600'
            }`}
            title={isPinned ? 'Unpin video' : 'Pin to main stage'}
          >
            <PinIcon size={11} className="text-white" />
          </button>
        )}
      </div>

      {/* Subtle Hand Raised Pill (Top-Left) */}
      {participant?.handRaised && (
        <div className="video-tile__hand-tag animate-in fade-in zoom-in duration-200">
          <HandBadge />
          <span>Hand Raised</span>
        </div>
      )}

      {/* Reaction Animation (Center-Right) */}
      {tileReaction && (
        <div className="video-tile__reaction-tag animate-bounce">
          {tileReaction.emoji}
        </div>
      )}
    </div>
  );
};

export default VideoTile;
