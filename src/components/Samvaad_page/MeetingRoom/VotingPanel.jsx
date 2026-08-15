import React, { useState } from 'react';
import { FiCheck, FiX, FiMinus, FiBarChart2, FiCheckCircle, FiClock, FiPlus } from 'react-icons/fi';

const VotingPanel = ({
  voteState, voteResult, hasVoted, myVote,
  startVote, castVote, closeVote, isHost, participants
}) => {
  const [newQuestion, setNewQuestion] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [customOptions, setCustomOptions] = useState(['Approve', 'Reject', 'Abstain']);

  const handleStartVote = () => {
    if (!newQuestion.trim()) return;
    startVote({
      question: newQuestion.trim(),
      options: customOptions.filter(o => o.trim()),
      isAnonymous
    });
    setNewQuestion('');
  };

  // Active Vote in Progress
  if (voteState) {
    const progress = voteState.totalEligible > 0
      ? Math.round((voteState.totalVotes / voteState.totalEligible) * 100)
      : 0;

    return (
      <div className="panel-voting">
        <div className="panel-voting__header">
          <h3 className="panel-voting__title flex items-center gap-1.5">
            <FiBarChart2 size={16} className="text-sky-400" />
            <span>Active Vote</span>
          </h3>
          <span className="panel-voting__badge panel-voting__badge--active">In Progress</span>
        </div>

        <div className="panel-voting__question">
          <p className="panel-voting__question-text">{voteState.question}</p>
          <p className="panel-voting__question-meta">
            Started by {voteState.startedByName} • {voteState.isAnonymous ? 'Anonymous' : 'Public'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="panel-voting__progress">
          <div className="panel-voting__progress-bar">
            <div className="panel-voting__progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="panel-voting__progress-text">
            {voteState.totalVotes || 0} of {voteState.totalEligible || participants.length} voted ({progress}%)
          </span>
        </div>

        {/* Vote Options */}
        {!hasVoted ? (
          <div className="panel-voting__options">
            {(voteState.options || ['Approve', 'Reject', 'Abstain']).map(option => (
              <button
                key={option}
                onClick={() => castVote(option)}
                className={`panel-voting__option-btn ${
                  option === 'Approve' ? 'panel-voting__option-btn--approve' :
                  option === 'Reject' ? 'panel-voting__option-btn--reject' :
                  'panel-voting__option-btn--abstain'
                }`}
              >
                {option === 'Approve' ? <FiCheck size={16} /> :
                 option === 'Reject' ? <FiX size={16} /> :
                 <FiMinus size={16} />}
                <span>{option}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="panel-voting__voted">
            <p className="panel-voting__voted-text flex items-center justify-center gap-1.5">
              <FiCheckCircle size={16} />
              <span>You voted: <strong>{myVote}</strong></span>
            </p>
            <p className="panel-voting__voted-desc">Your vote has been securely recorded.</p>
          </div>
        )}

        {/* Breakdown */}
        {voteState.breakdown && (
          <div className="panel-voting__breakdown">
            {voteState.breakdown.map(b => (
              <div key={b.option} className="panel-voting__breakdown-row">
                <span className="panel-voting__breakdown-label">{b.option}</span>
                <div className="panel-voting__breakdown-bar-wrapper">
                  <div
                    className={`panel-voting__breakdown-bar ${
                      b.option === 'Approve' ? 'panel-voting__breakdown-bar--approve' :
                      b.option === 'Reject' ? 'panel-voting__breakdown-bar--reject' :
                      'panel-voting__breakdown-bar--abstain'
                    }`}
                    style={{ width: `${voteState.totalVotes > 0 ? (b.count / voteState.totalVotes * 100) : 0}%` }}
                  />
                </div>
                <span className="panel-voting__breakdown-count">{b.count}</span>
              </div>
            ))}
          </div>
        )}

        {/* Host Close Vote Button */}
        {isHost && (
          <button
            onClick={closeVote}
            className="panel-voting__close-btn"
          >
            Close & Seal Vote
          </button>
        )}
      </div>
    );
  }

  // Completed / Past Vote Result View
  if (voteResult) {
    return (
      <div className="panel-voting">
        <div className="panel-voting__header">
          <h3 className="panel-voting__title flex items-center gap-1.5">
            <FiCheckCircle size={16} className="text-emerald-400" />
            <span>Vote Result Sealed</span>
          </h3>
          <span className="panel-voting__badge panel-voting__badge--closed">Closed</span>
        </div>

        <div className="panel-voting__question">
          <p className="panel-voting__question-text">{voteResult.question}</p>
          <p className="panel-voting__question-meta">Decision: <strong className="text-white">{voteResult.decision}</strong></p>
        </div>

        <div className="panel-voting__breakdown">
          {voteResult.breakdown?.map(b => (
            <div key={b.option} className="panel-voting__breakdown-row">
              <span className="panel-voting__breakdown-label">{b.option}</span>
              <div className="panel-voting__breakdown-bar-wrapper">
                <div
                  className={`panel-voting__breakdown-bar ${
                    b.option === 'Approve' ? 'panel-voting__breakdown-bar--approve' :
                    b.option === 'Reject' ? 'panel-voting__breakdown-bar--reject' :
                    'panel-voting__breakdown-bar--abstain'
                  }`}
                  style={{ width: `${voteResult.totalVotes > 0 ? (b.count / voteResult.totalVotes * 100) : 0}%` }}
                />
              </div>
              <span className="panel-voting__breakdown-count">{b.count} ({b.percentage}%)</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Host: Create New Vote
  return (
    <div className="panel-voting">
      <div className="panel-voting__header">
        <h3 className="panel-voting__title flex items-center gap-1.5">
          <FiBarChart2 size={16} className="text-sky-400" />
          <span>Committee Voting</span>
        </h3>
      </div>

      {isHost ? (
        <div className="panel-voting__create">
          <p className="panel-voting__create-desc">
            Initiate a formal decision vote for committee members.
          </p>

          <div className="panel-voting__form-group">
            <label className="panel-voting__label">Vote Motion / Question</label>
            <input
              type="text"
              value={newQuestion}
              onChange={e => setNewQuestion(e.target.value)}
              placeholder="e.g. Approve AICTE affiliation for 2026-27?"
              className="panel-voting__input"
            />
          </div>

          <div className="panel-voting__form-group">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={e => setIsAnonymous(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-sky-600"
              />
              <span>Anonymous voting (hide voter names in summary)</span>
            </label>
          </div>

          <button
            onClick={handleStartVote}
            disabled={!newQuestion.trim()}
            className="panel-voting__start-btn flex items-center justify-center gap-1.5"
          >
            <FiPlus size={14} /> Start Committee Vote
          </button>
        </div>
      ) : (
        <div className="panel-voting__empty">
          <FiClock size={24} className="text-slate-500 mb-2 mx-auto" />
          <p className="text-xs text-slate-400">No active vote in progress.</p>
          <p className="text-[11px] text-slate-500 mt-1">The host will initiate a vote when needed.</p>
        </div>
      )}
    </div>
  );
};

export default VotingPanel;
