import React from 'react';
import { FiX, FiMessageSquare, FiUserMinus, FiBriefcase, FiMail, FiAward } from 'react-icons/fi';
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[200] flex items-center justify-end p-0" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white h-full max-w-md w-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Contact Details</span>
            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            >
              <FiX size={18} />
            </button>
          </div>

          {/* Profile Header Card */}
          <div className="text-center space-y-3">
            <div className="w-20 h-20 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950/80 dark:text-sky-300 font-bold text-2xl flex items-center justify-center mx-auto overflow-hidden border border-sky-200 dark:border-sky-800 shadow-md">
              {contactUser.profilePic && !contactUser.profilePic.includes('placeholder') ? (
                <img src={contactUser.profilePic} alt={contactUser.name} className="w-full h-full object-cover" />
              ) : (
                contactUser.name?.[0]?.toUpperCase() || 'U'
              )}
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {contactUser.name}
              </h3>
              <p className="text-xs text-sky-600 dark:text-sky-400 font-semibold mt-0.5">
                {contactUser.role || 'AICTE Member'}
              </p>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-medium text-slate-700 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{contactUser.statusMessage || contactUser.presenceStatus || 'Active'}</span>
            </div>
          </div>

          {/* Metadata Section */}
          <div className="space-y-3 text-xs">
            {contactUser.email && (
              <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <FiMail size={17} className="text-slate-500 dark:text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block uppercase tracking-wider">Official Email</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block mt-0.5">{contactUser.email}</span>
                </div>
              </div>
            )}

            {contactUser.college && (
              <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <FiBriefcase size={17} className="text-slate-500 dark:text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block uppercase tracking-wider">Organization / Institute</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block mt-0.5">{contactUser.college}</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
              <FiAward size={17} className="text-slate-500 dark:text-slate-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block uppercase tracking-wider">Access Clearance</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block mt-0.5">AICTE Samvaad Verified Official</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="space-y-2 pt-6 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={() => {
              onStartChat(contactUser);
              onClose();
            }}
            className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <FiMessageSquare size={15} /> Start Direct Chat
          </button>
          <button
            onClick={handleRemoveContact}
            className="w-full py-2.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 dark:bg-slate-800 dark:hover:bg-red-950/30 dark:hover:text-red-400 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <FiUserMinus size={14} /> Remove Contact
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContactProfileModal;
