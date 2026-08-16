import React, { useState } from 'react';
import { FiBarChart2, FiCheck, FiX, FiMinus, FiCheckCircle, FiClock, FiShield } from 'react-icons/fi';

const VotingPanel = ({
  voteState, voteResult, hasVoted, myVote,
  startVote, castVote, closeVote,
  isHost, participants
}) => {
  const [newQuestion, setNewQuestion] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const handleStartVote = () => {
    if (!newQuestion.trim()) return;
    startVote({
      question: newQuestion.trim(),
      options: ['Approve', 'Reject', 'Abstain'],
      isAnonymous,
    });
    setNewQuestion('');
  };

  // Active Vote in Progress
  if (voteState && voteState.status === 'active') {
    const progress = voteState.totalEligible > 0
      ? Math.round((voteState.totalVotes / voteState.totalEligible) * 100)
      : 0;

    return (
      <div className="space-y-4">
        {/* Status Badge */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <span className="text-xs font-semibold text-slate-400">Formal Motion</span>
          <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20 uppercase flex items-center gap-1">
            <FiClock size={11} className="animate-spin" /> Active Vote
          </span>
        </div>

        {/* Question Card */}
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-1.5">
          <p className="text-sm font-semibold text-white leading-snug">{voteState.question}</p>
          <p className="text-xs text-slate-400">
            {voteState.isAnonymous ? '🔒 Anonymous Ballot' : 'Public Roll-Call Vote'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-600 transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[11px] text-slate-400 block text-right font-medium">
            {voteState.totalVotes || 0} of {voteState.totalEligible || participants.length} voted ({progress}%)
          </span>
        </div>

        {/* Vote Options */}
        {!hasVoted ? (
          <div className="space-y-2 pt-1">
            {(voteState.options || ['Approve', 'Reject', 'Abstain']).map(option => (
              <button
                key={option}
                onClick={() => castVote(option)}
                className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                  option === 'Approve' ? 'bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border-sky-500/30' :
                  option === 'Reject' ? 'bg-red-500/10 hover:bg-red-500/20 text-red-300 border-red-500/30' :
                  'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                {option === 'Approve' ? <FiCheck size={14} /> :
                 option === 'Reject' ? <FiX size={14} /> :
                 <FiMinus size={14} />}
                <span>{option}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-sky-950/40 border border-sky-800/60 rounded-xl text-center space-y-1">
            <p className="text-sm font-bold text-sky-300 flex items-center justify-center gap-1.5">
              <FiCheckCircle size={16} />
              <span>You voted: {myVote}</span>
            </p>
            <p className="text-xs text-slate-400">Your vote has been cryptographically recorded.</p>
          </div>
        )}

        {/* Breakdown */}
        {voteState.breakdown && (
          <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase block">Live Results</span>
            {voteState.breakdown.map(b => (
              <div key={b.option} className="flex items-center justify-between gap-3 text-xs">
                <span className="text-slate-300 w-16 truncate">{b.option}</span>
                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      b.option === 'Approve' ? 'bg-sky-500' :
                      b.option === 'Reject' ? 'bg-red-500' :
                      'bg-slate-500'
                    }`}
                    style={{ width: `${voteState.totalVotes > 0 ? (b.count / voteState.totalVotes * 100) : 0}%` }}
                  />
                </div>
                <span className="text-slate-400 font-mono text-xs w-6 text-right">{b.count}</span>
              </div>
            ))}
          </div>
        )}

        {/* Host Close Vote Button */}
        {isHost && (
          <button
            onClick={closeVote}
            className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold text-xs shadow-md shadow-sky-600/20 transition-all cursor-pointer mt-2"
          >
            Close & Seal Vote Decision
          </button>
        )}
      </div>
    );
  }

  // Completed / Past Vote Result View
  if (voteResult) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <span className="text-xs font-semibold text-slate-400">Vote Result</span>
          <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20 uppercase">
            Closed & Sealed
          </span>
        </div>

        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2">
          <p className="text-sm font-semibold text-white leading-snug">{voteResult.question}</p>
          <div className="flex items-center gap-2 pt-1 border-t border-slate-800 text-xs">
            <span className="text-slate-400">Decision:</span>
            <span className="font-bold text-sky-400">{voteResult.decision}</span>
          </div>
        </div>

        <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase block">Final Breakdown</span>
          {voteResult.breakdown?.map(b => (
            <div key={b.option} className="flex items-center justify-between gap-3 text-xs">
              <span className="text-slate-300 w-16 truncate">{b.option}</span>
              <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    b.option === 'Approve' ? 'bg-sky-500' :
                    b.option === 'Reject' ? 'bg-red-500' :
                    'bg-slate-500'
                  }`}
                  style={{ width: `${voteResult.totalVotes > 0 ? (b.count / voteResult.totalVotes * 100) : 0}%` }}
                />
              </div>
              <span className="text-slate-400 font-mono text-xs w-12 text-right">{b.count} ({b.percentage}%)</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Host: Create New Vote
  return (
    <div className="space-y-4">
      {isHost ? (
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Initiate a formal decision vote for committee members. Results are anchored to the blockchain ledger.
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">Vote Motion / Question</label>
            <input
              type="text"
              value={newQuestion}
              onChange={e => setNewQuestion(e.target.value)}
              placeholder="e.g. Approve AICTE affiliation for 2026-27?"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={e => setIsAnonymous(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-sky-600"
              />
              <span>Anonymous ballot (hide voter names in evidence summary)</span>
            </label>
          </div>

          <button
            onClick={handleStartVote}
            disabled={!newQuestion.trim()}
            className="w-full py-3 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-md shadow-sky-600/25 transition-all cursor-pointer"
          >
            Launch Committee Vote
          </button>
        </div>
      ) : (
        <div className="p-8 text-center text-slate-400 space-y-2">
          <FiBarChart2 size={32} className="text-slate-600 mx-auto" />
          <h4 className="text-sm font-semibold text-white">No Active Vote</h4>
          <p className="text-xs text-slate-500">
            When the committee chair launches a motion, the voting ballot will appear here.
          </p>
        </div>
      )}
    </div>
  );
};

export default VotingPanel;
