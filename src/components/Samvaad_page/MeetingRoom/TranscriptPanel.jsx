import React, { useState, useRef, useEffect } from 'react';
import { FiCpu, FiCopy, FiCheck, FiMic, FiMicOff, FiDownload, FiZap, FiLoader } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../../api/axios';

const TranscriptPanel = ({ 
  transcripts, 
  addTranscript, 
  currentUser,
  interimText,
  isTranscribing,
  startTranscription,
  stopTranscription
}) => {
  const [copied, setCopied] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const listRef = useRef(null);

  // Auto-scroll to bottom when new transcripts arrive
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [transcripts, interimText]);

  const handleCopy = () => {
    if (transcripts.length === 0) return;
    const fullText = transcripts.map(t => `[${t.time}] ${t.speaker}: ${t.text}`).join('\n');
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    toast.success('Transcript copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    if (transcripts.length === 0) return;
    let content = `AICTE SAMVAAD — Meeting Transcript\n`;
    content += `Generated: ${new Date().toLocaleString()}\n`;
    content += `${'─'.repeat(50)}\n\n`;
    content += transcripts.map(t => `[${t.time}] ${t.speaker}:\n${t.text}\n`).join('\n');
    
    if (aiSummary) {
      content += `\n${'─'.repeat(50)}\nAI SUMMARY\n${'─'.repeat(50)}\n\n`;
      content += aiSummary.summary + '\n\n';
      if (aiSummary.keyDecisions?.length) {
        content += 'KEY DECISIONS:\n' + aiSummary.keyDecisions.map((d, i) => `  ${i + 1}. ${d}`).join('\n') + '\n\n';
      }
      if (aiSummary.actionItems?.length) {
        content += 'ACTION ITEMS:\n' + aiSummary.actionItems.map((a, i) => `  ${i + 1}. ${a.task} → ${a.assignee} (${a.deadline})`).join('\n') + '\n\n';
      }
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Transcript exported');
  };

  const handleGenerateSummary = async () => {
    if (transcripts.length === 0) {
      toast.error('No transcript entries to summarize');
      return;
    }

    setIsSummarizing(true);
    try {
      const fullText = transcripts.map(t => `[${t.time}] ${t.speaker}: ${t.text}`).join('\n');
      const res = await api.post('/ai/summarize', { transcript: fullText });
      if (res.data?.success && res.data?.data) {
        setAiSummary(res.data.data);
        setShowSummary(true);
        toast.success('AI Summary generated');
      } else {
        toast.error(res.data?.message || 'Failed to generate summary');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to generate AI summary';
      toast.error(msg);
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className="panel-transcript">
      {/* Header */}
      <div className="panel-transcript__header">
        <div>
          <h3 className="panel-transcript__title flex items-center gap-1.5">
            <FiCpu size={16} className="text-sky-400" />
            <span>AI Notes</span>
            {isTranscribing && (
              <span className="inline-flex items-center gap-1 ml-1.5 px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                LIVE
              </span>
            )}
          </h3>
          <p className="panel-transcript__subtitle">
            {isTranscribing ? 'Listening...' : 'Real-time speech-to-text'}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={handleCopy} className="panel-transcript__copy-btn flex items-center gap-1" title="Copy transcript">
            {copied ? <FiCheck size={12} /> : <FiCopy size={12} />}
          </button>
          <button onClick={handleExport} className="panel-transcript__copy-btn flex items-center gap-1" title="Export as .txt">
            <FiDownload size={12} />
          </button>
        </div>
      </div>

      {/* Transcription Toggle */}
      <div className="px-3 py-2 border-b border-slate-800/60">
        <button
          onClick={isTranscribing ? stopTranscription : startTranscription}
          className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
            isTranscribing 
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30' 
              : 'bg-sky-600/20 text-sky-400 hover:bg-sky-600/30 border border-sky-500/30'
          }`}
        >
          {isTranscribing ? <FiMicOff size={14} /> : <FiMic size={14} />}
          {isTranscribing ? 'Stop Transcription' : 'Start Transcription'}
        </button>
      </div>

      {/* Transcript Feed */}
      <div className="panel-transcript__list" ref={listRef}>
        {transcripts.length === 0 && !interimText ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-500 text-sm text-center px-4">
            <FiMic size={28} className="mb-3 text-slate-600" />
            <p className="font-medium text-slate-400">No transcript yet</p>
            <p className="text-xs mt-1">
              Click "Start Transcription" to begin capturing speech in real-time.
            </p>
          </div>
        ) : (
          <>
            {transcripts.map(t => (
              <div key={t.id} className="panel-transcript__item">
                <div className="panel-transcript__item-header">
                  <span className="panel-transcript__speaker">{t.speaker}</span>
                  <span className="panel-transcript__time">{t.time}</span>
                </div>
                <p className="panel-transcript__text">{t.text}</p>
              </div>
            ))}
            {/* Interim (in-progress) text */}
            {interimText && (
              <div className="panel-transcript__item opacity-60">
                <div className="panel-transcript__item-header">
                  <span className="panel-transcript__speaker">{currentUser?.name || 'You'}</span>
                  <span className="panel-transcript__time text-sky-400">listening...</span>
                </div>
                <p className="panel-transcript__text italic">{interimText}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* AI Summary Section */}
      <div className="border-t border-slate-800/60">
        <button
          onClick={showSummary && aiSummary ? () => setShowSummary(!showSummary) : handleGenerateSummary}
          disabled={isSummarizing}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 text-sm font-medium text-slate-300 hover:bg-slate-800/40 transition-colors disabled:opacity-50"
        >
          {isSummarizing ? (
            <><FiLoader size={14} className="animate-spin" /> Generating Summary...</>
          ) : aiSummary ? (
            <><FiZap size={14} className="text-amber-400" /> {showSummary ? 'Hide' : 'Show'} AI Summary</>
          ) : (
            <><FiZap size={14} className="text-amber-400" /> Generate AI Summary</>
          )}
        </button>

        {showSummary && aiSummary && (
          <div className="px-3 pb-3 space-y-3">
            {/* Summary */}
            <div className="rounded-lg bg-slate-800/40 border border-slate-700/40 p-3">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Summary</h4>
              <p className="text-sm text-slate-300 leading-relaxed">{aiSummary.summary}</p>
            </div>

            {/* Key Decisions */}
            {aiSummary.keyDecisions?.length > 0 && (
              <div className="rounded-lg bg-slate-800/40 border border-slate-700/40 p-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Key Decisions</h4>
                <ul className="space-y-1">
                  {aiSummary.keyDecisions.map((d, i) => (
                    <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                      <span className="text-sky-400 mt-0.5 flex-shrink-0">•</span>
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Items */}
            {aiSummary.actionItems?.length > 0 && (
              <div className="rounded-lg bg-slate-800/40 border border-slate-700/40 p-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Action Items</h4>
                <ul className="space-y-1.5">
                  {aiSummary.actionItems.map((a, i) => (
                    <li key={i} className="text-sm text-slate-300">
                      <span className="text-emerald-400">→</span> {a.task}
                      <span className="text-xs text-slate-500 ml-1.5">({a.assignee} • {a.deadline})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Next Steps */}
            {aiSummary.nextSteps?.length > 0 && (
              <div className="rounded-lg bg-slate-800/40 border border-slate-700/40 p-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Next Steps</h4>
                <ul className="space-y-1">
                  {aiSummary.nextSteps.map((s, i) => (
                    <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                      <span className="text-amber-400 mt-0.5 flex-shrink-0">{i + 1}.</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TranscriptPanel;
