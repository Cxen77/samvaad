import React, { useEffect, useRef, useState } from 'react';
import { 
  FiPhone, FiPhoneOff, FiVideo, FiVideoOff, FiMic, FiMicOff, 
  FiTv, FiShield, FiMaximize2, FiMinimize2, FiX, FiCheck, FiLock 
} from 'react-icons/fi';
import { useDirectCall } from '../../context/DirectCallContext';

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const DirectCallOverlay = () => {
  const {
    callState,
    callData,
    isMuted,
    isCameraOff,
    isScreenSharing,
    isMinimized,
    peerCameraOff,
    peerMuted,
    callDuration,
    connectionStatus,
    localStreamRef,
    remoteStreamRef,
    acceptCall,
    rejectCall,
    cancelCall,
    endCall,
    toggleMic,
    toggleCamera,
    startScreenShare,
    stopScreenShare,
    setIsMinimized
  } = useDirectCall();

  const [showSecurityModal, setShowSecurityModal] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);

  // Attach MediaStreams to HTML <video> and <audio> elements
  useEffect(() => {
    if (callState === 'CONNECTED' || callState === 'OUTGOING' || callState === 'RINGING') {
      if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      if (remoteVideoRef.current && remoteStreamRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
      }
      // CRITICAL FOR AUDIO-ONLY CALLS: Attach remote stream to HTMLAudioElement
      if (remoteAudioRef.current && remoteStreamRef.current) {
        remoteAudioRef.current.srcObject = remoteStreamRef.current;
        remoteAudioRef.current.play().catch((err) => {
          console.warn('[DirectCall] Remote audio autoplay waiting for user interaction:', err.message);
        });
      }
    }
  }, [callState, localStreamRef.current, remoteStreamRef.current, isCameraOff, peerCameraOff]);

  if (callState === 'IDLE') return null;

  // Remote audio player component rendered across all active call views
  const remoteAudioPlayer = (
    <audio
      ref={remoteAudioRef}
      autoPlay
      playsInline
      className="hidden"
      aria-hidden="true"
    />
  );

  const peer = callData?.peerUser || {};
  const initials = peer.name ? peer.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';

  // =========================================================================
  // 1. MINIMIZED FLOATING CALL TILE (Mobile & Desktop)
  // =========================================================================
  if (isMinimized && callState === 'CONNECTED') {
    return (
      <>
        {remoteAudioPlayer}
        <div className="fixed bottom-20 md:bottom-6 right-3 md:right-6 z-[9999] bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl p-2.5 sm:p-3 flex items-center gap-2.5 sm:gap-3 animate-in fade-in slide-in-from-bottom duration-200 text-white max-w-[90vw] sm:max-w-sm">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-sky-600 flex items-center justify-center font-bold text-xs overflow-hidden shrink-0">
            {peer.profilePic ? (
              <img src={peer.profilePic} alt={peer.name} className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="min-w-0 flex-1 pr-1">
            <h4 className="text-xs font-semibold truncate text-slate-100">{peer.name || 'Direct Call'}</h4>
            <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {formatTime(callDuration)} • {callData?.callType === 'video' ? 'Video' : 'Voice'}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={toggleMic}
              className={`p-2 rounded-xl text-xs transition-colors cursor-pointer ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <FiMicOff size={14} /> : <FiMic size={14} />}
            </button>
            <button
              onClick={() => setIsMinimized(false)}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition-colors cursor-pointer"
              title="Expand call"
            >
              <FiMaximize2 size={14} />
            </button>
            <button
              onClick={endCall}
              className="p-2 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-colors cursor-pointer"
              title="End call"
            >
              <FiPhoneOff size={14} />
            </button>
          </div>
        </div>
      </>
    );
  }

  // =========================================================================
  // 2. INCOMING CALL BANNER (Mobile & Desktop Toast Card)
  // =========================================================================
  if (callState === 'RINGING') {
    return (
      <>
        {remoteAudioPlayer}
        <div className="fixed top-3 inset-x-3 sm:inset-x-auto sm:right-6 sm:top-6 z-[9999] bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl p-4 sm:p-5 max-w-sm sm:w-full mx-auto animate-in slide-in-from-top duration-300 text-white">
          <div className="flex items-center gap-3.5 mb-3.5">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-sky-600 border border-sky-400/30 flex items-center justify-center font-bold text-base sm:text-lg overflow-hidden shrink-0 shadow-md">
              {peer.profilePic ? (
                <img src={peer.profilePic} alt={peer.name} className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-bold text-sky-400 tracking-wider block">
                Incoming {callData?.callType === 'video' ? 'Video' : 'Voice'} Call
              </span>
              <h3 className="text-sm font-bold truncate text-white">{peer.name || 'AICTE Member'}</h3>
              <p className="text-[11px] text-slate-400 truncate">{peer.role || 'Samvaad User'} • {peer.college || 'AICTE'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={rejectCall}
              className="py-2.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-xl text-xs font-semibold border border-red-500/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <FiPhoneOff size={15} /> Decline
            </button>
            <button
              onClick={acceptCall}
              className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-900/40 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <FiPhone size={15} /> Accept
            </button>
          </div>
        </div>
      </>
    );
  }

  // =========================================================================
  // 3. OUTGOING CALL SCREEN (Native Clean Mobile & Desktop Layout)
  // =========================================================================
  if (callState === 'OUTGOING') {
    return (
      <>
        {remoteAudioPlayer}
        <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col justify-between items-center p-6 text-white font-sans">
          {/* Top Security Header */}
          <div className="w-full max-w-md flex items-center justify-between pt-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <FiLock size={12} className="text-emerald-400" />
              <span>End-to-End Encrypted</span>
            </div>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
              {callData?.callType === 'video' ? 'Video' : 'Voice'}
            </span>
          </div>

          {/* Center Contact & Ringing Info */}
          <div className="w-full max-w-md text-center space-y-4 my-auto">
            <div className="relative inline-block">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center font-bold text-3xl sm:text-4xl text-slate-300 mx-auto overflow-hidden shadow-2xl">
                {peer.profilePic ? (
                  <img src={peer.profilePic} alt={peer.name} className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <span className="w-3.5 h-3.5 rounded-full bg-sky-500 animate-ping absolute top-1 right-1" />
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{peer.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{peer.role || 'AICTE Official'}</p>
              <p className="text-xs font-semibold text-sky-400 mt-3 animate-pulse">
                Calling...
              </p>
            </div>
          </div>

          {/* Bottom Cancel Action Button */}
          <div className="w-full max-w-md flex items-center justify-center pb-6">
            <button
              onClick={cancelCall}
              className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-900/40 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              title="Cancel Call"
            >
              <FiPhoneOff size={22} />
            </button>
          </div>
        </div>
      </>
    );
  }

  // =========================================================================
  // 4. ACTIVE CONNECTED CALL OVERLAY (FULLSCREEN / RESPONSIVE STAGE)
  // =========================================================================
  return (
    <>
      {remoteAudioPlayer}
      <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col font-sans overflow-hidden text-white">
        
        {/* Top Header Bar */}
        <div className="h-14 sm:h-16 px-3 sm:px-6 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-sky-600 flex items-center justify-center font-bold text-xs overflow-hidden shrink-0">
              {peer.profilePic ? (
                <img src={peer.profilePic} alt={peer.name} className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-semibold truncate flex items-center gap-1.5">
                <span className="truncate">{peer.name}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              </h4>
              <p className="text-[10px] sm:text-xs text-slate-400 font-mono">
                {formatTime(callDuration)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => setShowSecurityModal(true)}
              className="px-2 sm:px-2.5 py-1 bg-slate-900 border border-slate-700/80 hover:border-slate-600 rounded-lg text-[10px] sm:text-[11px] text-slate-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <FiLock size={11} className="text-emerald-400" />
              <span className="hidden xs:inline">Secure</span>
            </button>
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1.5 sm:p-2 bg-slate-900 border border-slate-700/80 hover:bg-slate-800 rounded-lg text-slate-300 transition-colors cursor-pointer"
              title="Minimize Call"
            >
              <FiMinimize2 size={14} />
            </button>
          </div>
        </div>

        {/* Main Media Canvas */}
        <div className="flex-1 relative bg-slate-950 flex items-center justify-center overflow-hidden">
          {callData?.callType === 'video' ? (
            /* VIDEO CALL VIEW */
            <div className="w-full h-full relative flex items-center justify-center">
              {/* Remote Video Canvas */}
              {!peerCameraOff ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center space-y-3 p-4">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center font-bold text-2xl sm:text-3xl text-slate-400 mx-auto">
                    {initials}
                  </div>
                  <p className="text-xs text-slate-400">{peer.name} disabled their camera</p>
                </div>
              )}

              {/* Floating Self-Preview Box (Adaptive Corner PIP) */}
              <div className="absolute bottom-24 right-3 sm:bottom-auto sm:top-4 sm:right-4 w-28 h-36 xs:w-32 xs:h-44 sm:w-44 sm:h-32 bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden z-10">
                {!isCameraOff ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center p-2 text-center text-[10px] text-slate-500 font-medium">
                    <FiVideoOff size={14} className="mb-1 text-slate-600" />
                    <span>Camera Off</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* VOICE CALL VIEW */
            <div className="text-center space-y-4 sm:space-y-6 p-4">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center font-bold text-3xl sm:text-4xl text-slate-300 mx-auto shadow-2xl overflow-hidden">
                {peer.profilePic ? (
                  <img src={peer.profilePic} alt={peer.name} className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{peer.name}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{peer.role || 'AICTE Official'}</p>
                <p className="text-sm font-semibold text-emerald-400 mt-2.5 font-mono">{formatTime(callDuration)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Call Control Toolbar Dock */}
        <div className="h-20 sm:h-22 bg-slate-950 border-t border-slate-800/80 px-4 flex items-center justify-center gap-3 sm:gap-4 shrink-0 z-20">
          {/* Microphone Toggle */}
          <button
            onClick={toggleMic}
            className={`w-12 h-12 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
              isMuted ? 'bg-red-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
          >
            {isMuted ? <FiMicOff size={18} /> : <FiMic size={18} />}
          </button>

          {/* Camera Toggle (Video Calls Only) */}
          {callData?.callType === 'video' && (
            <button
              onClick={toggleCamera}
              className={`w-12 h-12 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                isCameraOff ? 'bg-red-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
              title={isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
            >
              {isCameraOff ? <FiVideoOff size={18} /> : <FiVideo size={18} />}
            </button>
          )}

          {/* Screen Share (Video Calls Only) */}
          {callData?.callType === 'video' && (
            <button
              onClick={isScreenSharing ? stopScreenShare : startScreenShare}
              className={`w-12 h-12 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                isScreenSharing ? 'bg-sky-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
              title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
            >
              <FiTv size={18} />
            </button>
          )}

          {/* End Call Button */}
          <button
            onClick={endCall}
            className="w-14 h-12 sm:w-16 sm:h-13 bg-red-600 hover:bg-red-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-red-900/40 transition-all cursor-pointer active:scale-95"
            title="End Call"
          >
            <FiPhoneOff size={20} />
          </button>
        </div>

        {/* Security Info Modal */}
        {showSecurityModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[10000] flex items-center justify-center p-4" onClick={() => setShowSecurityModal(false)}>
            <div 
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-4 sm:p-5 space-y-3.5 shadow-2xl text-slate-900 dark:text-white"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
                <div className="flex items-center gap-2 font-bold text-xs text-sky-600 dark:text-sky-400">
                  <FiShield size={16} /> Secure Direct Call
                </div>
                <button onClick={() => setShowSecurityModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer">
                  <FiX size={16} />
                </button>
              </div>
              <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                <p className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Transport:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">WebRTC DTLS-SRTP</span>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Signaling:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">WSS / HTTPS TLS 1.3</span>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Peer Identity:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Verified AICTE Official</span>
                </p>
                <p className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-2 text-[10px]">
                  <span className="text-slate-500 dark:text-slate-400">Call ID:</span>
                  <span className="font-mono text-slate-500 dark:text-slate-400 truncate max-w-[160px]">{callData?.callId}</span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default DirectCallOverlay;
