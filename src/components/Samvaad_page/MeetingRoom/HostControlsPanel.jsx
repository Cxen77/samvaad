import React from 'react';
import { FiLock, FiUnlock, FiMicOff, FiEye, FiEyeOff, FiRadio, FiAlertTriangle, FiPause, FiPlay } from 'react-icons/fi';

const HostControlsPanel = ({
  isHost, isLocked, toggleMeetingLock,
  muteAll, isRecording, isRecPaused, toggleRecording, toggleRecPause,
  meetingSettings, updateMeetingSettings
}) => {
  if (!isHost) {
    return (
      <div className="p-6 text-center text-slate-500 dark:text-slate-400">
        <FiAlertTriangle size={28} className="text-slate-400 mb-2 mx-auto" />
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Host Controls Restricted</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Only the session host can manage room security and participant policies.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="pb-1">
        <p className="text-sm text-slate-600 dark:text-slate-400">Manage room security, media policies, and recording</p>
      </div>

      <div className="divide-y divide-slate-200 dark:divide-slate-800/60">
        {/* 1. Lock Meeting */}
        <div className="py-4 flex items-center justify-between">
          <div className="flex items-center gap-3.5 min-w-0 pr-3">
            {isLocked ? (
              <FiLock size={20} className="text-sky-600 dark:text-sky-400 shrink-0" />
            ) : (
              <FiUnlock size={20} className="text-slate-400 shrink-0" />
            )}
            <div className="min-w-0">
              <span className="text-base font-semibold text-slate-900 dark:text-white block truncate">Lock Meeting</span>
              <span className="text-sm text-slate-500 dark:text-slate-400 block truncate">Prevent new participants from joining</span>
            </div>
          </div>
          <button
            onClick={toggleMeetingLock}
            className={`h-9 min-w-[6rem] px-4 rounded-xl text-sm font-semibold flex items-center justify-center text-center transition-all cursor-pointer shrink-0 ${
              isLocked
                ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
            }`}
          >
            {isLocked ? 'Locked' : 'Unlocked'}
          </button>
        </div>

        {/* 2. Mute All Participants */}
        <div className="py-4 flex items-center justify-between">
          <div className="flex items-center gap-3.5 min-w-0 pr-3">
            <FiMicOff size={20} className="text-slate-400 shrink-0" />
            <div className="min-w-0">
              <span className="text-base font-semibold text-slate-900 dark:text-white block truncate">Mute All Participants</span>
              <span className="text-sm text-slate-500 dark:text-slate-400 block truncate">Mute microphones of active members</span>
            </div>
          </div>
          <button
            onClick={muteAll}
            className="h-9 min-w-[6rem] px-4 rounded-xl text-sm font-semibold bg-sky-600 hover:bg-sky-500 text-white flex items-center justify-center text-center transition-all cursor-pointer shrink-0 shadow-xs"
          >
            Mute All
          </button>
        </div>

        {/* 3. Confidential Watermark */}
        <div className="py-4 flex items-center justify-between">
          <div className="flex items-center gap-3.5 min-w-0 pr-3">
            {meetingSettings.watermarkEnabled ? (
              <FiEye size={20} className="text-sky-600 dark:text-sky-400 shrink-0" />
            ) : (
              <FiEyeOff size={20} className="text-slate-400 shrink-0" />
            )}
            <div className="min-w-0">
              <span className="text-base font-semibold text-slate-900 dark:text-white block truncate">Session Watermark</span>
              <span className="text-sm text-slate-500 dark:text-slate-400 block truncate">Overlay participant identity on video canvas</span>
            </div>
          </div>
          <button
            onClick={() => updateMeetingSettings({ watermarkEnabled: !meetingSettings.watermarkEnabled })}
            className={`h-9 min-w-[6rem] px-4 rounded-xl text-sm font-semibold flex items-center justify-center text-center transition-all cursor-pointer shrink-0 ${
              meetingSettings.watermarkEnabled
                ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
            }`}
          >
            {meetingSettings.watermarkEnabled ? 'Active' : 'Off'}
          </button>
        </div>

        {/* 4. Evidence Recording */}
        <div className="py-4 flex flex-col gap-3">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3.5 min-w-0 pr-3">
              <FiRadio size={20} className={`shrink-0 ${isRecording && !isRecPaused ? 'text-sky-600 dark:text-sky-400 animate-pulse' : 'text-slate-400'}`} />
              <div className="min-w-0">
                <span className="text-base font-semibold text-slate-900 dark:text-white block truncate">Evidence Recording</span>
                <span className="text-sm text-slate-500 dark:text-slate-400 block truncate">
                  {isRecording ? (isRecPaused ? 'Recording paused' : 'Recording active') : 'Session not recorded'}
                </span>
              </div>
            </div>
            <button
              onClick={toggleRecording}
              className={`h-9 min-w-[6rem] px-4 rounded-xl text-sm font-semibold flex items-center justify-center text-center transition-all cursor-pointer shrink-0 ${
                isRecording
                  ? 'bg-sky-700 hover:bg-sky-600 text-white shadow-xs'
                  : 'bg-sky-600 hover:bg-sky-500 text-white shadow-xs'
              }`}
            >
              {isRecording ? 'Stop REC' : 'Start REC'}
            </button>
          </div>

          {isRecording && (
            <div className="pt-2 flex items-center justify-between text-sm w-full pl-8">
              <span className="text-slate-500 dark:text-slate-400">Recording controls:</span>
              <button
                onClick={toggleRecPause}
                className="h-8 px-3.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {isRecPaused ? <FiPlay size={12} /> : <FiPause size={12} />}
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
