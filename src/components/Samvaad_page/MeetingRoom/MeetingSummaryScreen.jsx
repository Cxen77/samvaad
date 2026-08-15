import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCheckCircle, FiCpu, FiAward, FiFileText, FiArrowLeft } from 'react-icons/fi';

const MeetingSummaryScreen = ({ meeting, session }) => {
  const navigate = useNavigate();
  const participantsCount = session?.participants?.length || 1;
  const voteResult = session?.voteResult;

  return (
    <div className="summary-screen">
      <div className="summary-card">
        {/* Header */}
        <div className="summary-header">
          <div className="summary-icon">
            <FiCheckCircle size={36} />
          </div>
          <h2 className="summary-title">Meeting Completed & Anchored</h2>
          <p className="summary-subtitle">AICTE Samvaad Evidence & Governance Record</p>
        </div>

        {/* Stats Grid */}
        <div className="summary-stats">
          <div className="summary-stat-box">
            <span className="summary-stat-label">Meeting ID</span>
            <span className="summary-stat-value font-mono">{meeting.id}</span>
          </div>
          <div className="summary-stat-box">
            <span className="summary-stat-label">Participants</span>
            <span className="summary-stat-value text-sky-400">{participantsCount}</span>
          </div>
          <div className="summary-stat-box">
            <span className="summary-stat-label">Cloud Recording</span>
            <span className="summary-stat-badge summary-stat-badge--sky">Processed</span>
          </div>
          <div className="summary-stat-box">
            <span className="summary-stat-label">Transcript</span>
            <span className="summary-stat-badge summary-stat-badge--sky">Available</span>
          </div>
        </div>

        {/* AI Summary Box */}
        <div className="summary-ai-box">
          <h4 className="summary-ai-title">
            <FiCpu size={16} /> AI Hearing Executive Summary
          </h4>
          <p className="summary-ai-text">
            The committee evaluated {meeting.institute || 'the institute'} infrastructure and compliance ratio.
            The laboratory setup meets AICTE standards for program approval.
          </p>

          {voteResult && (
            <div className="summary-ai-decision">
              <span className="summary-ai-decision-label">Formal Committee Decision:</span>
              <span className="summary-ai-decision-value">{voteResult.decision} ({voteResult.decisionCount}/{voteResult.totalVotes} votes)</span>
            </div>
          )}
        </div>

        {/* Blockchain Evidence Proof */}
        <div className="summary-blockchain-box font-mono">
          <div className="summary-blockchain-row">
            <span>Evidence Record ID:</span>
            <span className="text-white font-bold">{meeting.id}</span>
          </div>
          <div className="summary-blockchain-row">
            <span>Audit Hash:</span>
            <span className="text-amber-400 truncate max-w-[200px]">0x8b71a9c412f901...91ac</span>
          </div>
          <div className="summary-blockchain-row">
            <span>Polygon Proof Status:</span>
            <span className="text-sky-400 font-bold">Anchored ✓</span>
          </div>
        </div>

        {/* Return Button */}
        <button
          onClick={() => navigate('/')}
          className="summary-return-btn"
        >
          <FiArrowLeft size={16} /> Return to Samvaad Dashboard
        </button>
      </div>
    </div>
  );
};

export default MeetingSummaryScreen;
