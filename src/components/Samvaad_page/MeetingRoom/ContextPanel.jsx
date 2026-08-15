import React from 'react';
import { 
  FiFileText, FiBarChart2, FiUsers, FiMessageSquare, 
  FiCpu, FiSliders, FiChevronRight, FiChevronLeft, FiInfo, FiShield
} from 'react-icons/fi';

import ChatPanel from './ChatPanel';
import ParticipantsPanel from './ParticipantsPanel';
import VotingPanel from './VotingPanel';
import DocumentsPanel from './DocumentsPanel';
import TranscriptPanel from './TranscriptPanel';
import MeetingInfoPanel from './MeetingInfoPanel';
import HostControlsPanel from './HostControlsPanel';
import MeetingSettingsPanel from './MeetingSettingsPanel';

const TABS = [
  { id: 'chat', label: 'Chat', icon: FiMessageSquare },
  { id: 'participants', label: 'People', icon: FiUsers },
  { id: 'voting', label: 'Voting', icon: FiBarChart2 },
  { id: 'dossier', label: 'Dossier', icon: FiFileText },
  { id: 'transcript', label: 'AI Notes', icon: FiCpu },
  { id: 'host', label: 'Host', icon: FiShield },
  { id: 'settings', label: 'Settings', icon: FiSliders },
  { id: 'info', label: 'Info', icon: FiInfo },
];

const ContextPanel = ({ session }) => {
  const {
    activePanel, togglePanel, isPanelCollapsed, setIsPanelCollapsed,
    meeting, currentUser, isHost, isMeetingSealed, chat,
    participants, muteParticipant, removeParticipant, muteAll, lowerParticipantHand,
    voteState, voteResult, hasVoted, myVote, startVote, castVote, closeVote,
    transcripts, addTranscript, interimText, isTranscribing, startTranscription, stopTranscription,
    isLocked, toggleMeetingLock,
    isRecording, recSeconds, isRecPaused, toggleRecording, toggleRecPause,
    meetingSettings, updateMeetingSettings
  } = session;

  if (isPanelCollapsed) {
    return (
      <button
        onClick={() => setIsPanelCollapsed(false)}
        className="context-panel__expand-btn"
        title="Open side panel"
      >
        <FiChevronLeft size={16} />
      </button>
    );
  }

  // Filter tabs if user is not host
  const visibleTabs = TABS.filter(t => t.id !== 'host' || isHost);

  return (
    <div className="context-panel">
      {/* Tab Header Bar */}
      <div className="context-panel__tabs">
        <button
          onClick={() => setIsPanelCollapsed(true)}
          className="context-panel__collapse-btn"
          title="Close panel"
        >
          <FiChevronRight size={16} />
        </button>

        <div className="context-panel__tabs-scroll">
          {visibleTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activePanel === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => togglePanel(tab.id)}
                className={`context-panel__tab ${isActive ? 'context-panel__tab--active' : ''}`}
              >
                <Icon size={13} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Scrollable Content Body */}
      <div className="context-panel__body">
        {activePanel === 'chat' && (
          <ChatPanel
            chat={chat}
            currentUser={currentUser}
            isMeetingSealed={isMeetingSealed}
            meeting={meeting}
          />
        )}

        {activePanel === 'participants' && (
          <ParticipantsPanel
            participants={participants}
            currentUser={currentUser}
            isHost={isHost}
            muteParticipant={muteParticipant}
            removeParticipant={removeParticipant}
            muteAll={muteAll}
            lowerParticipantHand={lowerParticipantHand}
            meeting={meeting}
          />
        )}

        {activePanel === 'voting' && (
          <VotingPanel
            voteState={voteState}
            voteResult={voteResult}
            hasVoted={hasVoted}
            myVote={myVote}
            startVote={startVote}
            castVote={castVote}
            closeVote={closeVote}
            isHost={isHost}
            participants={participants}
          />
        )}

        {activePanel === 'dossier' && (
          <DocumentsPanel meeting={meeting} />
        )}

        {activePanel === 'transcript' && (
          <TranscriptPanel
            transcripts={transcripts}
            addTranscript={addTranscript}
            currentUser={currentUser}
            interimText={interimText}
            isTranscribing={isTranscribing}
            startTranscription={startTranscription}
            stopTranscription={stopTranscription}
          />
        )}

        {activePanel === 'host' && (
          <HostControlsPanel
            isHost={isHost}
            isLocked={isLocked}
            toggleMeetingLock={toggleMeetingLock}
            muteAll={muteAll}
            isRecording={isRecording}
            isRecPaused={isRecPaused}
            toggleRecording={toggleRecording}
            toggleRecPause={toggleRecPause}
            meetingSettings={meetingSettings}
            updateMeetingSettings={updateMeetingSettings}
          />
        )}

        {activePanel === 'settings' && (
          <MeetingSettingsPanel
            meetingSettings={meetingSettings}
            updateMeetingSettings={updateMeetingSettings}
            isHost={isHost}
          />
        )}

        {activePanel === 'info' && (
          <MeetingInfoPanel meeting={meeting} />
        )}
      </div>
    </div>
  );
};

export default ContextPanel;
