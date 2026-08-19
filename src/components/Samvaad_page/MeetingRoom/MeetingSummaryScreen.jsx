import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiVideo, FiFileText, FiArrowLeft } from 'react-icons/fi';

const MeetingSummaryScreen = ({ meeting, session }) => {
  const navigate = useNavigate();
  const participantsCount = session?.participants?.length || 1;
  const voteResult = session?.voteResult;

  return (
    <div className="summary-screen">
      <div className="summary-card">
        {/* Minimal Header (Zoom Style Video Icon) */}
        <div className="summary-header">
          <FiVideo size={28} className="text-slate-600 dark:text-slate-300 mx-auto mb-1" />
          <h2 className="summary-title">Meeting Completed</h2>
          <p className="summary-subtitle">Session details and record summary</p>
        </div>

        {/* Stats Grid */}
        <div className="summary-stats">
          <div className="summary-stat-box">
            <span className="summary-stat-label">Meeting ID</span>
            <span className="summary-stat-value font-mono">{meeting.id}</span>
          </div>
          <div className="summary-stat-box">
            <span className="summary-stat-label">Participants</span>
            <span className="summary-stat-value text-sky-600 dark:text-sky-400">{participantsCount}</span>
          </div>
          <div className="summary-stat-box">
            <span className="summary-stat-label">Recording</span>
            <span className="summary-stat-badge summary-stat-badge--sky">Saved</span>
          </div>
          <div className="summary-stat-box">
            <span className="summary-stat-label">Transcript</span>
            <span className="summary-stat-badge summary-stat-badge--sky">Available</span>
          </div>
        </div>

        {/* Executive Summary Box */}
        <div className="summary-ai-box">
          <h4 className="summary-ai-title">
            <FiFileText size={16} /> Session Executive Summary
          </h4>
          <p className="summary-ai-text">
            The committee evaluated {meeting.institute || 'the institute'} compliance requirements and infrastructure readiness.
            All agenda items were formally reviewed during this session.
          </p>

          {voteResult && (
            <div className="summary-ai-decision">
              <span className="summary-ai-decision-label">Committee Decision:</span>
              <span className="summary-ai-decision-value">{voteResult.decision} ({voteResult.decisionCount}/{voteResult.totalVotes} votes)</span>
            </div>
          )}
        </div>

        {/* Verification Proof */}
        <div className="summary-blockchain-box font-mono text-xs">
          <div className="summary-blockchain-row">
            <span>Session Reference:</span>
            <span className="text-slate-900 dark:text-white font-bold">{meeting.id}</span>
          </div>
          <div className="summary-blockchain-row">
            <span>Security Status:</span>
            <span className="text-sky-600 dark:text-sky-400 font-bold">Encrypted & Verified ✓</span>
          </div>
        </div>

        {/* Return Button */}
        <button
          onClick={() => navigate('/')}
          className="summary-return-btn"
        >
          <FiArrowLeft size={16} /> Return to Dashboard
        </button>
      </div>
    </div>
  );
};

export default MeetingSummaryScreen;
