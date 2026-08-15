import React, { useRef, useEffect } from 'react';
import { FiMonitor } from 'react-icons/fi';

import { useMeetingSession } from '../../hooks/useMeetingSession';
import MeetingTopBar from './MeetingRoom/MeetingTopBar';
import VideoGrid from './MeetingRoom/VideoGrid';
import ContextPanel from './MeetingRoom/ContextPanel';
import BottomToolbar from './MeetingRoom/BottomToolbar';
import LeaveEndModal from './MeetingRoom/LeaveEndModal';
import MeetingSummaryScreen from './MeetingRoom/MeetingSummaryScreen';

const SplitScreenRoom = () => {
  const session = useMeetingSession();
  const watermarkRef = useRef(null);

  // Dynamic moving watermark animation (subtle & non-intrusive)
  useEffect(() => {
    let angle = 0;
    let animFrame;
    const anim = () => {
      if (watermarkRef.current) {
        angle += 0.2;
        const r = 15;
        const x = Math.sin(angle * Math.PI / 180) * r;
        const y = Math.cos(angle * Math.PI / 180) * r;
        watermarkRef.current.style.transform = `translate(${x}px, ${y}px) rotate(-10deg)`;
      }
      animFrame = requestAnimationFrame(anim);
    };
    anim();

    return () => {
      if (animFrame) cancelAnimationFrame(animFrame);
    };
  }, []);

  // Meeting Ended summary screen
  if (session.showSummaryScreen) {
    return <MeetingSummaryScreen meeting={session.meeting} session={session} />;
  }

  return (
    <div className="meeting-room-layout">
      {/* 1. TOP BAR (Clean Zoom / Teams Header) */}
      <MeetingTopBar
        meeting={session.meeting}
        isRecording={session.isRecording}
        recSeconds={session.recSeconds}
        formatRecTime={session.formatRecTime}
        isRecPaused={session.isRecPaused}
        isLocked={session.isLocked}
        isMeetingSealed={session.isMeetingSealed}
        layout={session.layout}
        setLayout={session.setLayout}
      />

      {/* 2. CENTER STAGE (Video Canvas + Context Drawer) */}
      <div className="meeting-room-main">
        <div className="video-stage">
          {/* Presenter Screen Share Notification */}
          {session.isScreenSharing && (
            <div className="banner banner--info">
              <span className="flex items-center gap-2">
                <FiMonitor className="animate-bounce" /> You are sharing your screen
              </span>
              <button onClick={session.toggleScreenShare} className="underline text-sky-200 hover:text-white">
                Stop Sharing
              </button>
            </div>
          )}

          {/* Main Video View Container */}
          <div className="video-stage__container">
            {/* Dynamic Subtle Watermark */}
            {session.meetingSettings.watermarkEnabled && (
              <div ref={watermarkRef} className="watermark-overlay">
                <span className="watermark-text text-slate-400">AICTE SAMVAAD • CONFIDENTIAL</span>
                <span className="watermark-subtext">USER: {session.currentUser?.email || 'OFFICIAL@AICTE.GOV.IN'}</span>
                <span className="watermark-subtext">SESSION: {session.meeting.id}</span>
              </div>
            )}

            {/* Video Grid */}
            <VideoGrid
              participants={session.participants}
              currentUser={session.currentUser}
              videoRef={session.videoRef}
              isVideoOff={session.isVideoOff}
              reactions={session.reactions}
              meeting={session.meeting}
              layout={session.layout}
              localStream={session.localStream}
              remoteStreams={session.remoteStreams}
              activeSpeakerId={session.activeSpeakerId}
              pinnedSpeakerId={session.pinnedSpeakerId}
              setPinnedSpeakerId={session.setPinnedSpeakerId}
              speakingMap={session.speakingMap}
              socket={session.socket}
            />
          </div>
        </div>

        {/* Right Collapsible Context Drawer */}
        <ContextPanel session={session} />
      </div>

      {/* 3. BOTTOM TOOLBAR DOCK */}
      <BottomToolbar session={session} />

      {/* 4. LEAVE / END MEETING CONFIRMATION MODAL */}
      {session.showEndModal && (
        <LeaveEndModal
          isHost={session.isHost}
          onLeave={session.handleLeaveMeeting}
          onEndAll={session.handleEndMeeting}
          onClose={() => session.setShowEndModal(false)}
        />
      )}
    </div>
  );
};

export default SplitScreenRoom;
