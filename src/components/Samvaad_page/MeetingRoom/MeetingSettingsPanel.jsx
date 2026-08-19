import React from 'react';
import { FiMessageSquare, FiMonitor, FiSmile, FiShield, FiSliders } from 'react-icons/fi';

const MeetingSettingsPanel = ({ meetingSettings, updateMeetingSettings, isHost }) => {
  const toggleSetting = (key) => {
    if (!isHost) return;
    updateMeetingSettings({ [key]: !meetingSettings[key] });
  };

  return (
    <div className="space-y-5">
      <div className="pb-1">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {isHost ? 'Configure in-session participant permissions and policies' : 'Active session security policies'}
        </p>
      </div>

      <div className="space-y-1">
        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Participant Permissions</h4>

        <div className="divide-y divide-slate-200 dark:divide-slate-800/60">
          {/* Chat Toggle Button */}
          <div className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-3.5 min-w-0 pr-3">
              <FiMessageSquare size={20} className={meetingSettings.chatEnabled ? 'text-sky-600 dark:text-sky-400 shrink-0' : 'text-slate-400 shrink-0'} />
              <div className="min-w-0">
                <span className="text-base font-semibold text-slate-900 dark:text-white block truncate">Allow In-Meeting Chat</span>
                <span className="text-sm text-slate-500 dark:text-slate-400 block truncate">Members can send text and reactions</span>
              </div>
            </div>
            <button
              onClick={() => toggleSetting('chatEnabled')}
              disabled={!isHost}
              className={`h-9 min-w-[6rem] px-4 rounded-xl text-sm font-semibold flex items-center justify-center text-center transition-all cursor-pointer shrink-0 disabled:opacity-50 ${
                meetingSettings.chatEnabled
                  ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
              }`}
            >
              {meetingSettings.chatEnabled ? 'Allowed' : 'Disabled'}
            </button>
          </div>

          {/* Screen Share Toggle Button */}
          <div className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-3.5 min-w-0 pr-3">
              <FiMonitor size={20} className={meetingSettings.screenShareEnabled ? 'text-sky-600 dark:text-sky-400 shrink-0' : 'text-slate-400 shrink-0'} />
              <div className="min-w-0">
                <span className="text-base font-semibold text-slate-900 dark:text-white block truncate">Allow Screen Sharing</span>
                <span className="text-sm text-slate-500 dark:text-slate-400 block truncate">Members can present screen & documents</span>
              </div>
            </div>
            <button
              onClick={() => toggleSetting('screenShareEnabled')}
              disabled={!isHost}
              className={`h-9 min-w-[6rem] px-4 rounded-xl text-sm font-semibold flex items-center justify-center text-center transition-all cursor-pointer shrink-0 disabled:opacity-50 ${
                meetingSettings.screenShareEnabled
                  ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
              }`}
            >
              {meetingSettings.screenShareEnabled ? 'Allowed' : 'Disabled'}
            </button>
          </div>

          {/* Reactions Toggle Button */}
          <div className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-3.5 min-w-0 pr-3">
              <FiSmile size={20} className={meetingSettings.reactionsEnabled ? 'text-sky-600 dark:text-sky-400 shrink-0' : 'text-slate-400 shrink-0'} />
              <div className="min-w-0">
                <span className="text-base font-semibold text-slate-900 dark:text-white block truncate">Allow Reactions</span>
                <span className="text-sm text-slate-500 dark:text-slate-400 block truncate">Members can send live emoji reactions</span>
              </div>
            </div>
            <button
              onClick={() => toggleSetting('reactionsEnabled')}
              disabled={!isHost}
              className={`h-9 min-w-[6rem] px-4 rounded-xl text-sm font-semibold flex items-center justify-center text-center transition-all cursor-pointer shrink-0 disabled:opacity-50 ${
                meetingSettings.reactionsEnabled
                  ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
              }`}
            >
              {meetingSettings.reactionsEnabled ? 'Allowed' : 'Disabled'}
            </button>
          </div>
        </div>
      </div>

      <div className="pt-2 space-y-2">
        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Security & Encryption</h4>

        <div className="divide-y divide-slate-200 dark:divide-slate-800/60">
          <div className="py-3.5 flex gap-3.5 items-start">
            <FiShield size={18} className="text-slate-500 dark:text-slate-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-900 dark:text-white block text-sm">Per-Meeting Key Isolation</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                Messages and media are encrypted with dynamic authenticated AES-256-GCM keys.
              </span>
            </div>
          </div>

          <div className="py-3.5 flex gap-3.5 items-start">
            <FiShield size={18} className="text-slate-500 dark:text-slate-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-900 dark:text-white block text-sm">Audit Logging Active</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                All participant joins, voting decisions, and recordings are permanently hash-chained.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingSettingsPanel;
