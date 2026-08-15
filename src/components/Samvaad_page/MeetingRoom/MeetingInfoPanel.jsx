import React, { useState } from 'react';
import { FiInfo, FiCopy, FiCheck, FiShield, FiCalendar, FiClock } from 'react-icons/fi';
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
    <div className="panel-info">
      <div className="panel-info__header">
        <h3 className="panel-info__title flex items-center gap-1.5">
          <FiInfo size={16} className="text-sky-400" />
          <span>Meeting Details</span>
        </h3>
      </div>

      {/* Main Metadata Card */}
      <div className="panel-info__card">
        <h4 className="panel-info__card-title">{meeting.title}</h4>
        <p className="panel-info__institute">{meeting.institute}</p>
        <div className="panel-info__meta-grid">
          <div className="panel-info__meta-item">
            <span className="panel-info__meta-label">App ID</span>
            <span className="panel-info__meta-value">{meeting.applicationId || 'N/A'}</span>
          </div>
          <div className="panel-info__meta-item">
            <span className="panel-info__meta-label">Security Level</span>
            <span className="panel-info__meta-value panel-info__meta-value--security">
              {meeting.securityLevel || 'Confidential'}
            </span>
          </div>
          <div className="panel-info__meta-item">
            <span className="panel-info__meta-label">Date</span>
            <span className="panel-info__meta-value flex items-center gap-1">
              <FiCalendar size={12} /> {meeting.date || 'Today'}
            </span>
          </div>
          <div className="panel-info__meta-item">
            <span className="panel-info__meta-label">Time</span>
            <span className="panel-info__meta-value flex items-center gap-1">
              <FiClock size={12} /> {meeting.startTime || '10:30'} - {meeting.endTime || '12:00'}
            </span>
          </div>
        </div>
      </div>

      {/* Access Credentials & Copy Buttons */}
      <div className="panel-info__card">
        <h4 className="panel-info__section-title font-semibold text-xs text-slate-300">Join Credentials</h4>

        <div className="panel-info__field">
          <label className="panel-info__label">Meeting ID</label>
          <div className="panel-info__input-group">
            <input type="text" readOnly value={meeting.id} className="panel-info__input font-mono" />
            <button onClick={handleCopyId} className="panel-info__copy-btn">
              {copiedId ? <FiCheck size={14} /> : <FiCopy size={14} />}
            </button>
          </div>
        </div>

        <div className="panel-info__field">
          <label className="panel-info__label">Passcode</label>
          <div className="panel-info__input-group">
            <input type="text" readOnly value={meeting.password || 'None'} className="panel-info__input font-mono" />
          </div>
        </div>

        <button onClick={handleCopyLink} className="panel-info__share-btn">
          {copiedLink ? <FiCheck size={14} /> : <FiCopy size={14} />}
          <span>{copiedLink ? 'Link Copied' : 'Copy Direct Link'}</span>
        </button>
      </div>
    </div>
  );
};

export default MeetingInfoPanel;
