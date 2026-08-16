import React from 'react';
import { FiPhoneOff } from 'react-icons/fi';

const LeaveEndModal = ({ isHost, onLeave, onEndAll, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        {/* Minimal Icon with no red color */}
        <div className="text-slate-300 flex justify-center mb-3">
          <FiPhoneOff size={24} />
        </div>
        <h3 className="modal-title text-base font-bold text-white text-center">
          {isHost ? 'End or Leave Meeting' : 'Leave Meeting'}
        </h3>
        <p className="modal-desc text-xs text-slate-400 text-center mt-1">
          {isHost
            ? 'As host, you can leave the room or end the session for everyone.'
            : 'Are you sure you want to leave this meeting?'}
        </p>

        <div className="modal-actions flex flex-col gap-2 mt-5">
          {isHost && (
            <button onClick={onEndAll} className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs">
              End Meeting for All
            </button>
          )}
          <button onClick={onLeave} className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer">
            Leave Meeting
          </button>
          <button onClick={onClose} className="w-full py-2 px-4 text-slate-400 hover:text-white text-xs font-medium transition-colors cursor-pointer mt-1">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaveEndModal;
