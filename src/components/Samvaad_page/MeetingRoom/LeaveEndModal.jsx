import React from 'react';
import { FiPhoneOff } from 'react-icons/fi';

const LeaveEndModal = ({ isHost, onLeave, onEndAll, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-icon modal-icon--danger">
          <FiPhoneOff size={22} />
        </div>
        <h3 className="modal-title">{isHost ? 'End or Leave Meeting' : 'Leave Meeting'}</h3>
        <p className="modal-desc">
          {isHost
            ? 'As host, you can leave the room or end the session for everyone.'
            : 'Are you sure you want to leave this meeting?'}
        </p>

        <div className="modal-actions">
          {isHost && (
            <button onClick={onEndAll} className="modal-btn modal-btn--danger">
              End Meeting for All
            </button>
          )}
          <button onClick={onLeave} className="modal-btn modal-btn--secondary">
            Leave Meeting
          </button>
          <button onClick={onClose} className="modal-btn modal-btn--ghost">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaveEndModal;
