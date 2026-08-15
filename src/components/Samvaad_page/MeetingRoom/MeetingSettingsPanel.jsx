import React from 'react';
import { FiSliders, FiMessageSquare, FiMonitor, FiSmile, FiShield } from 'react-icons/fi';

const MeetingSettingsPanel = ({ meetingSettings, updateMeetingSettings, isHost }) => {
  const toggleSetting = (key) => {
    if (!isHost) return;
    updateMeetingSettings({ [key]: !meetingSettings[key] });
  };

  return (
    <div className="panel-settings">
      <div className="panel-settings__header">
        <h3 className="panel-settings__title flex items-center gap-1.5">
          <FiSliders size={16} className="text-sky-400" />
          <span>Meeting Settings</span>
        </h3>
        <p className="panel-settings__subtitle">
          {isHost ? 'Manage in-session permissions' : 'Active meeting policies'}
        </p>
      </div>

      <div className="panel-settings__group">
        <h4 className="panel-settings__group-title">Participant Permissions</h4>

        {/* Chat Toggle */}
        <div className="panel-settings__toggle-row">
          <div className="panel-settings__toggle-info">
            <FiMessageSquare size={16} className="text-sky-400" />
            <div>
              <span className="panel-settings__toggle-label">Allow In-Meeting Chat</span>
              <span className="panel-settings__toggle-desc">Members can send messages</span>
            </div>
          </div>
          <button
            onClick={() => toggleSetting('chatEnabled')}
            disabled={!isHost}
            className={`panel-settings__switch ${meetingSettings.chatEnabled ? 'panel-settings__switch--on' : ''}`}
          >
            <span className="panel-settings__switch-handle" />
          </button>
        </div>

        {/* Screen Share Toggle */}
        <div className="panel-settings__toggle-row">
          <div className="panel-settings__toggle-info">
            <FiMonitor size={16} className="text-sky-400" />
            <div>
              <span className="panel-settings__toggle-label">Allow Screen Sharing</span>
              <span className="panel-settings__toggle-desc">Members can present screen</span>
            </div>
          </div>
          <button
            onClick={() => toggleSetting('screenShareEnabled')}
            disabled={!isHost}
            className={`panel-settings__switch ${meetingSettings.screenShareEnabled ? 'panel-settings__switch--on' : ''}`}
          >
            <span className="panel-settings__switch-handle" />
          </button>
        </div>

        {/* Reactions Toggle */}
        <div className="panel-settings__toggle-row">
          <div className="panel-settings__toggle-info">
            <FiSmile size={16} className="text-sky-400" />
            <div>
              <span className="panel-settings__toggle-label">Allow Reactions</span>
              <span className="panel-settings__toggle-desc">Members can send emoji reactions</span>
            </div>
          </div>
          <button
            onClick={() => toggleSetting('reactionsEnabled')}
            disabled={!isHost}
            className={`panel-settings__switch ${meetingSettings.reactionsEnabled ? 'panel-settings__switch--on' : ''}`}
          >
            <span className="panel-settings__switch-handle" />
          </button>
        </div>
      </div>

      <div className="panel-settings__group">
        <h4 className="panel-settings__group-title">Security & Encryption</h4>

        <div className="panel-settings__policy-item">
          <FiShield size={14} className="text-sky-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-200 block text-xs">Per-Meeting Key Isolation</span>
            <span className="text-[11px] text-slate-400 block">Messages and media encrypted with dynamic AES-256-GCM.</span>
          </div>
        </div>

        <div className="panel-settings__policy-item">
          <FiShield size={14} className="text-sky-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-200 block text-xs">Audit Logging Active</span>
            <span className="text-[11px] text-slate-400 block">Entry, decisions, and attendance are immutably logged.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingSettingsPanel;
