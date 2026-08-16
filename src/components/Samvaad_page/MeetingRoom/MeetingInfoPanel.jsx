import React, { useState } from 'react';
import { FiCopy, FiCheck, FiCalendar, FiClock, FiLink } from 'react-icons/fi';
import toast from 'react-hot-toast';

const MeetingInfoPanel = ({ meeting }) => {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(meeting.id);
    setCopiedId(true);
    toast.success('Meeting ID copied');
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/samvaad/waiting-room/${meeting.id}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    toast.success('Meeting link copied');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Main Details Section */}
      <div className="pb-3 border-b border-slate-800/60 space-y-2">
        <h4 className="text-base font-bold text-white">{meeting.title}</h4>
        {meeting.institute && (
          <p className="text-xs text-sky-400 font-medium">{meeting.institute}</p>
        )}

        <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">App ID</span>
            <span className="text-slate-200 font-medium">{meeting.applicationId || 'AICTE-APP'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Recording</span>
            <span className="text-sky-400 font-medium">Enabled (SHA-256)</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Date</span>
            <span className="text-slate-200 font-medium flex items-center gap-1 mt-0.5">
              <FiCalendar size={12} className="text-slate-400" /> {meeting.date || 'Today'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Time</span>
            <span className="text-slate-200 font-medium flex items-center gap-1 mt-0.5">
              <FiClock size={12} className="text-slate-400" /> {meeting.startTime || '10:30'} - {meeting.endTime || '12:00'}
            </span>
          </div>
        </div>
      </div>

      {/* Access Credentials & Copy Buttons */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Access Credentials</h4>

        <div className="space-y-1">
          <label className="text-[11px] text-slate-400 block font-medium">Meeting ID</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              readOnly 
              value={meeting.id} 
              className="flex-1 bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono select-all focus:outline-none" 
            />
            <button 
              onClick={handleCopyId} 
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              {copiedId ? <FiCheck size={14} className="text-sky-400" /> : <FiCopy size={14} />}
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] text-slate-400 block font-medium">Passcode</label>
          <input 
            type="text" 
            readOnly 
            value={meeting.password || 'None'} 
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono select-all focus:outline-none" 
          />
        </div>

        <button 
          onClick={handleCopyLink} 
          className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
        >
          {copiedLink ? <FiCheck size={14} /> : <FiLink size={14} />}
          <span>{copiedLink ? 'Direct Link Copied' : 'Copy Direct Join Link'}</span>
        </button>
      </div>
    </div>
  );
};

export default MeetingInfoPanel;
