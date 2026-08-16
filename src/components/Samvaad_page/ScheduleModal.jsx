import React, { useState } from 'react';
import { FiX, FiCalendar, FiClock, FiUsers, FiShield, FiVideo, FiFileText } from 'react-icons/fi';
import { useSamvaad } from '../../context/SamvaadContext';
import toast from 'react-hot-toast';

const ScheduleModal = ({ isOpen, onClose }) => {
  const { createMeeting, getInstitutes } = useSamvaad();
  const institutes = getInstitutes();

  const [form, setForm] = useState({
    title: '',
    institute: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '11:00',
    type: 'Hearing',
    participants: '',
    description: '',
    securityLevel: 'Standard',
    recording: true,
  });

  const update = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Meeting title is required.'); return; }
    if (!form.date) { toast.error('Meeting date is required.'); return; }

    createMeeting(form);
    toast.success(`Meeting "${form.title}" scheduled successfully!`);
    setForm({ title: '', institute: '', date: new Date().toISOString().split('T')[0], startTime: '10:00', endTime: '11:00', type: 'Hearing', participants: '', description: '', securityLevel: 'Standard', recording: true });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
              <FiCalendar className="text-sky-600" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Schedule Meeting</h2>
              <p className="text-xs text-slate-400">Create a new secure AICTE hearing</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <FiX size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Meeting Title *</label>
            <input type="text" value={form.title} onChange={e => update('title', e.target.value)} placeholder="e.g. ABC Institute Approval Hearing" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 bg-gray-50" />
          </div>

          {/* Institute */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Institute</label>
            <select value={form.institute} onChange={e => update('institute', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 bg-gray-50">
              <option value="">Select Institute</option>
              {institutes.map(inst => (
                <option key={inst.id} value={inst.name}>{inst.name}</option>
              ))}
            </select>
          </div>

          {/* Date + Time Row */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5"><FiCalendar className="inline mr-1" size={14} />Date *</label>
              <input type="date" value={form.date} onChange={e => update('date', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/40 bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5"><FiClock className="inline mr-1" size={14} />Start Time</label>
              <input type="time" value={form.startTime} onChange={e => update('startTime', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/40 bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5"><FiClock className="inline mr-1" size={14} />End Time</label>
              <input type="time" value={form.endTime} onChange={e => update('endTime', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/40 bg-gray-50" />
            </div>
          </div>

          {/* Meeting Type */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5"><FiFileText className="inline mr-1" size={14} />Meeting Type</label>
            <select value={form.type} onChange={e => update('type', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/40 bg-gray-50">
              <option>Hearing</option>
              <option>Review</option>
              <option>Committee</option>
              <option>Preliminary</option>
              <option>Decision</option>
              <option>General</option>
            </select>
          </div>

          {/* Participants */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5"><FiUsers className="inline mr-1" size={14} />Participants</label>
            <input type="text" value={form.participants} onChange={e => update('participants', e.target.value)} placeholder="Dr. Rajesh Kumar, Dr. Priya Sharma" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/40 bg-gray-50" />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => update('description', e.target.value)} rows={3} placeholder="Meeting agenda and details..." className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/40 bg-gray-50 resize-none" />
          </div>

          {/* Recording Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center gap-3">
              <FiVideo className="text-slate-500" size={18} />
              <div>
                <p className="text-sm font-semibold text-slate-700">Enable Recording</p>
                <p className="text-xs text-slate-400">Meeting will be recorded and hashed for integrity</p>
              </div>
            </div>
            <button type="button" onClick={() => update('recording', !form.recording)} className={`w-12 h-6 rounded-full transition-colors relative ${form.recording ? 'bg-sky-600' : 'bg-gray-300'}`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow absolute top-0.5 transition-transform ${form.recording ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm">Schedule Meeting</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleModal;
