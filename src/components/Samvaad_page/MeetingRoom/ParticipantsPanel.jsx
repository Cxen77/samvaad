import React from 'react';
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiUserX, FiUser } from 'react-icons/fi';

// Hand SVG Icon
const HandSmall = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    <div className="panel-participants">
      {/* Header */}
      <div className="panel-participants__header">
        <h3 className="panel-participants__title">Participants ({joinedCount})</h3>
        {isHost && (
          <button onClick={muteAll} className="panel-participants__mute-all">
            Mute All
          </button>
        )}
      </div>

      {/* In the Meeting */}
      <div className="panel-participants__section">
        <h4 className="panel-participants__section-title">
          In this meeting ({joinedCount})
        </h4>
        <div className="panel-participants__list">
          {participants.map(p => {
            const isMe = p.id === currentUser?._id || p.socketId === 'local';
            return (
              <div key={p.id || p.socketId} className="panel-participants__item">
                <div className="panel-participants__item-info">
                  <div className="panel-participants__avatar">
                    {p.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="panel-participants__name truncate">
                      {p.name} {isMe && '(You)'}
                      {p.isHost && <span className="panel-participants__host-tag">HOST</span>}
                    </p>
                    <p className="panel-participants__role truncate">{p.role || 'Member'}</p>
                  </div>
                </div>
                <div className="panel-participants__item-actions">
                  {p.handRaised && (
                    <button
                      onClick={() => lowerParticipantHand?.(p.socketId)}
                      className="panel-participants__action-btn panel-participants__action-btn--hand"
                      title="Lower hand"
                    >
                      <HandSmall />
                    </button>
                  )}
                  {p.mic !== false
                    ? <FiMic size={14} className="panel-participants__icon panel-participants__icon--on" />
                    : <FiMicOff size={14} className="panel-participants__icon panel-participants__icon--off" />
                  }
                  {p.cam !== false
                    ? <FiVideo size={14} className="panel-participants__icon panel-participants__icon--on" />
                    : <FiVideoOff size={14} className="panel-participants__icon panel-participants__icon--off" />
                  }
                  {isHost && !isMe && (
                    <>
                      <button
                        onClick={() => muteParticipant?.(p.socketId)}
                        className="panel-participants__action-btn"
                        title="Mute"
                      >
                        <FiMicOff size={12} />
                      </button>
                      <button
                        onClick={() => removeParticipant?.(p.socketId)}
                        className="panel-participants__action-btn panel-participants__action-btn--danger"
                        title="Remove"
                      >
                        <FiUserX size={12} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Invited Members */}
      {invitedList.length > 0 && (
        <div className="panel-participants__section">
          <h4 className="panel-participants__section-title panel-participants__section-title--invited">
            Invited ({invitedList.length})
          </h4>
          <div className="panel-participants__list">
            {invitedList.map((p, idx) => (
              <div key={idx} className="panel-participants__item panel-participants__item--invited">
                <div className="panel-participants__item-info">
                  <div className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[9px] font-bold">
                    {p.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="panel-participants__name panel-participants__name--invited">{p.name}</span>
                </div>
                <span className="panel-participants__role">{p.role || 'Invited'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ParticipantsPanel;
