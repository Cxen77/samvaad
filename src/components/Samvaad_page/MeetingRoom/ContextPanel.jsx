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

const PANEL_CONFIG = {
  chat: { title: 'Meeting Chat', icon: FiMessageSquare },
  participants: { title: 'Participants', icon: FiUsers },
  voting: { title: 'Committee Voting', icon: FiBarChart2 },
  dossier: { title: 'Dossier Documents', icon: FiFileText },
  transcript: { title: 'AI Live Notes', icon: FiCpu },
  host: { title: 'Host Controls', icon: FiShield },
  settings: { title: 'Meeting Settings', icon: FiSliders },
  info: { title: 'Meeting Information', icon: FiInfo },
};

const ContextPanel = ({ session }) => {
  const {
    activePanel, isPanelCollapsed, setIsPanelCollapsed,
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

  const currentConfig = PANEL_CONFIG[activePanel] || { title: 'Panel', icon: FiInfo };
  const CurrentIcon = currentConfig.icon;

  return (
    <div className="context-panel">
      {/* Clean Panel Header */}
      <div className="context-panel__tabs flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 shrink-0">
        <div className="flex items-center gap-2.5">
          <CurrentIcon className="text-sky-600 dark:text-sky-400 shrink-0" size={17} />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">
            {activePanel === 'participants' ? `Participants (${participants.length})` : currentConfig.title}
          </h2>
        </div>

        <button
          onClick={() => setIsPanelCollapsed(true)}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs cursor-pointer"
          title="Close panel"
        >
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Close</span>
          <FiChevronRight size={15} />
        </button>
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
