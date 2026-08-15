import React, { useEffect, useRef, useState } from 'react';
import { 
  FiPhone, FiPhoneOff, FiVideo, FiVideoOff, FiMic, FiMicOff, 
  FiTv, FiShield, FiMaximize2, FiMinimize2, FiX, FiCheck, FiLock, FiInfo 
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

  // Attach MediaStreams to HTML <video> elements
  useEffect(() => {
    if (callState === 'CONNECTED' || callState === 'OUTGOING' || callState === 'RINGING') {
      if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      if (remoteVideoRef.current && remoteStreamRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
      }
    }
  }, [callState, localStreamRef.current, remoteStreamRef.current, isCameraOff, peerCameraOff]);

  if (callState === 'IDLE') return null;

  const peer = callData?.peerUser || {};
  const initials = peer.name ? peer.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';

  // =========================================================================
  // 1. MINIMIZED FLOATING CALL TILE
  // =========================================================================
  if (isMinimized && callState === 'CONNECTED') {
    return (
      <div className="fixed bottom-6 right-6 z-[9999] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3 flex items-center gap-3 animate-in fade-in slide-in-from-bottom duration-200 text-white">
        <div className="w-10 h-10 rounded-full bg-sky-600 flex items-center justify-center font-bold text-xs overflow-hidden shrink-0">
          {peer.profilePic ? (
            <img src={peer.profilePic} alt={peer.name} className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="min-w-0 pr-2">
          <h4 className="text-xs font-bold truncate">{peer.name || 'Direct Call'}</h4>
          <p className="text-[10px] text-emerald-400 font-semibold">{formatTime(callDuration)} • {callData?.callType}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleMic}
            className={`p-2 rounded-lg text-xs ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-300'}`}
          >
            {isMuted ? <FiMicOff size={14} /> : <FiMic size={14} />}
          </button>
          <button
            onClick={() => setIsMinimized(false)}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"
            title="Expand call"
          >
            <FiMaximize2 size={14} />
          </button>
          <button
            onClick={endCall}
            className="p-2 bg-red-600 hover:bg-red-500 text-white rounded-lg"
            title="End call"
          >
            <FiPhoneOff size={14} />
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. INCOMING CALL BANNER (GLOBAL OVERLAY)
  // =========================================================================
  if (callState === 'RINGING') {
    return (
      <div className="fixed top-6 right-6 z-[9999] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 max-w-sm w-full animate-in slide-in-from-top duration-300 text-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-sky-600 border-2 border-sky-400/40 flex items-center justify-center font-bold text-lg overflow-hidden shrink-0 shadow-lg">
            {peer.profilePic ? (
              <img src={peer.profilePic} alt={peer.name} className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-sky-400 tracking-wider block">
              Incoming {callData?.callType === 'video' ? 'Video' : 'Voice'} Call
            </span>
            <h3 className="text-sm font-bold">{peer.name || 'AICTE Member'}</h3>
            <p className="text-[11px] text-slate-400 truncate">{peer.role || 'Samvaad User'} • {peer.college || 'AICTE'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={rejectCall}
            className="flex-1 py-2.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-xl text-xs font-bold border border-red-500/30 flex items-center justify-center gap-2 transition-colors"
          >
            <FiPhoneOff size={16} /> Decline
          </button>
          <button
            onClick={acceptCall}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 transition-colors"
          >
            <FiPhone size={16} /> Accept
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. OUTGOING CALL OVERLAY
  // =========================================================================
  if (callState === 'OUTGOING') {
    return (
      <div className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 text-white">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="relative inline-block">
            <div className="w-24 h-24 rounded-full bg-sky-600/20 border-2 border-sky-500/40 flex items-center justify-center font-bold text-3xl text-sky-400 mx-auto overflow-hidden shadow-2xl">
              {peer.profilePic ? (
                <img src={peer.profilePic} alt={peer.name} className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <span className="w-4 h-4 rounded-full bg-sky-500 animate-ping absolute top-0 right-0" />
          </div>

          <div>
            <h3 className="text-xl font-bold">{peer.name}</h3>
            <p className="text-xs text-slate-400 mt-1">{peer.role || 'AICTE Official'}</p>
            <p className="text-xs font-semibold text-sky-400 mt-3 animate-pulse">
              Calling {callData?.callType === 'video' ? 'video' : 'voice'}...
            </p>
          </div>

          <div>
            <button
              onClick={cancelCall}
              className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 text-white inline-flex items-center justify-center shadow-xl shadow-red-900/50 transition-all hover:scale-105"
              title="Cancel Call"
            >
              <FiPhoneOff size={22} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 4. ACTIVE CONNECTED CALL OVERLAY (FULLSCREEN / WINDOWED)
  // =========================================================================
  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col font-sans overflow-hidden text-white">
      {/* Top Bar */}
      <div className="h-14 px-6 border-b border-slate-800 flex items-center justify-between bg-slate-950 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-sky-600 flex items-center justify-center font-bold text-xs overflow-hidden">
            {peer.profilePic ? (
              <img src={peer.profilePic} alt={peer.name} className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div>
            <h4 className="text-xs font-bold flex items-center gap-2">
              <span>{peer.name}</span>
              <span className="text-[10px] text-emerald-400 font-semibold">• {connectionStatus}</span>
            </h4>
            <span className="text-[10px] text-slate-400">{formatTime(callDuration)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSecurityModal(true)}
            className="px-2.5 py-1 bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-lg text-[11px] text-slate-300 font-semibold flex items-center gap-1.5"
          >
            <FiLock size={12} className="text-emerald-400" /> Secure Call
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-2 bg-slate-900 border border-slate-700 hover:bg-slate-800 rounded-lg text-slate-300"
            title="Minimize Call"
          >
            <FiMinimize2 size={15} />
          </button>
        </div>
      </div>

      {/* Main Media Stage */}
      <div className="flex-1 relative bg-slate-950 flex items-center justify-center overflow-hidden">
        {callData?.callType === 'video' ? (
          /* VIDEO CALL VIEW */
          <div className="w-full h-full relative flex items-center justify-center">
            {/* Remote Video Track */}
            {!peerCameraOff ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center space-y-3">
                <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center font-bold text-3xl text-slate-400 mx-auto">
                  {initials}
                </div>
                <p className="text-xs text-slate-400">{peer.name} has disabled camera</p>
              </div>
            )}

            {/* Draggable Self Preview Floating Box */}
            <div className="absolute top-4 right-4 w-44 h-32 bg-slate-900 rounded-xl border border-slate-700 shadow-2xl overflow-hidden">
              {!isCameraOff ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-slate-900 flex items-center justify-center text-xs text-slate-500 font-semibold">
                  Camera Off
                </div>
              )}
            </div>
          </div>
        ) : (
          /* VOICE CALL VIEW */
          <div className="text-center space-y-6">
            <div className="w-32 h-32 rounded-full bg-sky-600/20 border-4 border-sky-500/40 flex items-center justify-center font-bold text-4xl text-sky-400 mx-auto shadow-2xl overflow-hidden">
              {peer.profilePic ? (
                <img src={peer.profilePic} alt={peer.name} className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{peer.name}</h2>
              <p className="text-xs text-slate-400 mt-1">{peer.role || 'AICTE Official'}</p>
              <p className="text-sm font-bold text-emerald-400 mt-3">{formatTime(callDuration)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls Toolbar Dock */}
      <div className="h-20 bg-slate-950 border-t border-slate-800 px-6 flex items-center justify-center gap-4 shrink-0">
        {/* Mic Toggle */}
        <button
          onClick={toggleMic}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
            isMuted ? 'bg-red-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
          }`}
          title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
        >
          {isMuted ? <FiMicOff size={20} /> : <FiMic size={20} />}
        </button>

        {/* Camera Toggle (Video Call Only) */}
        {callData?.callType === 'video' && (
          <button
            onClick={toggleCamera}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              isCameraOff ? 'bg-red-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title={isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
          >
            {isCameraOff ? <FiVideoOff size={20} /> : <FiVideo size={20} />}
          </button>
        )}

        {/* Screen Share (Video Call Only) */}
        {callData?.callType === 'video' && (
          <button
            onClick={isScreenSharing ? stopScreenShare : startScreenShare}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              isScreenSharing ? 'bg-sky-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
          >
            <FiTv size={20} />
          </button>
        )}

        {/* End Call Button */}
        <button
          onClick={endCall}
          className="w-14 h-12 bg-red-600 hover:bg-red-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-red-900/40 transition-all"
          title="End Call"
        >
          <FiPhoneOff size={22} />
        </button>
      </div>

      {/* Security Info Modal */}
      {showSecurityModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 font-bold text-xs text-emerald-400">
                <FiShield size={16} /> Secure Call Verification
              </div>
              <button onClick={() => setShowSecurityModal(false)} className="text-slate-400 hover:text-white">
                <FiX size={16} />
              </button>
            </div>
            <div className="space-y-2 text-xs text-slate-300">
              <p className="flex items-center justify-between">
                <span className="text-slate-400">Transport:</span>
                <span className="font-semibold text-emerald-400">WebRTC DTLS-SRTP</span>
              </p>
              <p className="flex items-center justify-between">
                <span className="text-slate-400">Signaling:</span>
                <span className="font-semibold text-slate-200">WSS / HTTPS TLS 1.3</span>
              </p>
              <p className="flex items-center justify-between">
                <span className="text-slate-400">Peer Identity:</span>
                <span className="font-semibold text-slate-200">Verified AICTE Official</span>
              </p>
              <p className="flex items-center justify-between border-t border-slate-800 pt-2 text-[10px]">
                <span className="text-slate-400">Call ID:</span>
                <span className="font-mono text-slate-400">{callData?.callId}</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectCallOverlay;
