import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const DirectCallContext = createContext();

export const useDirectCall = () => useContext(DirectCallContext);

// Build ICE configuration from environment variables
// STUN is always included. TURN is added if configured.
const buildRtcConfig = () => {
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ];

  // Add TURN server if configured via environment variables
  const turnUrl = import.meta.env.VITE_TURN_SERVER_URL;
  const turnUsername = import.meta.env.VITE_TURN_USERNAME;
  const turnCredential = import.meta.env.VITE_TURN_CREDENTIAL;

  if (turnUrl && turnUsername && turnCredential) {
    iceServers.push({
      urls: turnUrl,
      username: turnUsername,
      credential: turnCredential
    });
    // Also add TURNS (TLS) variant if the URL uses turn: protocol
    if (turnUrl.startsWith('turn:')) {
      iceServers.push({
        urls: turnUrl.replace('turn:', 'turns:'),
        username: turnUsername,
        credential: turnCredential
      });
    }
  }

  return { iceServers };
};

const RTC_CONFIG = buildRtcConfig();

export const DirectCallProvider = ({ children }) => {
  const { socket } = useSocket();
  const { currentUser } = useAuth();

  // Call State Machine: 'IDLE' | 'OUTGOING' | 'RINGING' | 'CONNECTED' | 'ENDED'
  const [callState, setCallState] = useState('IDLE');
  const [callData, setCallData] = useState(null); // { callId, conversationId, peerUser, callType }
  
  // Media States
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Peer States
  const [peerCameraOff, setPeerCameraOff] = useState(false);
  const [peerMuted, setPeerMuted] = useState(false);
  
  // Connection & Duration
  const [callDuration, setCallDuration] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');

  // Devices
  const [availableDevices, setAvailableDevices] = useState({ audioInputs: [], videoInputs: [], audioOutputs: [] });
  const [selectedDevices, setSelectedDevices] = useState({ audioInputId: '', videoInputId: '', audioOutputId: '' });

  // Refs for WebRTC & Streams
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const durationIntervalRef = useRef(null);
  
  // ICE candidate buffer — candidates that arrive before remote description is set
  const iceCandidateBuffer = useRef([]);
  const remoteDescriptionSet = useRef(false);

  // Refs for state values used in socket handlers (avoids stale closures)
  const callStateRef = useRef(callState);
  const callDataRef = useRef(callData);
  const socketRef = useRef(socket);

  // Keep refs in sync with state
  useEffect(() => { callStateRef.current = callState; }, [callState]);
  useEffect(() => { callDataRef.current = callData; }, [callData]);
  useEffect(() => { socketRef.current = socket; }, [socket]);

  // Helper: Enumerate Audio/Video Devices
  const updateDeviceList = async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(d => d.kind === 'audioinput');
      const videoInputs = devices.filter(d => d.kind === 'videoinput');
      const audioOutputs = devices.filter(d => d.kind === 'audiooutput');

      setAvailableDevices({ audioInputs, videoInputs, audioOutputs });
      
      setSelectedDevices(prev => ({
        audioInputId: prev.audioInputId || audioInputs[0]?.deviceId || '',
        videoInputId: prev.videoInputId || videoInputs[0]?.deviceId || '',
        audioOutputId: prev.audioOutputId || audioOutputs[0]?.deviceId || ''
      }));
    } catch (err) {
      console.warn('Device enumeration warning:', err);
    }
  };

  // =========================================================================
  // MEDIA & PEER CLEANUP STRATEGY (CRITICAL)
  // Ensures hardware camera & mic indicator lights turn COMPLETELY OFF
  // =========================================================================
  const cleanupCall = useCallback(() => {
    console.log('[DirectCall] cleanupCall — releasing all resources');

    // 1. Stop Duration Timer
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    // 2. Stop Screen Share Tracks
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }

    // 3. Stop Local Media Tracks (Camera & Mic)
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      localStreamRef.current = null;
    }

    // 4. Stop Remote Media Tracks
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach(track => track.stop());
      remoteStreamRef.current = null;
    }

    // 5. Close Peer Connection
    if (pcRef.current) {
      pcRef.current.ontrack = null;
      pcRef.current.onicecandidate = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.oniceconnectionstatechange = null;
      pcRef.current.onsignalingstatechange = null;
      pcRef.current.close();
      pcRef.current = null;
    }

    // 6. Reset ICE candidate buffer
    iceCandidateBuffer.current = [];
    remoteDescriptionSet.current = false;

    // 7. Reset State
    setCallState('IDLE');
    setCallData(null);
    setIsMuted(false);
    setIsCameraOff(false);
    setIsScreenSharing(false);
    setIsMinimized(false);
    setPeerCameraOff(false);
    setPeerMuted(false);
    setCallDuration(0);
    setConnectionStatus('Connecting...');
  }, []);

  // Flush buffered ICE candidates after remote description is set
  const flushIceCandidateBuffer = useCallback(async () => {
    if (!pcRef.current) return;
    const buffered = iceCandidateBuffer.current;
    iceCandidateBuffer.current = [];
    for (const candidate of buffered) {
      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        console.log('[WebRTC] Flushed buffered ICE candidate');
      } catch (err) {
        console.error('[WebRTC] Error flushing buffered ICE candidate:', err);
      }
    }
  }, []);

  // Initialize WebRTC PeerConnection
  const createPeerConnection = useCallback((callId) => {
    // Guard: never reuse a closed/failed peer connection
    if (pcRef.current) {
      const state = pcRef.current.connectionState;
      if (state === 'closed' || state === 'failed') {
        console.warn('[WebRTC] Discarding stale PeerConnection (state:', state, ')');
        pcRef.current = null;
      } else {
        return pcRef.current;
      }
    }

    // Reset ICE buffer for new connection
    iceCandidateBuffer.current = [];
    remoteDescriptionSet.current = false;

    console.log('[WebRTC] Creating new PeerConnection with config:', JSON.stringify(RTC_CONFIG));
    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current = pc;

    // Attach local media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
        console.log('[DirectCall] Added local track to peer connection:', track.kind, track.id);
      });
    }

    // Handle incoming ICE candidate
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('CALL_ICE_CANDIDATE', {
          callId,
          candidate: event.candidate
        });
      }
    };

    // Handle remote track
    pc.ontrack = (event) => {
      console.log('[DirectCall] Remote track received:', event.track.kind, event.track.id, 'readyState:', event.track.readyState);
      if (event.streams && event.streams[0]) {
        remoteStreamRef.current = event.streams[0];
      } else {
        if (!remoteStreamRef.current) {
          remoteStreamRef.current = new MediaStream();
        }
        remoteStreamRef.current.addTrack(event.track);
      }
    };

    // Monitor WebRTC Connection State
    pc.onconnectionstatechange = () => {
      if (!pc) return;
      console.log('[WebRTC] connectionState:', pc.connectionState);
      switch (pc.connectionState) {
        case 'connected':
          setConnectionStatus('Connected');
          break;
        case 'connecting':
          setConnectionStatus('Connecting...');
          break;
        case 'disconnected':
          setConnectionStatus('Reconnecting...');
          // Don't immediately cleanup — WebRTC may recover
          break;
        case 'failed':
          setConnectionStatus('Disconnected');
          toast.error('Call connection lost');
          cleanupCall();
          break;
        case 'closed':
          setConnectionStatus('Closed');
          break;
        default:
          break;
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (!pc) return;
      console.log('[WebRTC] iceConnectionState:', pc.iceConnectionState);
    };

    pc.onsignalingstatechange = () => {
      if (!pc) return;
      console.log('[WebRTC] signalingState:', pc.signalingState);
    };

    return pc;
  }, [cleanupCall]);

  // Get User Media Helper
  const acquireLocalMedia = async (callType) => {
    try {
      const audioConstraint = (selectedDevices.audioInputId && typeof selectedDevices.audioInputId === 'string' && selectedDevices.audioInputId.trim() !== '')
        ? { deviceId: { exact: selectedDevices.audioInputId } }
        : true;
      const videoConstraint = callType === 'video'
        ? ((selectedDevices.videoInputId && typeof selectedDevices.videoInputId === 'string' && selectedDevices.videoInputId.trim() !== '')
            ? { deviceId: { exact: selectedDevices.videoInputId } }
            : true)
        : false;

      const constraints = {
        audio: audioConstraint,
        video: videoConstraint
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      const audioTracks = stream.getAudioTracks();
      const videoTracks = stream.getVideoTracks();
      console.log(`[DirectCall] Local media acquired (type: ${callType}):`, {
        audioTracks: audioTracks.map(t => ({ id: t.id, enabled: t.enabled, readyState: t.readyState })),
        videoTracks: videoTracks.map(t => ({ id: t.id, enabled: t.enabled, readyState: t.readyState }))
      });
      if (audioTracks.length > 0) {
        console.log('[DirectCall] Local audio track created:', audioTracks[0].id, 'enabled:', audioTracks[0].enabled);
      }
      await updateDeviceList();
      return stream;
    } catch (err) {
      console.error('Error acquiring local media:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        if (callType === 'video') {
          toast.error('Camera/Microphone permission denied. Attempting voice-only...');
          try {
            const voiceStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            localStreamRef.current = voiceStream;
            setIsCameraOff(true);
            return voiceStream;
          } catch (voiceErr) {
            toast.error('Microphone permission denied. Unable to start call.');
            throw voiceErr;
          }
        } else {
          toast.error('Microphone permission denied.');
          throw err;
        }
      }
      throw err;
    }
  };

  // Socket Signaling Event Listeners
  // IMPORTANT: Do NOT include callState in deps — it causes listener teardown during state transitions
  // which creates race conditions (e.g., CALL_OFFER missed during RINGING→CONNECTED transition)
  useEffect(() => {
    if (!socket) return;

    // Incoming Call Notification
    const handleIncomingCall = ({ callId, conversationId, caller, callType }) => {
      if (callStateRef.current !== 'IDLE') return; // Handled by server busy check as fallback
      setCallData({ callId, conversationId, peerUser: caller, callType });
      setCallState('RINGING');
      setIsCameraOff(callType !== 'video');
    };

    // Outgoing Call Ack
    const handleOutgoingAck = ({ callId, conversationId, callee, callType }) => {
      setCallData(prev => ({
        ...prev,
        callId,
        conversationId,
        peerUser: callee || prev?.peerUser,
        callType
      }));
      setCallState('OUTGOING');
    };

    // Call Error from Server
    const handleCallError = ({ message }) => {
      console.warn('[DirectCall] CALL_ERROR:', message);
      toast.error(message || 'Call failed');
      cleanupCall();
    };

    // Call Accepted — Caller creates WebRTC Offer
    const handleCallAccepted = async ({ callId }) => {
      console.log('[DirectCall] Call accepted, creating offer for callId:', callId);
      setCallState('CONNECTED');
      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

      try {
        const pc = createPeerConnection(callId);
        const offer = await pc.createOffer();
        console.log('[WebRTC] Offer created');
        await pc.setLocalDescription(offer);
        console.log('[WebRTC] Local description set (offer)');
        socket.emit('CALL_OFFER', { callId, sdp: pc.localDescription });
      } catch (err) {
        console.error('Error creating WebRTC offer:', err);
        toast.error('Failed to establish media connection');
        cleanupCall();
      }
    };

    // WebRTC Offer received (Callee side)
    const handleCallOffer = async ({ callId, sdp }) => {
      console.log('[DirectCall] Received CALL_OFFER for callId:', callId);
      try {
        const pc = createPeerConnection(callId);
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        console.log('[WebRTC] Remote description set (offer)');
        remoteDescriptionSet.current = true;
        // Flush any ICE candidates that arrived before the offer
        await flushIceCandidateBuffer();

        const answer = await pc.createAnswer();
        console.log('[WebRTC] Answer created');
        await pc.setLocalDescription(answer);
        console.log('[WebRTC] Local description set (answer)');
        socket.emit('CALL_ANSWER', { callId, sdp: pc.localDescription });
      } catch (err) {
        console.error('Error handling WebRTC offer:', err);
      }
    };

    // WebRTC Answer received (Caller side)
    const handleCallAnswer = async ({ sdp }) => {
      console.log('[DirectCall] Received CALL_ANSWER');
      try {
        if (pcRef.current) {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
          console.log('[WebRTC] Remote description set (answer)');
          remoteDescriptionSet.current = true;
          // Flush any ICE candidates that arrived before the answer
          await flushIceCandidateBuffer();
        }
      } catch (err) {
        console.error('Error handling WebRTC answer:', err);
      }
    };

    // ICE Candidate received — buffer if remote description not yet set
    const handleIceCandidate = async ({ candidate }) => {
      try {
        if (!candidate) return;
        if (!pcRef.current || !remoteDescriptionSet.current) {
          // Buffer the candidate — it arrived before the remote description
          console.log('[WebRTC] Buffering ICE candidate (remote description not yet set)');
          iceCandidateBuffer.current.push(candidate);
          return;
        }
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('[WebRTC] Error adding ICE candidate:', err);
      }
    };

    // Call Rejected / Cancelled / Busy / Timeout / Ended
    const handleCallRejected = ({ message }) => {
      toast.error(message || 'Call declined');
      cleanupCall();
    };

    const handleCallCancelled = ({ message }) => {
      toast.error(message || 'Call cancelled');
      cleanupCall();
    };

    const handleCallBusy = ({ message }) => {
      toast.error(message || 'User is busy on another call');
      cleanupCall();
    };

    const handleCallTimeout = ({ message }) => {
      toast.error(message || 'No answer');
      cleanupCall();
    };

    const handleCallEnded = ({ reason }) => {
      toast(reason ? `Call ended: ${reason}` : 'Call ended');
      cleanupCall();
    };

    // Peer Camera / Mic Toggles
    const handlePeerCameraToggle = ({ enabled }) => {
      setPeerCameraOff(!enabled);
    };

    const handlePeerMicToggle = ({ enabled }) => {
      setPeerMuted(!enabled);
    };

    // Subscribe to Socket Events
    socket.on('CALL_INCOMING', handleIncomingCall);
    socket.on('CALL_OUTGOING_ACK', handleOutgoingAck);
    socket.on('CALL_ERROR', handleCallError);
    socket.on('CALL_ACCEPTED', handleCallAccepted);
    socket.on('CALL_OFFER', handleCallOffer);
    socket.on('CALL_ANSWER', handleCallAnswer);
    socket.on('CALL_ICE_CANDIDATE', handleIceCandidate);
    socket.on('CALL_REJECTED', handleCallRejected);
    socket.on('CALL_CANCELLED', handleCallCancelled);
    socket.on('CALL_BUSY', handleCallBusy);
    socket.on('CALL_TIMEOUT', handleCallTimeout);
    socket.on('CALL_ENDED', handleCallEnded);
    socket.on('CALL_CAMERA_TOGGLE', handlePeerCameraToggle);
    socket.on('CALL_MIC_TOGGLE', handlePeerMicToggle);

    return () => {
      socket.off('CALL_INCOMING', handleIncomingCall);
      socket.off('CALL_OUTGOING_ACK', handleOutgoingAck);
      socket.off('CALL_ERROR', handleCallError);
      socket.off('CALL_ACCEPTED', handleCallAccepted);
      socket.off('CALL_OFFER', handleCallOffer);
      socket.off('CALL_ANSWER', handleCallAnswer);
      socket.off('CALL_ICE_CANDIDATE', handleIceCandidate);
      socket.off('CALL_REJECTED', handleCallRejected);
      socket.off('CALL_CANCELLED', handleCallCancelled);
      socket.off('CALL_BUSY', handleCallBusy);
      socket.off('CALL_TIMEOUT', handleCallTimeout);
      socket.off('CALL_ENDED', handleCallEnded);
      socket.off('CALL_CAMERA_TOGGLE', handlePeerCameraToggle);
      socket.off('CALL_MIC_TOGGLE', handlePeerMicToggle);
    };
  }, [socket, cleanupCall, createPeerConnection, flushIceCandidateBuffer]);

  // Initiate Call Action
  const initiateCall = async ({ targetUser, conversationId, type = 'voice' }) => {
    const targetUserId = typeof targetUser === 'string' ? targetUser : (targetUser?._id || targetUser?.id);
    if (!targetUserId || !conversationId) {
      console.warn('[DirectCall] Missing targetUser or conversationId:', { targetUser, conversationId });
      toast.error('Unable to start call: Target user not found');
      return;
    }
    if (callStateRef.current !== 'IDLE') {
      toast.error('You are already in a call');
      return;
    }
    if (!socket || !socket.connected) {
      toast.error('Unable to place call: Network disconnected. Reconnecting...');
      return;
    }

    try {
      await acquireLocalMedia(type);
      setIsCameraOff(type !== 'video');
      
      const peerObj = (typeof targetUser === 'object' && targetUser !== null)
        ? targetUser
        : { _id: targetUserId, name: 'Contact' };

      setCallData({ conversationId, peerUser: peerObj, callType: type });
      setCallState('OUTGOING');

      socket.emit('CALL_INITIATE', {
        calleeId: targetUserId,
        conversationId,
        callType: type
      });
    } catch (err) {
      console.error('Call initiation failed:', err);
      toast.error(err.message || 'Could not access microphone/camera');
      cleanupCall();
    }
  };

  // Accept Call Action
  const acceptCall = async () => {
    if (!callDataRef.current?.callId) return;
    try {
      await acquireLocalMedia(callDataRef.current.callType);
      
      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

      socket.emit('CALL_ACCEPT', { callId: callDataRef.current.callId });
      setCallState('CONNECTED');
    } catch (err) {
      console.error('Failed to accept call:', err);
      rejectCall();
    }
  };

  // Reject Call Action
  const rejectCall = () => {
    if (callDataRef.current?.callId && socketRef.current) {
      socketRef.current.emit('CALL_REJECT', { callId: callDataRef.current.callId });
    }
    cleanupCall();
  };

  // Cancel Call Action (Caller)
  const cancelCall = () => {
    if (callDataRef.current?.callId && socketRef.current) {
      socketRef.current.emit('CALL_CANCEL', { callId: callDataRef.current.callId });
    }
    cleanupCall();
  };

  // End Call Action
  const endCall = () => {
    if (callDataRef.current?.callId && socketRef.current) {
      socketRef.current.emit('CALL_END', { callId: callDataRef.current.callId });
    }
    cleanupCall();
  };

  // Toggle Microphone
  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        const muted = !audioTrack.enabled;
        setIsMuted(muted);
        if (callDataRef.current?.callId && socketRef.current) {
          socketRef.current.emit('CALL_MIC_TOGGLE', { callId: callDataRef.current.callId, enabled: !muted });
        }
      }
    }
  };

  // Toggle Camera
  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        const off = !videoTrack.enabled;
        setIsCameraOff(off);
        if (callDataRef.current?.callId && socketRef.current) {
          socketRef.current.emit('CALL_CAMERA_TOGGLE', { callId: callDataRef.current.callId, enabled: !off });
        }
      }
    }
  };

  // Screen Sharing
  const startScreenShare = async () => {
    if (!pcRef.current) return;
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenStreamRef.current = screenStream;
      const screenTrack = screenStream.getVideoTracks()[0];

      const sender = pcRef.current.getSenders().find(s => s.track && s.track.kind === 'video');
      if (sender) {
        sender.replaceTrack(screenTrack);
      } else {
        pcRef.current.addTrack(screenTrack, screenStream);
      }

      setIsScreenSharing(true);

      screenTrack.onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      console.warn('Screen share error/cancelled:', err);
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
    }

    if (pcRef.current && localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      const sender = pcRef.current.getSenders().find(s => s.track && s.track.kind === 'video');
      if (sender && videoTrack) {
        sender.replaceTrack(videoTrack);
      }
    }
    setIsScreenSharing(false);
  };

  return (
    <DirectCallContext.Provider
      value={{
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
        availableDevices,
        selectedDevices,
        initiateCall,
        acceptCall,
        rejectCall,
        cancelCall,
        endCall,
        toggleMic,
        toggleCamera,
        startScreenShare,
        stopScreenShare,
        setIsMinimized
      }}
    >
      {children}
    </DirectCallContext.Provider>
  );
};
