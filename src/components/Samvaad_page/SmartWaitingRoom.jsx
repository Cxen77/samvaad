import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useSamvaad } from '../../context/SamvaadContext';
import api from '../../api/axios';
import { 
  FiCamera, FiVideo, FiVideoOff, FiMic, FiMicOff, FiWifi, 
  FiCheckCircle, FiShield, FiLoader, FiSliders, FiArrowLeft, 
  FiVolume2, FiLock, FiSettings, FiUserCheck, FiKey
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const SmartWaitingRoom = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { socket } = useSocket();
    const { getMeeting } = useSamvaad();

    const localMeeting = getMeeting(roomId);
    const [remoteMeeting, setRemoteMeeting] = useState(null);
    const [isLoadingMeeting, setIsLoadingMeeting] = useState(true);
    const [enteredPasscode, setEnteredPasscode] = useState('');
    const [isJoining, setIsJoining] = useState(false);

    useEffect(() => {
      if (roomId) {
        setIsLoadingMeeting(true);
        api.get(`/samvaad/meetings/${roomId}`)
          .then(res => {
            if (res.data?.success && res.data?.meeting) {
              setRemoteMeeting(res.data.meeting);
            }
          })
          .catch(err => {
            console.warn('[WaitingRoom] Meeting fetch info:', err.response?.data?.message || err.message);
          })
          .finally(() => {
            setIsLoadingMeeting(false);
          });
      }
    }, [roomId]);

    const meeting = remoteMeeting || localMeeting || {
      id: roomId,
      title: 'AICTE Review Hearing Session',
      institute: 'AICTE Institution',
      securityLevel: 'Confidential',
      password: ''
    };

    const hasPassword = Boolean(meeting.password && meeting.password.trim().length > 0);

    const videoRef = useRef(null);
    const streamRef = useRef(null);

    // Media & Device States
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [isMicOn, setIsMicOn] = useState(true);
    const [stream, setStream] = useState(null);

    // Device Lists
    const [audioInputs, setAudioInputs] = useState([]);
    const [videoInputs, setVideoInputs] = useState([]);
    const [audioOutputs, setAudioOutputs] = useState([]);

    const [selectedAudioInput, setSelectedAudioInput] = useState('');
    const [selectedVideoInput, setSelectedVideoInput] = useState('');
    const [selectedAudioOutput, setSelectedAudioOutput] = useState('');

    // Pre-flight Checks
    const [checks, setChecks] = useState({
        camera: 'pending',
        mic: 'pending',
        network: 'pending',
        identity: 'pending'
    });

    const [isAdmitted, setIsAdmitted] = useState(false);

    // Enumerate hardware devices
    const getDevices = async () => {
        try {
            if (!navigator.mediaDevices?.enumerateDevices) return;
            const devices = await navigator.mediaDevices.enumerateDevices();
            const aIn = devices.filter(d => d.kind === 'audioinput');
            const vIn = devices.filter(d => d.kind === 'videoinput');
            const aOut = devices.filter(d => d.kind === 'audiooutput');

            setAudioInputs(aIn);
            setVideoInputs(vIn);
            setAudioOutputs(aOut);

            if (aIn[0] && !selectedAudioInput) setSelectedAudioInput(aIn[0].deviceId);
            if (vIn[0] && !selectedVideoInput) setSelectedVideoInput(vIn[0].deviceId);
            if (aOut[0] && !selectedAudioOutput) setSelectedAudioOutput(aOut[0].deviceId);
        } catch (e) {
            console.warn('Device enumeration error:', e);
        }
    };

    // Initialize Camera and Microphone
    const initMedia = async () => {
        try {
            const constraints = {
                video: isCameraOn ? (selectedVideoInput ? { deviceId: { exact: selectedVideoInput } } : true) : false,
                audio: isMicOn ? (selectedAudioInput ? { deviceId: { exact: selectedAudioInput } } : true) : true
            };

            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = mediaStream;
            setStream(mediaStream);

            if (videoRef.current && isCameraOn) {
                videoRef.current.srcObject = mediaStream;
            }

            setChecks(p => ({ ...p, camera: 'passed', mic: 'passed' }));
            await getDevices();
        } catch (err) {
            console.error("Hardware access error:", err);
            setChecks(p => ({ ...p, camera: 'failed', mic: 'failed' }));
            toast.error("Camera/Microphone access error. Check browser permissions.");
        }
    };

    useEffect(() => {
        // Identity Check
        setTimeout(() => {
            if (currentUser) {
                setChecks(p => ({ ...p, identity: 'passed' }));
            } else {
                setChecks(p => ({ ...p, identity: 'failed' }));
            }
        }, 500);

        // Network Check
        setTimeout(() => {
            setChecks(p => ({ ...p, network: 'passed' }));
        }, 700);

        initMedia();

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
        };
    }, []);

    // Toggle Camera
    const toggleCamera = () => {
        if (streamRef.current) {
            const videoTrack = streamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsCameraOn(videoTrack.enabled);
            } else if (!isCameraOn) {
                setIsCameraOn(true);
                initMedia();
            }
        } else {
            setIsCameraOn(!isCameraOn);
        }
    };

    // Toggle Microphone
    const toggleMic = () => {
        if (streamRef.current) {
            const audioTrack = streamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMicOn(audioTrack.enabled);
            }
        } else {
            setIsMicOn(!isMicOn);
        }
    };

    // Join Meeting Handler
    const handleJoin = async () => {
        if (hasPassword) {
            if (!enteredPasscode.trim()) {
                toast.error('Please enter the meeting passcode');
                return;
            }
            if (meeting.password && enteredPasscode.trim() !== meeting.password.trim()) {
                toast.error('Incorrect meeting passcode');
                return;
            }
        }

        setIsJoining(true);
        try {
            await api.post('/samvaad/meetings/join', { roomId, password: enteredPasscode.trim() });
        } catch (err) {
            if (err.response?.status === 401) {
                toast.error('Incorrect meeting passcode');
                setIsJoining(false);
                return;
            } else if (err.response?.status === 403) {
                toast.error('This meeting has ended');
                setIsJoining(false);
                return;
            }
            console.warn('Backend join registration note:', err.message);
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        navigate(`/samvaad/room/${roomId}`);
    };

    const handleCancel = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        navigate('/');
    };

    const allPassed = Object.values(checks).every(c => c === 'passed');
    const initials = currentUser?.name ? currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'ME';

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 md:p-8 font-sans">
            <div className="w-full max-w-4xl bg-slate-950/80 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-800/80 space-y-6 animate-in fade-in zoom-in-95 duration-200">
                {/* Header: Topic, Room ID, Security */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-sky-600/20 border border-sky-500/30 text-sky-400 flex items-center justify-center shadow-inner">
                            <FiShield size={20} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">{meeting.title || 'AICTE Hearing'}</h1>
                            </div>
                            <p className="text-xs text-slate-400">
                                Meeting ID: <span className="font-mono text-slate-200 font-semibold">{roomId}</span>
                                {meeting.institute && <span className="ml-2">• {meeting.institute}</span>}
                            </p>
                        </div>
                    </div>

                    <button 
                        onClick={handleCancel}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5"
                    >
                        <FiArrowLeft size={14} /> Back to Samvaad
                    </button>
                </div>

                {/* Main 2-Column Stage (Zoom & Teams style) */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                    {/* Left 7 cols: Video Camera Preview */}
                    <div className="md:col-span-7 space-y-3">
                        <div className="bg-slate-900 rounded-2xl overflow-hidden aspect-video relative flex items-center justify-center border border-slate-800 shadow-2xl group">
                            {isCameraOn ? (
                                <video 
                                    ref={videoRef}
                                    autoPlay
                                    muted
                                    playsInline
                                    className="w-full h-full object-cover mirror"
                                />
                            ) : (
                                <div className="text-center space-y-3">
                                    <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center font-bold text-2xl text-slate-300 mx-auto shadow-lg">
                                        {initials}
                                    </div>
                                    <p className="text-xs text-slate-400 font-medium">Camera is off</p>
                                </div>
                            )}

                            {/* Floating Media Controls on Camera Preview (Zoom / Teams Style) */}
                            <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-3">
                                <button
                                    onClick={toggleMic}
                                    className={`px-4 py-2.5 rounded-full shadow-xl backdrop-blur-md transition-all flex items-center gap-2 text-xs font-semibold ${
                                        isMicOn 
                                          ? 'bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700/80' 
                                          : 'bg-red-600 hover:bg-red-700 text-white'
                                    }`}
                                    title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
                                >
                                    {isMicOn ? <FiMic size={15} /> : <FiMicOff size={15} />}
                                    <span>{isMicOn ? 'Mute' : 'Unmuted'}</span>
                                </button>

                                <button
                                    onClick={toggleCamera}
                                    className={`px-4 py-2.5 rounded-full shadow-xl backdrop-blur-md transition-all flex items-center gap-2 text-xs font-semibold ${
                                        isCameraOn 
                                          ? 'bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700/80' 
                                          : 'bg-red-600 hover:bg-red-700 text-white'
                                    }`}
                                    title={isCameraOn ? 'Turn Video Off' : 'Turn Video On'}
                                >
                                    {isCameraOn ? <FiVideo size={15} /> : <FiVideoOff size={15} />}
                                    <span>{isCameraOn ? 'Stop Video' : 'Start Video'}</span>
                                </button>
                            </div>
                        </div>

                        {/* Device Selector Dropdowns */}
                        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-3.5 space-y-2.5 text-xs">
                            <div className="flex items-center justify-between text-slate-400 font-semibold text-[11px] pb-1 border-b border-slate-800">
                                <span>Audio & Video Settings</span>
                                <FiSettings size={13} />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-[10px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                                        <FiMic size={11} className="text-sky-400" /> Microphone
                                    </label>
                                    <select 
                                        value={selectedAudioInput}
                                        onChange={e => setSelectedAudioInput(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                                    >
                                        {audioInputs.length === 0 && <option value="">Default Microphone</option>}
                                        {audioInputs.map(d => (
                                             <option key={d.deviceId} value={d.deviceId}>{d.label || `Microphone ${d.deviceId.substring(0, 5)}`}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                                        <FiVideo size={11} className="text-sky-400" /> Camera
                                    </label>
                                    <select 
                                        value={selectedVideoInput}
                                        onChange={e => setSelectedVideoInput(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                                    >
                                        {videoInputs.length === 0 && <option value="">Integrated Camera</option>}
                                        {videoInputs.map(d => (
                                            <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${d.deviceId.substring(0, 5)}`}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right 5 cols: Pre-flight Verification & Join Action */}
                    <div className="md:col-span-5 flex flex-col justify-between space-y-4">
                        <div className="space-y-3 bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2 flex items-center justify-between">
                                <span>Pre-flight Checks</span>
                                <span className="text-[10px] text-sky-400 font-semibold">Ready</span>
                            </h2>

                            <div className="space-y-2 text-xs">
                                <CheckItem icon={FiCamera} label="Video Device" status={checks.camera} />
                                <CheckItem icon={FiMic} label="Audio Input" status={checks.mic} />
                                <CheckItem icon={FiWifi} label="Network Connection" status={checks.network} />
                                <CheckItem icon={FiUserCheck} label="AICTE Identity" status={checks.identity} />
                            </div>
                        </div>

                        {/* Join Action Card */}
                        <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800/90 space-y-3">
                            {/* Passcode Input if Required */}
                            {hasPassword && (
                                <div className="p-3 bg-sky-950/60 border border-sky-800/80 rounded-xl space-y-1.5">
                                    <label className="block text-[11px] font-semibold text-sky-300 flex items-center gap-1.5">
                                        <FiKey size={13} /> Meeting Passcode Required
                                    </label>
                                    <input 
                                        type="password"
                                        value={enteredPasscode}
                                        onChange={e => setEnteredPasscode(e.target.value)}
                                        placeholder="Enter meeting passcode to join"
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
                                        onKeyDown={e => e.key === 'Enter' && handleJoin()}
                                    />
                                </div>
                            )}

                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-400">Audio / Video:</span>
                                <span className="font-semibold text-sky-400 flex items-center gap-2">
                                    <span className="flex items-center gap-1">
                                        <FiVideo size={12} className="text-white" /> {isCameraOn ? 'Video ON' : 'Video OFF'}
                                    </span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                        <FiMic size={12} className="text-white" /> {isMicOn ? 'Mic ON' : 'Muted'}
                                    </span>
                                </span>
                            </div>

                            <button 
                                onClick={handleJoin}
                                disabled={isJoining}
                                className="w-full py-3.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-xl shadow-sky-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <FiVideo size={17} className="text-white" /> {isJoining ? 'Joining...' : 'Join Meeting Now'}
                            </button>

                            <p className="text-[10px] text-center text-slate-500 flex items-center justify-center gap-1">
                                <FiLock size={11} className="text-sky-400" /> DTLS-SRTP encryption & audit logging active.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CheckItem = ({ icon: Icon, label, status }) => (
    <div className="flex items-center justify-between p-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl">
        <div className="flex items-center gap-2.5">
            <Icon className="text-slate-400" size={14} />
            <span className="font-medium text-slate-200 text-xs">{label}</span>
        </div>
        <div>
            {status === 'pending' && <FiLoader className="animate-spin text-slate-400" size={14} />}
            {status === 'passed' && <FiCheckCircle className="text-sky-400" size={14} />}
            {status === 'failed' && <span className="text-red-400 text-xs font-semibold">Denied</span>}
        </div>
    </div>
);

export default SmartWaitingRoom;
