import React from 'react';
import { FiX, FiMessageSquare, FiUserMinus, FiShield, FiCheckCircle, FiBriefcase, FiMail, FiAward } from 'react-icons/fi';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const ContactProfileModal = ({ isOpen, onClose, contactUser, onStartChat, onContactRemoved }) => {
  if (!isOpen || !contactUser) return null;

  const handleRemoveContact = async () => {
    try {
      await api.delete(`/users/contacts/${contactUser._id}`);
      toast.success(`${contactUser.name} removed from contacts`);
      onContactRemoved?.(contactUser._id);
      onClose();
    } catch {
      toast.error('Failed to remove contact');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-end p-0">
      <div className="bg-slate-900 border-l border-slate-700 h-full max-w-md w-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Contact Details</span>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
              <FiX size={18} />
            </button>
          </div>

          {/* Profile Header Card */}
          <div className="text-center space-y-3 mb-6">
            <div className="w-20 h-20 rounded-full bg-sky-500/20 border-2 border-sky-500/40 flex items-center justify-center font-bold text-2xl text-sky-400 mx-auto overflow-hidden shadow-xl">
              {contactUser.profilePic ? (
                <img src={contactUser.profilePic} alt={contactUser.name} className="w-full h-full object-cover" />
              ) : (
                contactUser.name?.[0]?.toUpperCase() || 'U'
              )}
            </div>

            <div>
              <h3 className="text-lg font-bold text-white flex items-center justify-center gap-2">
                {contactUser.name}
              </h3>
              <span className="text-xs text-sky-400 font-semibold">{contactUser.role || 'AICTE Member'}</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs font-semibold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {contactUser.statusMessage || contactUser.presenceStatus || 'Available'}
            </div>
          </div>

          {/* E2EE Status Card */}
          <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/80 mb-6 space-y-2 text-xs">
            <div className="flex items-center justify-between font-bold text-emerald-400">
              <span className="flex items-center gap-1.5"><FiShield /> 🔐 E2EE Direct Chat Compatible</span>
              <FiCheckCircle size={16} />
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Direct messages with {contactUser.name} use client-side ECDH P-256 key exchange. Messages are encrypted locally in your browser before transmission.
            </p>
          </div>

          {/* Metadata Section */}
          <div className="space-y-4 text-xs">
            {contactUser.email && (
              <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-800">
                <FiMail size={16} className="text-slate-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block">Official Email</span>
                  <span className="font-semibold text-slate-200">{contactUser.email}</span>
                </div>
              </div>
            )}

            {contactUser.college && (
              <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-800">
                <FiBriefcase size={16} className="text-slate-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block">Organization / College</span>
                  <span className="font-semibold text-slate-200">{contactUser.college}</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-800">
              <FiAward size={16} className="text-slate-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block">System Access Clearance</span>
                <span className="font-semibold text-slate-200">AICTE Samvaad Verified Official</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="space-y-2 pt-6 border-t border-slate-800">
          <button
            onClick={() => {
              onStartChat(contactUser);
              onClose();
            }}
            className="w-full py-3 bg-sky-500 hover:bg-sky-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-sky-900/40 flex items-center justify-center gap-2"
          >
            <FiMessageSquare size={16} /> Start Direct Chat
          </button>
          <button
            onClick={handleRemoveContact}
            className="w-full py-2.5 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-xl text-xs font-semibold border border-slate-700 transition-colors flex items-center justify-center gap-2"
          >
            <FiUserMinus size={14} /> Remove Contact
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContactProfileModal;
