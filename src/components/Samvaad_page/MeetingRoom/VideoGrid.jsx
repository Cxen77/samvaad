import React from 'react';
import VideoTile from './VideoTile';

const VideoGrid = ({ 
  participants = [], 
  currentUser, 
  videoRef, 
  isVideoOff, 
  reactions, 
  meeting, 
  layout,
  localStream,
  remoteStreams = {},
  activeSpeakerId,
  pinnedSpeakerId,
  setPinnedSpeakerId,
  speakingMap = {},
  socket
}) => {
  // Robust local participant checker across socket IDs, MongoDB _id, and session IDs
  const isLocalParticipant = (p) => {
    if (!p) return false;
    if (p.socketId === 'local') return true;
    if (socket?.id && p.socketId === socket.id) return true;
    if (currentUser?._id && (p.id === currentUser._id || p.userId === currentUser._id)) return true;
    if (currentUser?.id && (p.id === currentUser.id || p.userId === currentUser.id)) return true;
    return false;
  };

  const localParticipant = participants.find(isLocalParticipant) || { 
    id: currentUser?._id || 'local', 
    name: currentUser?.name || 'You', 
    socketId: socket?.id || 'local',
    isHost: true
  };

  const remoteParticipants = participants.filter(p => !isLocalParticipant(p));
  const totalCount = participants.length;

  // Toggle pin
  const handlePin = (id) => {
    if (setPinnedSpeakerId) {
      setPinnedSpeakerId(prev => (prev === id ? null : id));
    }
  };

  // Determine Active Speaker (Stuck to current active or pinned speaker)
  const activeSpeaker = (() => {
    // 1. Pinned participant
    if (pinnedSpeakerId) {
      const foundPinned = participants.find(p => p.id === pinnedSpeakerId || p.socketId === pinnedSpeakerId);
      if (foundPinned) return foundPinned;
    }

    // 2. Active voice speaker
    if (activeSpeakerId) {
      const foundActive = participants.find(p => p.id === activeSpeakerId || p.socketId === activeSpeakerId);
      if (foundActive) return foundActive;
    }

    // 3. First remote participant or local participant
    return remoteParticipants[0] || localParticipant;
  })();

  const isActiveSpeakerLocal = isLocalParticipant(activeSpeaker);

  // Grid layout class for Gallery view
  const getGridClass = () => {
    if (totalCount <= 1) return 'video-grid--single';
    if (totalCount === 2) return 'video-grid--duo';
    if (totalCount <= 4) return 'video-grid--quad';
    if (totalCount <= 6) return 'video-grid--six';
    return 'video-grid--many';
  };

  // ================================================================
  // ZOOM SPEAKER VIEW LAYOUT (Top Filmstrip + Large Active Stage)
  // ================================================================
  if (layout === 'speaker') {
    return (
      <div className="video-grid video-grid--speaker">
        {/* Top Horizontal Participant Filmstrip (Zoom Style) */}
        {participants.length > 1 && (
          <div className="video-grid__speaker-strip">
            {participants.map(p => {
              const isLocal = isLocalParticipant(p);
              const stream = isLocal ? null : (remoteStreams[p.socketId] || remoteStreams[p.id] || remoteStreams[p.userId]);
              const isSpeaking = isLocal ? Boolean(speakingMap.local) : Boolean(speakingMap[p.socketId] || speakingMap[p.id] || speakingMap[p.userId]);
              const isPinned = pinnedSpeakerId === (p.id || p.socketId || p.userId);
              const isActive = (activeSpeaker?.id === p.id || activeSpeaker?.socketId === p.socketId);

              return (
                <div 
                  key={p.id || p.socketId} 
                  onClick={() => handlePin(p.id || p.socketId)}
                  className={`video-grid__speaker-thumbnail ${isActive ? 'video-grid__speaker-thumbnail--active' : ''}`}
                >
                  <VideoTile
                    participant={p}
                    isLocal={isLocal}
                    videoRef={isLocal ? videoRef : undefined}
                    isVideoOff={isLocal ? isVideoOff : undefined}
                    localStream={isLocal ? localStream : undefined}
                    stream={stream}
                    reactions={reactions}
                    isSpeaking={isSpeaking}
                    isPinned={isPinned}
                    onPin={handlePin}
                    isThumbnail={true}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Center Stage: Active Speaker Video Tile */}
        <div className="video-grid__main-speaker">
          <VideoTile
            participant={activeSpeaker}
            isLocal={isActiveSpeakerLocal}
            videoRef={isActiveSpeakerLocal ? videoRef : undefined}
            isVideoOff={isActiveSpeakerLocal ? isVideoOff : undefined}
            localStream={isActiveSpeakerLocal ? localStream : undefined}
            stream={isActiveSpeakerLocal ? null : (remoteStreams[activeSpeaker?.socketId] || remoteStreams[activeSpeaker?.id] || remoteStreams[activeSpeaker?.userId])}
            reactions={reactions}
            isSpeaking={isActiveSpeakerLocal ? Boolean(speakingMap.local) : Boolean(speakingMap[activeSpeaker?.socketId] || speakingMap[activeSpeaker?.id])}
            isPinned={pinnedSpeakerId === (activeSpeaker?.id || activeSpeaker?.socketId)}
            onPin={handlePin}
            isThumbnail={false}
          />
        </div>
      </div>
    );
  }

  // ================================================================
  // GALLERY VIEW (Zoom & Teams 16:9 Grid of All Participants)
  // ================================================================
  return (
    <div className={`video-grid ${getGridClass()}`}>
      {/* Local participant video tile */}
      <VideoTile
        participant={localParticipant}
        isLocal={true}
        videoRef={videoRef}
        isVideoOff={isVideoOff}
        localStream={localStream}
        reactions={reactions}
        isSpeaking={Boolean(speakingMap.local)}
        isPinned={pinnedSpeakerId === localParticipant.id}
        onPin={handlePin}
      />

      {/* Remote participant video tiles */}
      {remoteParticipants.map(p => (
        <VideoTile
          key={p.id || p.socketId}
          participant={p}
          isLocal={false}
          localStream={undefined}
          stream={remoteStreams[p.socketId] || remoteStreams[p.id] || remoteStreams[p.userId]}
          reactions={reactions}
          isSpeaking={Boolean(speakingMap[p.socketId] || speakingMap[p.id] || speakingMap[p.userId])}
          isPinned={pinnedSpeakerId === (p.id || p.socketId)}
          onPin={handlePin}
        />
      ))}
    </div>
  );
};

export default VideoGrid;
