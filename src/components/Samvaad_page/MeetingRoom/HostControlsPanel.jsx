import React from 'react';
import { FiLock, FiUnlock, FiMicOff, FiEye, FiEyeOff, FiRadio, FiAlertTriangle, FiShield, FiPause, FiPlay, FiSquare } from 'react-icons/fi';

const HostControlsPanel = ({
  isHost, isLocked, toggleMeetingLock,
  muteAll, isRecording, isRecPaused, toggleRecording, toggleRecPause,
  meetingSettings, updateMeetingSettings
}) => {
  if (!isHost) {
    return (
      <div className="panel-host">
        <div className="panel-host__no-access">
          <FiAlertTriangle size={24} className="text-amber-400 mb-2" />
          <h3 className="text-sm font-bold text-white">Host Controls Restricted</h3>
          <p className="text-xs text-slate-400 mt-1">
            Only the session host can manage room security and participant policies.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel-host">
      <div className="panel-host__header">
        <h3 className="panel-host__title flex items-center gap-1.5">
          <FiShield size={16} className="text-sky-400" />
          <span>Host Controls</span>
        </h3>
        <p className="panel-host__subtitle">Manage room security and participant settings</p>
      </div>

      <div className="panel-host__controls-list">
        {/* Lock Meeting Toggle */}
        <button
          onClick={toggleMeetingLock}
          className={`panel-host__control-card ${isLocked ? 'panel-host__control-card--active-purple' : ''}`}
        >
          <div className="panel-host__control-icon">
            {isLocked ? <FiLock size={16} /> : <FiUnlock size={16} />}
          </div>
          <div className="panel-host__control-text">
            <span className="panel-host__control-label">Lock Meeting</span>
            <span className="panel-host__control-desc">Prevent new participants from joining</span>
          </div>
          <span className={`panel-host__status-tag ${isLocked ? 'panel-host__status-tag--locked' : ''}`}>
            {isLocked ? 'Locked' : 'Unlocked'}
          </span>
        </button>

        {/* Mute All */}
        <button
          onClick={muteAll}
          className="panel-host__control-card"
        >
          <div className="panel-host__control-icon text-red-400">
            <FiMicOff size={16} />
          </div>
          <div className="panel-host__control-text">
            <span className="panel-host__control-label">Mute All Participants</span>
            <span className="panel-host__control-desc">Mute microphones of all active members</span>
          </div>
          <span className="panel-host__action-tag">Mute All</span>
        </button>

        {/* Watermark Toggle */}
        <button
          onClick={() => updateMeetingSettings({ watermarkEnabled: !meetingSettings.watermarkEnabled })}
          className={`panel-host__control-card ${meetingSettings.watermarkEnabled ? 'panel-host__control-card--active-blue' : ''}`}
        >
          <div className="panel-host__control-icon">
            {meetingSettings.watermarkEnabled ? <FiEye size={16} /> : <FiEyeOff size={16} />}
          </div>
          <div className="panel-host__control-text">
            <span className="panel-host__control-label">Confidential Watermark</span>
            <span className="panel-host__control-desc">Overlay official email on video canvas</span>
          </div>
          <span className={`panel-host__status-tag ${meetingSettings.watermarkEnabled ? 'panel-host__status-tag--enabled' : ''}`}>
            {meetingSettings.watermarkEnabled ? 'Active' : 'Off'}
          </span>
        </button>

        {/* Evidence Recording */}
        <div className="panel-host__control-card flex-col items-stretch">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="panel-host__control-icon text-red-400">
                <FiRadio size={16} />
              </div>
              <div className="panel-host__control-text">
                <span className="panel-host__control-label">Evidence Recording</span>
                <span className="panel-host__control-desc">
                  {isRecording ? (isRecPaused ? 'Recording paused' : 'Recording active') : 'Session not recorded'}
                </span>
              </div>
            </div>
            <button
              onClick={toggleRecording}
              className={`panel-host__mini-btn ${isRecording ? 'panel-host__mini-btn--danger' : 'panel-host__mini-btn--success'}`}
            >
              {isRecording ? 'Stop' : 'Start REC'}
            </button>
          </div>

          {isRecording && (
            <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">Recording controls:</span>
              <button
                onClick={toggleRecPause}
                className="panel-host__mini-btn panel-host__mini-btn--secondary flex items-center gap-1"
              >
                {isRecPaused ? <FiPlay size={10} /> : <FiPause size={10} />}
                <span>{isRecPaused ? 'Resume' : 'Pause'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HostControlsPanel;
