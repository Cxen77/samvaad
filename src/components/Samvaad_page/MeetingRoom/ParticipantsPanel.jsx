import React from 'react';
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiUserX } from 'react-icons/fi';

// Hand SVG Icon
const HandSmall = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
    <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
    <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
    <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
  </svg>
);

const ParticipantsPanel = ({
  participants, currentUser, isHost,
  muteParticipant, removeParticipant, muteAll, lowerParticipantHand,
  meeting
}) => {
  const joinedCount = participants.filter(p => p.status === 'joined').length;
  const invitedList = meeting?.participantsList || [];

  return (
    <div className="space-y-4">
      {/* Header with Mute All */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <span className="text-sm font-semibold text-slate-400">Active Members ({joinedCount})</span>
        {isHost && (
          <button 
            onClick={muteAll} 
            className="h-8 px-3.5 rounded-lg text-xs font-semibold text-sky-400 hover:text-white bg-slate-800 hover:bg-sky-600 border border-slate-700 transition-all cursor-pointer"
          >
            Mute All
          </button>
        )}
      </div>

      {/* In the Meeting List */}
      <div className="divide-y divide-slate-800/60">
        {participants.map(p => {
          const isMe = p.id === currentUser?._id || p.socketId === 'local';
          return (
            <div key={p.id || p.socketId} className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-sky-400 shrink-0 shadow-xs">
                  {p.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate flex items-center gap-1.5">
                    <span>{p.name}</span>
                    {isMe && <span className="text-xs text-slate-400 font-normal">(You)</span>}
                    {p.isHost && (
                      <span className="text-[10px] font-bold bg-sky-600 text-white px-1.5 py-0.5 rounded">HOST</span>
                    )}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{p.role || 'Member'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {p.handRaised && (
                  <button
                    onClick={() => lowerParticipantHand?.(p.socketId)}
                    className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20"
                    title="Lower hand"
                  >
                    <HandSmall />
                  </button>
                )}
                <div className="p-1 text-slate-400">
                  {p.mic !== false
                    ? <FiMic size={16} className="text-slate-300" />
                    : <FiMicOff size={16} className="text-slate-500" />
                  }
                </div>
                <div className="p-1 text-slate-400">
                  {p.cam !== false
                    ? <FiVideo size={16} className="text-slate-300" />
                    : <FiVideoOff size={16} className="text-slate-500" />
                  }
                </div>

                {isHost && !isMe && (
                  <>
                    <button
                      onClick={() => muteParticipant?.(p.socketId)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Mute Participant"
                    >
                      <FiMicOff size={15} />
                    </button>
                    <button
                      onClick={() => removeParticipant?.(p.socketId)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
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
        <div className="pt-3 border-t border-slate-800 space-y-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Invited ({invitedList.length})
          </span>
          <div className="space-y-1.5 opacity-70">
            {invitedList.map((p, idx) => (
              <div key={idx} className="flex items-center justify-between py-1.5 text-sm">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-xs font-bold">
                    {p.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-slate-300">{p.name}</span>
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
