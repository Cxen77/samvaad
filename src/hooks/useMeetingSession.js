import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSamvaad } from '../context/SamvaadContext';
import { useSocket } from '../context/SocketContext';
import { useMeetingChat } from './useMeetingChat';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { saveRecordingBlob, calculateBlobSha256, getSupportedMimeType } from '../services/recordingStorageService';

/**
 * Central meeting session hook — single source of truth for the entire meeting room.
 * All panels and components consume this shared state.
 */
export const useMeetingSession = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { getMeeting, completeMeeting, addAuditLog } = useSamvaad();
  const { socket } = useSocket();

  // ================================================================
  // MEETING DATA
  // ================================================================
  const existingMeeting = getMeeting(roomId);
  const [remoteMeeting, setRemoteMeeting] = useState(null);

  useEffect(() => {
    if (!existingMeeting && roomId) {
      api.get(`/samvaad/meetings/${roomId}`)
        .then(res => {
          if (res.data?.success && res.data?.meeting) {
            setRemoteMeeting(res.data.meeting);
          }
        })
        .catch(() => {});
    }
  }, [roomId, existingMeeting]);

  const meeting = existingMeeting || remoteMeeting || {
    id: roomId || 'UNKNOWN',
    title: 'AICTE Committee Hearing',
    institute: 'AICTE Institution',
    applicationId: 'AICTE-APP-2026-00000',
    securityLevel: 'Confidential',
    password: 'N/A',
    watermark: true,
    status: 'LIVE',
    participantsList: [],
    documents: []
  };

  const isMeetingSealed = meeting.status === 'ENDED' || meeting.status === 'completed';

  // ================================================================
  // WebRTC CONFIGURATION & REFS
  // ================================================================
  const RTC_CONFIG = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' }
    ]
  };

  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const videoRef = useRef(null);
  const screenVideoRef = useRef(null);

  const peerConnectionsRef = useRef(new Map()); // socketId -> RTCPeerConnection
  const remoteStreamsRef = useRef(new Map());   // socketId -> MediaStream
  const pendingCandidatesRef = useRef(new Map()); // socketId -> Array<candidate>

  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [activeSpeakerId, setActiveSpeakerId] = useState(null);
  const [pinnedSpeakerId, setPinnedSpeakerId] = useState(null);
  const [speakingMap, setSpeakingMap] = useState({});

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Close all WebRTC Peer Connections
  const closeAllPeerConnections = useCallback(() => {
    peerConnectionsRef.current.forEach(pc => {
      try { pc.close(); } catch {}
    });
    peerConnectionsRef.current.clear();
    remoteStreamsRef.current.clear();
    pendingCandidatesRef.current.clear();
    setRemoteStreams({});
  }, []);

  // Stop all active media tracks
  const stopAllMediaTracks = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
    }
    setLocalStream(null);
    if (videoRef.current) videoRef.current.srcObject = null;
    closeAllPeerConnections();
  }, [closeAllPeerConnections]);

  // Create or retrieve PeerConnection for a specific remote socket
  const createPeerConnection = useCallback((targetSocketId) => {
    if (peerConnectionsRef.current.has(targetSocketId)) {
      return peerConnectionsRef.current.get(targetSocketId);
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);

    // Add existing local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('samvaad:webrtc_ice_candidate', {
          candidate: event.candidate,
          to: targetSocketId,
          roomId
        });
      }
    };

    pc.ontrack = (event) => {
      let stream = event.streams && event.streams[0];
      if (!stream) {
        const existing = remoteStreamsRef.current.get(targetSocketId);
        if (existing) {
          existing.addTrack(event.track);
          stream = existing;
        } else {
          stream = new MediaStream([event.track]);
        }
      }
      remoteStreamsRef.current.set(targetSocketId, stream);
      setRemoteStreams(prev => ({ ...prev, [targetSocketId]: stream }));
    };

    peerConnectionsRef.current.set(targetSocketId, pc);
    return pc;
  }, [socket, roomId]);

  // Process queued ICE candidates
  const processPendingCandidates = async (targetSocketId, pc) => {
    const queue = pendingCandidatesRef.current.get(targetSocketId) || [];
    for (const candidate of queue) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn('ICE candidate process error:', e);
      }
    }
    pendingCandidatesRef.current.delete(targetSocketId);
  };

  // Track whether local media is ready
  const localStreamReadyRef = useRef(false);
  const pendingParticipantsRef = useRef([]);

  // Connect to new participants — only runs when local stream is ready
  const connectToNewParticipants = useCallback((list) => {
    if (!socket || !Array.isArray(list)) return;

    // If local stream isn't ready yet, save this list for later
    if (!localStreamRef.current) {
      pendingParticipantsRef.current = list;
      return;
    }

    list.forEach(p => {
      const sid = p.socketId;
      if (sid && sid !== socket.id && sid !== 'local') {
        if (!peerConnectionsRef.current.has(sid)) {
          const pc = createPeerConnection(sid);
          // Both sides create the PC, but only the initiator sends the offer
          const isInitiator = socket.id < sid;
          if (isInitiator) {
            pc.createOffer()
              .then(offer => pc.setLocalDescription(offer))
              .then(() => {
                socket.emit('samvaad:webrtc_offer', {
                  offer: pc.localDescription,
                  to: sid,
                  roomId
                });
              })
              .catch(e => console.warn('WebRTC offer error:', e));
          }
        }
      }
    });
  }, [socket, roomId, createPeerConnection]);

  // Init camera/mic
  useEffect(() => {
    let mounted = true;
    navigator.mediaDevices?.getUserMedia({ video: true, audio: true })
      .then(stream => {
        if (!mounted) { stream.getTracks().forEach(t => t.stop()); return; }
        localStreamRef.current = stream;
        localStreamReadyRef.current = true;
        setLocalStream(stream);
        if (videoRef.current) videoRef.current.srcObject = stream;

        // Propagate tracks to any peer connections created before stream was ready
        peerConnectionsRef.current.forEach(pc => {
          const senders = pc.getSenders();
          stream.getTracks().forEach(track => {
            const sender = senders.find(s => s.track && s.track.kind === track.kind);
            if (sender) {
              sender.replaceTrack(track);
            } else {
              pc.addTrack(track, stream);
            }
          });
        });

        // Now connect to any participants that arrived before the stream was ready
        if (pendingParticipantsRef.current.length > 0) {
          const pending = pendingParticipantsRef.current;
          pendingParticipantsRef.current = [];
          connectToNewParticipants(pending);
        }
      })
      .catch(e => {
        console.warn('Media access:', e.message);
        if (e.name === 'NotAllowedError') toast.error('Camera/microphone access denied');
      });

    return () => { mounted = false; stopAllMediaTracks(); };
  }, [roomId, stopAllMediaTracks, connectToNewParticipants]);

  // Real-time Voice Activity Detection (Analyses local microphone volume)
  useEffect(() => {
    if (!localStreamRef.current || isMuted) {
      setSpeakingMap(prev => ({ ...prev, local: false, [currentUser?._id]: false }));
      return;
    }
    let audioContext = null;
    let analyser = null;
    let microphone = null;
    let animFrame = null;
    let wasSpeaking = false;

    try {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (!audioTracks || audioTracks.length === 0 || !audioTracks[0].enabled) return;

      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const mediaStream = new MediaStream([audioTracks[0]]);
      microphone = audioContext.createMediaStreamSource(mediaStream);
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      microphone.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkSpeaking = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
        const avg = sum / bufferLength;
        const isSpeakingNow = avg > 18;

        if (isSpeakingNow !== wasSpeaking) {
          wasSpeaking = isSpeakingNow;
          setSpeakingMap(prev => ({
            ...prev,
            local: isSpeakingNow,
            ...(currentUser?._id ? { [currentUser._id]: isSpeakingNow } : {})
          }));
          if (socket && roomId) {
            socket.emit('samvaad:speaking_changed', { roomId, isSpeaking: isSpeakingNow });
          }
          if (isSpeakingNow) {
            setActiveSpeakerId(prev => (pinnedSpeakerId ? prev : (currentUser?._id || 'local')));
            if (socket && roomId) {
              socket.emit('samvaad:active_speaker', { roomId, activeSpeakerId: currentUser?._id || socket.id });
            }
          }
        }
        animFrame = requestAnimationFrame(checkSpeaking);
      };
      checkSpeaking();
    } catch (e) {
      console.warn('Audio analyser error:', e);
    }

    return () => {
      if (animFrame) cancelAnimationFrame(animFrame);
      if (microphone) microphone.disconnect();
      if (audioContext && audioContext.state !== 'closed') audioContext.close();
    };
  }, [isMuted, roomId, socket, currentUser, pinnedSpeakerId]);

  // Toggle mic
  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = !next; });
      }
      if (socket && roomId) socket.emit('samvaad:mic_changed', { roomId, mic: !next });
      return next;
    });
  }, [socket, roomId]);

  // Toggle camera
  const toggleVideo = useCallback(() => {
    setIsVideoOff(prev => {
      const next = !prev;
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = !next; });
      }
      if (socket && roomId) socket.emit('samvaad:cam_changed', { roomId, cam: !next });
      return next;
    });
  }, [socket, roomId]);

  // Toggle screen share
  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);
      if (socket && roomId) socket.emit('samvaad:screen_share_stopped', { roomId });
      toast.success('Stopped screen sharing');
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = stream;
        setIsScreenSharing(true);
        if (socket && roomId) socket.emit('samvaad:screen_share_started', { roomId });
        toast.success('You are sharing your screen');
        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          screenStreamRef.current = null;
          if (socket && roomId) socket.emit('samvaad:screen_share_stopped', { roomId });
        };
      } catch {
        toast.error('Screen share cancelled or not allowed');
      }
    }
  }, [isScreenSharing, socket, roomId]);

  // Listen for force mute from host
  useEffect(() => {
    if (!socket) return;
    const handleForceMute = () => {
      setIsMuted(true);
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = false; });
      }
      toast('You have been muted by the host', { icon: '🔇' });
    };
    socket.on('samvaad:force_mute', handleForceMute);
    return () => socket.off('samvaad:force_mute', handleForceMute);
  }, [socket]);

  // Stable refs so socket useEffect doesn't re-run on every useCallback change
  const connectToNewParticipantsRef = useRef(connectToNewParticipants);
  const createPeerConnectionRef = useRef(createPeerConnection);
  useEffect(() => { connectToNewParticipantsRef.current = connectToNewParticipants; }, [connectToNewParticipants]);
  useEffect(() => { createPeerConnectionRef.current = createPeerConnection; }, [createPeerConnection]);

  // ================================================================
  // PARTICIPANTS
  // ================================================================
  const [participants, setParticipants] = useState([{
    id: currentUser?._id || 'local',
    name: currentUser?.name || 'You',
    role: currentUser?.role || 'Member',
    mic: true, cam: true, handRaised: false, isHost: true,
    status: 'joined', socketId: 'local'
  }]);

  // ================================================================
  // SOCKET ROOM & REAL-TIME EVENTS
  // ================================================================
  useEffect(() => {
    if (!socket || !roomId) return;

    socket.emit('samvaad:join_room', { roomId, user: currentUser });

    const handleParticipantsUpdated = ({ roomId: rId, participants: list }) => {
      if (rId === roomId && Array.isArray(list) && list.length > 0) {
        setParticipants(list);
        connectToNewParticipantsRef.current(list);
      }
    };

    const handleRoomState = ({ participants: list, isLocked: locked, settings: s, activeVote }) => {
      if (Array.isArray(list) && list.length > 0) {
        setParticipants(list);
        connectToNewParticipantsRef.current(list);
      }
      setIsLocked(locked || false);
      if (s) setMeetingSettings(prev => ({ ...prev, ...s }));
      if (activeVote) setVoteState(activeVote);
    };

    const handleMeetingEnded = ({ roomId: rId }) => {
      if (rId === roomId) {
        toast.error('The host has ended this meeting.');
        stopAllMediaTracks();
        setShowSummaryScreen(true);
      }
    };

    const handleJoinRejected = ({ reason }) => {
      toast.error(reason || 'Cannot join this meeting.');
      navigate('/');
    };

    const handleRemovedFromMeeting = () => {
      toast.error('You have been removed from this meeting.');
      stopAllMediaTracks();
      navigate('/');
    };

    const handleUserLeft = ({ socketId: sid }) => {
      const pc = peerConnectionsRef.current.get(sid);
      if (pc) {
        try { pc.close(); } catch {}
        peerConnectionsRef.current.delete(sid);
      }
      remoteStreamsRef.current.delete(sid);
      setRemoteStreams(prev => {
        const next = { ...prev };
        delete next[sid];
        return next;
      });
    };

    // WebRTC Signaling Listeners
    const handleWebrtcOffer = async ({ offer, from, roomId: rId }) => {
      if (rId && rId !== roomId || !from || !offer) return;
      try {
        let pc = peerConnectionsRef.current.get(from);
        if (!pc) {
          pc = createPeerConnectionRef.current(from);
        }

        // Handle glare if offer arrives when already have local offer
        if (pc.signalingState !== "stable") {
          const isPolite = socket.id > from;
          if (!isPolite) {
            console.warn("Ignoring offer collision as impolite peer");
            return;
          }
          await pc.setLocalDescription({ type: "rollback" });
        }

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        await processPendingCandidates(from, pc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('samvaad:webrtc_answer', { answer, to: from, roomId });
      } catch (err) {
        console.warn('WebRTC offer handling error:', err);
      }
    };

    const handleWebrtcAnswer = async ({ answer, from, roomId: rId }) => {
      if (rId && rId !== roomId || !from || !answer) return;
      try {
        const pc = peerConnectionsRef.current.get(from);
        if (pc && pc.signalingState === "have-local-offer") {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          await processPendingCandidates(from, pc);
        }
      } catch (err) {
        console.warn('WebRTC answer handling error:', err);
      }
    };

    const handleWebrtcIceCandidate = async ({ candidate, from, roomId: rId }) => {
      if (rId && rId !== roomId) return;
      try {
        const pc = peerConnectionsRef.current.get(from);
        if (pc && pc.remoteDescription && pc.remoteDescription.type) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          const queue = pendingCandidatesRef.current.get(from) || [];
          queue.push(candidate);
          pendingCandidatesRef.current.set(from, queue);
        }
      } catch (err) {
        console.warn('WebRTC ICE candidate handling error:', err);
      }
    };

    // Speaking state changes
    const handleSpeakingChanged = ({ socketId: sid, userId, isSpeaking }) => {
      setSpeakingMap(prev => ({
        ...prev,
        [sid]: isSpeaking,
        ...(userId ? { [userId]: isSpeaking } : {})
      }));
      if (isSpeaking) {
        setActiveSpeakerId(prev => (pinnedSpeakerId ? prev : (userId || sid)));
      }
    };

    const handleActiveSpeaker = ({ activeSpeakerId: asId }) => {
      if (!pinnedSpeakerId && asId) {
        setActiveSpeakerId(asId);
      }
    };

    // Reactions (temporary overlays)
    const handleReaction = ({ socketId: sid, userName, emoji, timestamp }) => {
      setReactions(prev => [...prev, { id: timestamp + sid, socketId: sid, userName, emoji, timestamp }]);
      setTimeout(() => {
        setReactions(prev => prev.filter(r => r.id !== timestamp + sid));
      }, 3000);
    };

    // Hand raise
    const handleHandRaised = ({ socketId: sid, userName }) => {
      if (sid !== socket.id) toast(`✋ ${userName} raised their hand`, { icon: '✋' });
    };

    // Meeting lock/unlock
    const handleMeetingLocked = () => { setIsLocked(true); toast('Meeting has been locked', { icon: '🔒' }); };
    const handleMeetingUnlocked = () => { setIsLocked(false); toast('Meeting has been unlocked', { icon: '🔓' }); };

    // Settings
    const handleSettingsChanged = ({ settings: s, changedBy }) => {
      setMeetingSettings(prev => ({ ...prev, ...s }));
      toast(`Meeting settings updated by ${changedBy}`, { icon: '⚙️' });
    };

    // Voting
    const handleVoteStarted = ({ vote }) => {
      setVoteState(vote);
      setHasVoted(false);
      setMyVote(null);
      toast('📊 A committee vote has started!', { icon: '📊' });
    };

    const handleVoteUpdated = (data) => {
      setVoteState(prev => prev ? { ...prev, ...data } : null);
    };

    const handleVoteClosed = ({ result }) => {
      setVoteResult(result);
      setVoteState(null);
      toast(`📊 Vote closed — Decision: ${result.decision}`, { icon: '📊' });
    };

    const handleVoteConfirmed = ({ option }) => {
      setHasVoted(true);
      setMyVote(option);
      toast.success(`Vote recorded: ${option}`);
    };

    const handleVoteError = ({ message }) => {
      toast.error(message);
    };

    socket.on('samvaad:participants_updated', handleParticipantsUpdated);
    socket.on('samvaad:room_state', handleRoomState);
    socket.on('samvaad:meeting_ended', handleMeetingEnded);
    socket.on('samvaad:join_rejected', handleJoinRejected);
    socket.on('samvaad:removed_from_meeting', handleRemovedFromMeeting);
    socket.on('samvaad:user_left', handleUserLeft);
    socket.on('samvaad:webrtc_offer', handleWebrtcOffer);
    socket.on('samvaad:webrtc_answer', handleWebrtcAnswer);
    socket.on('samvaad:webrtc_ice_candidate', handleWebrtcIceCandidate);
    socket.on('samvaad:speaking_changed', handleSpeakingChanged);
    socket.on('samvaad:active_speaker', handleActiveSpeaker);
    socket.on('samvaad:reaction', handleReaction);
    socket.on('samvaad:hand_raised', handleHandRaised);
    socket.on('samvaad:meeting_locked', handleMeetingLocked);
    socket.on('samvaad:meeting_unlocked', handleMeetingUnlocked);
    socket.on('samvaad:settings_changed', handleSettingsChanged);
    socket.on('samvaad:vote_started', handleVoteStarted);
    socket.on('samvaad:vote_updated', handleVoteUpdated);
    socket.on('samvaad:vote_closed', handleVoteClosed);
    socket.on('samvaad:vote_confirmed', handleVoteConfirmed);
    socket.on('samvaad:vote_error', handleVoteError);

    return () => {
      socket.emit('samvaad:leave_room', { roomId });
      socket.off('samvaad:participants_updated', handleParticipantsUpdated);
      socket.off('samvaad:room_state', handleRoomState);
      socket.off('samvaad:meeting_ended', handleMeetingEnded);
      socket.off('samvaad:join_rejected', handleJoinRejected);
      socket.off('samvaad:removed_from_meeting', handleRemovedFromMeeting);
      socket.off('samvaad:user_left', handleUserLeft);
      socket.off('samvaad:webrtc_offer', handleWebrtcOffer);
      socket.off('samvaad:webrtc_answer', handleWebrtcAnswer);
      socket.off('samvaad:webrtc_ice_candidate', handleWebrtcIceCandidate);
      socket.off('samvaad:speaking_changed', handleSpeakingChanged);
      socket.off('samvaad:active_speaker', handleActiveSpeaker);
      socket.off('samvaad:reaction', handleReaction);
      socket.off('samvaad:hand_raised', handleHandRaised);
      socket.off('samvaad:meeting_locked', handleMeetingLocked);
      socket.off('samvaad:meeting_unlocked', handleMeetingUnlocked);
      socket.off('samvaad:settings_changed', handleSettingsChanged);
      socket.off('samvaad:vote_started', handleVoteStarted);
      socket.off('samvaad:vote_updated', handleVoteUpdated);
      socket.off('samvaad:vote_closed', handleVoteClosed);
      socket.off('samvaad:vote_confirmed', handleVoteConfirmed);
      socket.off('samvaad:vote_error', handleVoteError);
    };
  }, [socket, roomId, currentUser, navigate, stopAllMediaTracks, pinnedSpeakerId]);

  // ================================================================
  // HAND RAISE
  // ================================================================
  const [handRaised, setHandRaised] = useState(false);

  const toggleHandRaise = useCallback(() => {
    setHandRaised(prev => {
      const next = !prev;
      if (socket && roomId) {
        socket.emit(next ? 'samvaad:hand_raised' : 'samvaad:hand_lowered', { roomId });
      }
      return next;
    });
  }, [socket, roomId]);

  const lowerParticipantHand = useCallback((targetSocketId) => {
    if (socket && roomId) socket.emit('samvaad:lower_hand', { roomId, targetSocketId });
  }, [socket, roomId]);

  // ================================================================
  // REACTIONS
  // ================================================================
  const [reactions, setReactions] = useState([]);

  const sendReaction = useCallback((emoji) => {
    if (socket && roomId) socket.emit('samvaad:reaction', { roomId, emoji });
  }, [socket, roomId]);

  // ================================================================
  // MEETING LOCK
  // ================================================================
  const [isLocked, setIsLocked] = useState(false);

  const toggleMeetingLock = useCallback(() => {
    if (!socket || !roomId) return;
    if (isLocked) {
      socket.emit('samvaad:unlock_meeting', { roomId });
    } else {
      socket.emit('samvaad:lock_meeting', { roomId });
    }
  }, [socket, roomId, isLocked]);

  // ================================================================
  // MEETING SETTINGS
  // ================================================================
  const [meetingSettings, setMeetingSettings] = useState({
    chatEnabled: true,
    screenShareEnabled: true,
    reactionsEnabled: true,
    waitingRoomEnabled: true,
    watermarkEnabled: true
  });

  const updateMeetingSettings = useCallback((updates) => {
    if (socket && roomId) {
      socket.emit('samvaad:settings_changed', { roomId, settings: updates });
    }
  }, [socket, roomId]);

  // ================================================================
  // VOTING
  // ================================================================
  const [voteState, setVoteState] = useState(null);
  const [voteResult, setVoteResult] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [myVote, setMyVote] = useState(null);

  const startVote = useCallback(({ question, options, isAnonymous }) => {
    if (socket && roomId) {
      socket.emit('samvaad:vote_start', { roomId, question, options, isAnonymous });
    }
  }, [socket, roomId]);

  const castVote = useCallback((option) => {
    if (socket && roomId) {
      socket.emit('samvaad:vote_cast', { roomId, option });
    }
  }, [socket, roomId]);

  const closeVote = useCallback(() => {
    if (socket && roomId) {
      socket.emit('samvaad:vote_close', { roomId });
    }
  }, [socket, roomId]);

  // ================================================================
  // RECORDING (IndexedDB Binary Persistence + Cryptographic SHA-256 Ledger)
  // ================================================================
  const [isRecording, setIsRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const [isRecPaused, setIsRecPaused] = useState(false);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordingStartTimeRef = useRef(null);
  const recordingMimeTypeRef = useRef('video/webm');

  useEffect(() => {
    let timer;
    if (isRecording && !isRecPaused && !isMeetingSealed) {
      timer = setInterval(() => setRecSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isRecording, isRecPaused, isMeetingSealed]);

  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      // STOP & FINALIZE RECORDING PROPERLY
      toast.loading('Finalizing & saving recording to secure vault...', { id: 'rec-status' });

      try {
        const recorder = mediaRecorderRef.current;
        if (!recorder || recorder.state === 'inactive') {
          setIsRecording(false);
          setIsRecPaused(false);
          toast.dismiss('rec-status');
          return;
        }

        // Wait for MediaRecorder to stop and emit final data chunk
        await new Promise((resolve) => {
          recorder.onstop = () => resolve();
          recorder.stop();
        });

        const mimeType = recordingMimeTypeRef.current || 'video/webm';
        const chunks = recordedChunksRef.current;

        if (!chunks || chunks.length === 0) {
          setIsRecording(false);
          setIsRecPaused(false);
          toast.error('Recording stopped but no video/audio data was captured.', { id: 'rec-status' });
          return;
        }

        const completeBlob = new Blob(chunks, { type: mimeType });

        if (completeBlob.size === 0) {
          setIsRecording(false);
          setIsRecPaused(false);
          toast.error('Recording was empty (0 bytes). Recording not saved.', { id: 'rec-status' });
          return;
        }

        const endTime = new Date();
        const startTime = recordingStartTimeRef.current ? new Date(recordingStartTimeRef.current) : new Date(endTime.getTime() - (recSeconds * 1000));
        const durationSec = Math.max(1, Math.round((endTime.getTime() - startTime.getTime()) / 1000));

        // 1. Calculate Real SHA-256 Hash bit-for-bit from the assembled video Blob
        const sha256Hash = await calculateBlobSha256(completeBlob);
        const recordingId = 'REC-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 7).toUpperCase();

        const recordingMetadata = {
          id: recordingId,
          recordingId,
          meetingId: roomId || 'UNKNOWN',
          meetingTitle: meeting.title || 'AICTE Meeting Recording',
          institute: meeting.institute || '',
          hostId: currentUser?._id || 'host',
          hostName: currentUser?.name || 'Host',
          participants: participants.map(p => ({ userId: p.id, name: p.name, role: p.role })),
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          duration: durationSec,
          mimeType,
          blob: completeBlob,
          fileSize: completeBlob.size,
          sha256Hash,
          integrityStatus: 'verified',
          status: 'processed',
          createdAt: endTime.toISOString(),
        };

        // 2. Persist to IndexedDB (Bypasses localStorage limits and guarantees permanent offline / reload playback)
        await saveRecordingBlob(recordingMetadata);

        // 3. Anchor to Local Blockchain & Audit Ledger
        addAuditLog({
          action: 'RECORDING_HASHED',
          detail: `Recording for "${meeting.title}" anchored to ledger: ${sha256Hash.slice(0, 16)}... (${durationSec}s)`,
          meetingId: roomId,
          hash: sha256Hash
        });

        // 4. Background Server Upload (for multi-device / backend synchronization)
        try {
          const formData = new FormData();
          formData.append('recording', completeBlob, `rec-${roomId}-${Date.now()}.webm`);
          formData.append('recordingId', recordingId);
          formData.append('meetingId', roomId || 'UNKNOWN');
          formData.append('meetingTitle', meeting.title || 'AICTE Meeting Recording');
          formData.append('institute', meeting.institute || '');
          formData.append('hostId', currentUser?._id || 'host');
          formData.append('hostName', currentUser?.name || 'Host');
          formData.append('participants', JSON.stringify(recordingMetadata.participants));
          formData.append('startTime', startTime.toISOString());
          formData.append('endTime', endTime.toISOString());
          formData.append('duration', durationSec);

          await api.post('/evidence/recordings/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 300000,
          }).catch(uploadErr => {
            console.warn('[Recording] Backend upload failed (saved locally to IndexedDB):', uploadErr.message);
          });
        } catch (uploadErr) {
          console.warn('[Recording] Backend sync error:', uploadErr);
        }

        setIsRecording(false);
        setIsRecPaused(false);
        toast.success(`✓ Recording saved & verified (${durationSec}s)`, { id: 'rec-status' });
      } catch (err) {
        console.error('[Recording] Failed to finalize recording:', err);
        setIsRecording(false);
        setIsRecPaused(false);
        toast.error('Failed to finalize recording: ' + err.message, { id: 'rec-status' });
      }
    } else {
      // START RECORDING
      try {
        if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
          toast.error('Meeting recording is not supported in this browser.');
          return;
        }

        let streamToRecord = localStreamRef.current;
        if (!streamToRecord || streamToRecord.getTracks().length === 0 || !streamToRecord.active) {
          try {
            streamToRecord = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          } catch (mediaErr) {
            // Try audio-only if video was blocked
            try {
              streamToRecord = await navigator.mediaDevices.getUserMedia({ audio: true });
              toast('Recording started with audio only (video camera unavailable).', { icon: '🎙️' });
            } catch (audioErr) {
              toast.error('Microphone or camera permission required to record meeting evidence.');
              return;
            }
          }
        }

        const mimeType = getSupportedMimeType();
        recordingMimeTypeRef.current = mimeType;
        recordedChunksRef.current = [];
        recordingStartTimeRef.current = Date.now();

        const recorder = new MediaRecorder(streamToRecord, { mimeType });

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };

        recorder.onerror = (err) => {
          console.error('[MediaRecorder error]', err);
          toast.error('Recording interrupted: ' + (err.error?.message || 'Media stream error'));
        };

        recorder.start(1000); // 1-second chunks
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
        setRecSeconds(0);
        setIsRecPaused(false);
        toast('Evidence Recording Started', { id: 'rec-status', icon: '🔴' });
        addAuditLog({ action: 'RECORDING_STARTED', detail: `Recording started for meeting ${roomId}`, meetingId: roomId });
      } catch (err) {
        console.error('[Recording] Could not start recording:', err);
        toast.error('Could not start recording: ' + err.message, { id: 'rec-status' });
      }
    }
  }, [isRecording, roomId, meeting, currentUser, participants, recSeconds, addAuditLog]);

  const toggleRecPause = useCallback(() => {
    if (!mediaRecorderRef.current) return;
    if (mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsRecPaused(true);
      toast('Recording paused', { id: 'rec-status', icon: '⏸️' });
    } else if (mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsRecPaused(false);
      toast('Recording resumed', { id: 'rec-status', icon: '▶️' });
    }
  }, []);

  const formatRecTime = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // ================================================================
  // LIVE TRANSCRIPTION (Web Speech API + Socket Relay)
  // ================================================================
  const [transcripts, setTranscripts] = useState([]);
  const [interimTranscripts, setInterimTranscripts] = useState({});
  const [isTranscribing, setIsTranscribing] = useState(false);
  const isTranscribingRef = useRef(false);
  const recorderRef = useRef(null);
  const transcriptIdCounter = useRef(0);

  const addTranscript = useCallback((entry) => {
    transcriptIdCounter.current += 1;
    const fullEntry = { 
      id: 'tr-' + Date.now() + '-' + transcriptIdCounter.current, 
      ...entry, 
      time: entry.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    setTranscripts(prev => [...prev, fullEntry]);
    return fullEntry;
  }, []);

  // Listen for remote transcript events via socket
  useEffect(() => {
    if (!socket) return;
    
    const handleTranscriptFinal = ({ userId, name, text }) => {
      const entry = { speaker: name, text };
      addTranscript(entry);
      
      // Clear this user's interim text
      setInterimTranscripts(prev => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    };

    const handleTranscriptPartial = ({ userId, name, text }) => {
      setInterimTranscripts(prev => ({
        ...prev,
        [userId]: { name, text }
      }));
    };

    socket.on('samvaad:transcript_final', handleTranscriptFinal);
    socket.on('samvaad:transcript_partial', handleTranscriptPartial);
    
    return () => {
      socket.off('samvaad:transcript_final', handleTranscriptFinal);
      socket.off('samvaad:transcript_partial', handleTranscriptPartial);
    };
  }, [socket, addTranscript]);

  const startTranscription = useCallback(async () => {
    if (!socket) {
      toast.error('Socket not connected');
      return;
    }

    if (recorderRef.current) {
      try { recorderRef.current.stop(); } catch {}
      recorderRef.current = null;
    }

    let stream = localStreamRef.current;
    if (!stream || stream.getAudioTracks().length === 0) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err) {
        toast.error('Microphone access denied for transcription.');
        return;
      }
    }

    try {
      // Start backend deepgram session
      socket.emit('samvaad:start_transcription', { roomId });

      const mimeType = window.MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : 'audio/mp4';
        
      const recorder = new window.MediaRecorder(stream, { mimeType });
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0 && socket) {
          socket.emit('samvaad:audio_stream', { roomId, audio: event.data });
        }
      };

      recorder.onstop = () => {
        if (socket) {
          socket.emit('samvaad:stop_transcription');
        }
      };

      recorder.start(250); // 250ms chunks
      recorderRef.current = recorder;
      
      isTranscribingRef.current = true;
      setIsTranscribing(true);
      toast.success('Live transcription started');
    } catch (e) {
      console.warn('Failed to start transcription streaming:', e);
      toast.error('Failed to start transcription streaming');
      isTranscribingRef.current = false;
      setIsTranscribing(false);
    }
  }, [socket, roomId]);

  const stopTranscription = useCallback(() => {
    isTranscribingRef.current = false;
    if (recorderRef.current) {
      try { 
        recorderRef.current.stop(); 
      } catch {}
      recorderRef.current = null;
    }
    setIsTranscribing(false);
    setInterimTranscripts({});
    toast.success('Transcription stopped');
  }, []);

  // ================================================================
  // CHAT (delegates to useMeetingChat)
  // ================================================================
  const chat = useMeetingChat(roomId, meeting.title);

  // ================================================================
  // UI STATE
  // ================================================================
  const [layout, setLayout] = useState('gallery');
  const [activePanel, setActivePanel] = useState('chat');
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return true; // Keep panel closed on mobile upon joining so video stage is visible
    }
    return false;
  });
  const [showEndModal, setShowEndModal] = useState(false);
  const [showSummaryScreen, setShowSummaryScreen] = useState(false);

  const togglePanel = useCallback((panel) => {
    if (activePanel === panel && !isPanelCollapsed) {
      setIsPanelCollapsed(true);
    } else {
      setActivePanel(panel);
      setIsPanelCollapsed(false);
    }
  }, [activePanel, isPanelCollapsed]);

  // ================================================================
  // HOST CONTROLS
  // ================================================================
  const isHost = participants.some(
    p => p.isHost && (p.id === currentUser?._id || p.socketId === socket?.id)
  );

  const muteParticipant = useCallback((targetSocketId) => {
    if (socket && roomId) socket.emit('samvaad:mute_participant', { roomId, targetSocketId });
  }, [socket, roomId]);

  const muteAll = useCallback(() => {
    if (socket && roomId) socket.emit('samvaad:mute_all', { roomId });
  }, [socket, roomId]);

  const removeParticipant = useCallback((targetSocketId) => {
    if (socket && roomId) socket.emit('samvaad:remove_participant', { roomId, targetSocketId });
  }, [socket, roomId]);

  // ================================================================
  // LEAVE / END MEETING
  // ================================================================
  const handleLeaveMeeting = useCallback(() => {
    stopAllMediaTracks();
    if (socket) socket.emit('samvaad:leave_room', { roomId });
    addAuditLog({ action: 'PARTICIPANT_LEFT', detail: `Left room ${meeting.id}`, meetingId: meeting.id });
    navigate('/');
  }, [stopAllMediaTracks, socket, roomId, navigate, addAuditLog, meeting.id]);

  const handleEndMeeting = useCallback(async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    stopAllMediaTracks();
    completeMeeting(meeting.id);
    if (socket) socket.emit('samvaad:end_meeting', { roomId });
    addAuditLog({ action: 'MEETING_ENDED', detail: `Meeting ${meeting.id} ended`, meetingId: meeting.id });

    // Seal meeting evidence package on the backend
    try {
      await api.post(`/evidence/meetings/${meeting.id}/seal`, {
        meetingTitle: meeting.title,
        institute: meeting.institute
      });
      addAuditLog({ action: 'MEETING_SEALED', detail: `Meeting ${meeting.id} evidence root sealed on blockchain ledger`, meetingId: meeting.id });
    } catch (e) {
      console.warn('Meeting sealing warning:', e.message);
    }

    setShowEndModal(false);
    setShowSummaryScreen(true);
  }, [stopAllMediaTracks, completeMeeting, meeting.id, meeting.title, meeting.institute, socket, roomId, addAuditLog]);

  // ================================================================
  // KEYBOARD SHORTCUTS
  // ================================================================
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts while typing
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return;

      switch (e.key.toLowerCase()) {
        case 'm': toggleMute(); break;
        case 'v': toggleVideo(); break;
        case 'h': toggleHandRaise(); break;
        case 'f':
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            document.documentElement.requestFullscreen().catch(() => {});
          }
          break;
        default: break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleMute, toggleVideo, toggleHandRaise]);

  // ================================================================
  // RETURN SESSION STATE
  // ================================================================
  return {
    // Meeting
    roomId,
    meeting,
    isMeetingSealed,
    currentUser,
    isHost,

    // Media
    videoRef,
    screenVideoRef,
    localStreamRef,
    screenStreamRef,
    isMuted, toggleMute,
    isVideoOff, toggleVideo,
    isScreenSharing, toggleScreenShare,
    stopAllMediaTracks,

    // Participants
    participants,

    // Hand / Reactions
    handRaised, toggleHandRaise, lowerParticipantHand,
    reactions, sendReaction,

    // Lock
    isLocked, toggleMeetingLock,

    // Settings
    meetingSettings, updateMeetingSettings,

    // Voting
    voteState, voteResult, hasVoted, myVote,
    startVote, castVote, closeVote,

    // Recording
    isRecording, recSeconds, isRecPaused,
    toggleRecording, toggleRecPause, formatRecTime,

    // Transcript / AI Notes
    transcripts, addTranscript,
    interimTranscripts, isTranscribing, startTranscription, stopTranscription,

    // Chat
    chat,

    // WebRTC & Audio / Video Streams
    localStream,
    remoteStreams,
    activeSpeakerId,
    pinnedSpeakerId,
    setPinnedSpeakerId,
    speakingMap,

    // UI
    layout, setLayout,
    activePanel, setActivePanel, togglePanel,
    isPanelCollapsed, setIsPanelCollapsed,
    showEndModal, setShowEndModal,
    showSummaryScreen, setShowSummaryScreen,

    // Host Controls
    muteParticipant, muteAll, removeParticipant,

    // Leave / End
    handleLeaveMeeting, handleEndMeeting,

    // Socket
    socket
  };
};
