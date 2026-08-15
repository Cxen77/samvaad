import React, { useState } from 'react';
import { FiX, FiShield, FiClock, FiLock } from 'react-icons/fi';
import { useSamvaad } from '../../context/SamvaadContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const JoinModal = ({ isOpen, onClose, onJoin }) => {
  const { getMeetings } = useSamvaad();
  const [meetingId, setMeetingId] = useState('');
  const [password, setPassword] = useState('');

  const recentMeetings = getMeetings().filter(m => m.status === 'scheduled' || m.status === 'active' || m.status === 'LIVE').slice(0, 5);

  const handleJoin = async () => {
    let cleanId = meetingId.trim();
    if (!cleanId) {
      toast.error('Please enter a valid meeting ID or link.');
      return;
    }

    // Extract roomId if user pasted a full join link (e.g. /samvaad/waiting-room/AICTE-...)
    if (cleanId.includes('/waiting-room/')) {
      cleanId = cleanId.split('/waiting-room/')[1];
    } else if (cleanId.includes('/room/')) {
      cleanId = cleanId.split('/room/')[1];
    }
    cleanId = cleanId.split('?')[0].split('#')[0].trim().toUpperCase();

    const localM = getMeetings().find(
      m => (m.id && m.id.toUpperCase() === cleanId) || (m.roomId && m.roomId.toUpperCase() === cleanId)
    );

    if (localM) {
      if (localM.status === 'ENDED' || localM.status === 'completed') {
        toast.error('This meeting has ended.');
        return;
      }
      if (localM.password && localM.password.trim() !== '' && password && localM.password !== password) {
        toast.error('Incorrect meeting passcode.');
        return;
      }
    }

    try {
      const res = await api.post('/samvaad/meetings/join', { roomId: cleanId, password: password.trim() });
      if (res.data?.success) {
        const finalId = res.data.meeting?.id || cleanId;
        onJoin(finalId);
        setMeetingId('');
        setPassword('');
        onClose();
        return;
      }
    } catch (err) {
      if (err.response?.status === 404) {
        toast.error('Meeting not found. Please check Meeting ID.');
        return;
      } else if (err.response?.status === 403) {
        toast.error('This meeting has ended.');
        return;
      } else if (err.response?.status === 401) {
        toast.error('Incorrect meeting passcode.');
        return;
      }
    }

    if (localM) {
      onJoin(cleanId);
      setMeetingId('');
      setPassword('');
      onClose();
    } else {
      toast.error('Meeting not found. Please check Meeting ID.');
    }
  };

  const handleQuickJoin = (id) => {
    const localM = getMeetings().find(m => m.id === id);
    if (localM && (localM.status === 'ENDED' || localM.status === 'completed')) {
      toast.error('This meeting has ended.');
      return;
    }
    onJoin(id);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
              <FiShield className="text-sky-600" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Join Meeting</h2>
              <p className="text-xs text-slate-400">Enter a meeting ID to join securely</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <FiX size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Meeting ID */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Meeting ID / Code *</label>
            <input
              type="text"
              value={meetingId}
              onChange={e => setMeetingId(e.target.value)}
              placeholder="e.g. AICTE-2026-00421"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 bg-gray-50 font-mono"
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              autoFocus
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5"><FiLock className="inline mr-1" size={14} />Password (optional)</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter meeting password"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/40 bg-gray-50"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={handleJoin} className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm">Join Meeting</button>
          </div>

          {/* Recent Meetings */}
          {recentMeetings.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Available Meetings</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {recentMeetings.map(m => (
                  <button
                    key={m.id}
                    onClick={() => handleQuickJoin(m.id)}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-sky-50 rounded-xl transition-colors text-left group"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{m.title}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <FiClock size={11} />
                        <span>{m.date} • {m.startTime}</span>
                      </div>
                    </div>
                    <span className="text-xs text-sky-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">Join →</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Security Notice */}
          <div className="flex items-center gap-2 text-xs text-slate-400 pt-2">
            <FiShield size={12} className="text-emerald-500" />
            <span>End-to-end encrypted session</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinModal;
