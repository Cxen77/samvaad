import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const DirectCallContext = createContext();

export const useDirectCall = () => useContext(DirectCallContext);

const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

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
  const cleanupCall = () => {
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
      pcRef.current.close();
      pcRef.current = null;
    }

    // 6. Reset State
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
  };

  // Initialize WebRTC PeerConnection
  const createPeerConnection = (callId) => {
    if (pcRef.current) return pcRef.current;

    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current = pc;

    // Attach local media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Handle incoming ICE candidate
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('CALL_ICE_CANDIDATE', {
          callId,
          candidate: event.candidate
        });
      }
    };

    // Handle remote track
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        remoteStreamRef.current = event.streams[0];
      } else {
        const stream = new MediaStream();
        stream.addTrack(event.track);
        remoteStreamRef.current = stream;
      }
    };

    // Monitor WebRTC Connection State
    pc.onconnectionstatechange = () => {
      if (!pc) return;
      switch (pc.connectionState) {
        case 'connected':
          setConnectionStatus('Connected');
          break;
        case 'connecting':
          setConnectionStatus('Connecting...');
          break;
        case 'disconnected':
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

    return pc;
  };

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
  useEffect(() => {
    if (!socket) return;

    // Incoming Call Notification
    const handleIncomingCall = ({ callId, conversationId, caller, callType }) => {
      if (callState !== 'IDLE') return; // Handled by server busy check as fallback
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

    // Call Accepted
    const handleCallAccepted = async ({ callId }) => {
      setCallState('CONNECTED');
      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

      // Caller creates WebRTC Offer
      try {
        const pc = createPeerConnection(callId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('CALL_OFFER', { callId, sdp: pc.localDescription });
      } catch (err) {
        console.error('Error creating WebRTC offer:', err);
        toast.error('Failed to establish media connection');
        cleanupCall();
      }
    };

    // WebRTC Offer received (Callee side)
    const handleCallOffer = async ({ callId, sdp }) => {
      try {
        const pc = createPeerConnection(callId);
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('CALL_ANSWER', { callId, sdp: pc.localDescription });
      } catch (err) {
        console.error('Error handling WebRTC offer:', err);
      }
    };

    // WebRTC Answer received (Caller side)
    const handleCallAnswer = async ({ sdp }) => {
      try {
        if (pcRef.current) {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
        }
      } catch (err) {
        console.error('Error handling WebRTC answer:', err);
      }
    };

    // ICE Candidate received
    const handleIceCandidate = async ({ candidate }) => {
      try {
        if (pcRef.current && candidate) {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.error('Error adding ICE candidate:', err);
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
  }, [socket, callState]);

  // Initiate Call Action
  const initiateCall = async ({ targetUser, conversationId, type = 'voice' }) => {
    const targetUserId = typeof targetUser === 'string' ? targetUser : (targetUser?._id || targetUser?.id);
    if (!targetUserId || !conversationId) {
      console.warn('[DirectCall] Missing targetUser or conversationId:', { targetUser, conversationId });
      toast.error('Unable to start call: Target user not found');
      return;
    }
    if (callState !== 'IDLE') {
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
    if (!callData?.callId) return;
    try {
      await acquireLocalMedia(callData.callType);
      
      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

      socket.emit('CALL_ACCEPT', { callId: callData.callId });
      setCallState('CONNECTED');
    } catch (err) {
      console.error('Failed to accept call:', err);
      rejectCall();
    }
  };

  // Reject Call Action
  const rejectCall = () => {
    if (callData?.callId && socket) {
      socket.emit('CALL_REJECT', { callId: callData.callId });
    }
    cleanupCall();
  };

  // Cancel Call Action (Caller)
  const cancelCall = () => {
    if (callData?.callId && socket) {
      socket.emit('CALL_CANCEL', { callId: callData.callId });
    }
    cleanupCall();
  };

  // End Call Action
  const endCall = () => {
    if (callData?.callId && socket) {
      socket.emit('CALL_END', { callId: callData.callId });
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
        if (callData?.callId && socket) {
          socket.emit('CALL_MIC_TOGGLE', { callId: callData.callId, enabled: !muted });
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
        if (callData?.callId && socket) {
          socket.emit('CALL_CAMERA_TOGGLE', { callId: callData.callId, enabled: !off });
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
