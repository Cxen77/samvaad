import React from 'react';
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiUserX } from 'react-icons/fi';

const ParticipantsPanel = ({
  participants, currentUser, isHost,
  muteParticipant, removeParticipant, muteAll,
  meeting
}) => {
  const joinedCount = participants.filter(p => p.status === 'joined').length;
  const invitedList = meeting?.participantsList || [];

  return (
    <div className="space-y-4">
      {/* Header with Mute All */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Active Members ({joinedCount})</span>
        {isHost && (
          <button 
            onClick={muteAll} 
            className="h-8 px-3.5 rounded-lg text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-white bg-slate-100 hover:bg-sky-600 dark:bg-slate-800 dark:hover:bg-sky-600 border border-slate-300 dark:border-slate-700 transition-all cursor-pointer"
          >
            Mute All
          </button>
        )}
      </div>

      {/* In the Meeting List */}
      <div className="divide-y divide-slate-200 dark:divide-slate-800/60">
        {participants.map(p => {
          const isMe = p.id === currentUser?._id || p.socketId === 'local';
          return (
            <div key={p.id || p.socketId} className="py-2.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center font-bold text-sm text-sky-600 dark:text-sky-400 shrink-0 shadow-xs">
                  {p.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">{p.name}</span>
                    {isMe && <span className="text-xs text-slate-500 dark:text-slate-400 font-normal shrink-0">(You)</span>}
                    {p.isHost && (
                      <span className="text-[9px] font-bold bg-sky-600 text-white px-1.5 py-0.5 rounded shrink-0 tracking-wide">HOST</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate capitalize leading-tight mt-0.5">{p.role || 'Member'}</p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <div className="p-1.5 text-slate-500 dark:text-slate-400 flex items-center justify-center">
                  {p.mic !== false
                    ? <FiMic size={16} className="text-slate-700 dark:text-slate-300" />
                    : <FiMicOff size={16} className="text-slate-400 dark:text-slate-500" />
                  }
                </div>
                <div className="p-1.5 text-slate-500 dark:text-slate-400 flex items-center justify-center">
                  {p.cam !== false
                    ? <FiVideo size={16} className="text-slate-700 dark:text-slate-300" />
                    : <FiVideoOff size={16} className="text-slate-400 dark:text-slate-500" />
                  }
                </div>

                {isHost && !isMe && (
                  <>
                    <button
                      onClick={() => muteParticipant?.(p.socketId)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Mute Participant"
                    >
                      <FiMicOff size={15} />
                    </button>
                    <button
                      onClick={() => removeParticipant?.(p.socketId)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Remove from meeting"
                    >
                      <FiUserX size={15} />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Invited Members */}
      {invitedList.length > 0 && (
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Invited ({invitedList.length})
          </span>
          <div className="space-y-1.5 opacity-70">
            {invitedList.map((p, idx) => (
              <div key={idx} className="flex items-center justify-between py-1.5 text-sm">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center text-xs font-bold">
                    {p.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-slate-700 dark:text-slate-300">{p.name}</span>
                </div>
                <span className="text-xs text-slate-500">{p.role || 'Invited'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ParticipantsPanel;
