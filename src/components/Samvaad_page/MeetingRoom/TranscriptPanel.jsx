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
    <div className="space-y-4">
      {/* Actions & Status */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">Speech Feed</span>
          {isTranscribing && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              LIVE
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button 
            onClick={handleCopy} 
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors" 
            title="Copy transcript"
          >
            {copied ? <FiCheck size={13} className="text-sky-400" /> : <FiCopy size={13} />}
          </button>
          <button 
            onClick={handleExport} 
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors" 
            title="Export as .txt"
          >
            <FiDownload size={13} />
          </button>
        </div>
      </div>

      {/* Transcription Toggle */}
      <button
        onClick={isTranscribing ? stopTranscription : startTranscription}
        className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md ${
          isTranscribing 
            ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20' 
            : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/20'
        }`}
      >
        {isTranscribing ? <FiMicOff size={15} /> : <FiMic size={15} />}
        <span>{isTranscribing ? 'Stop Live Transcription' : 'Start Live Transcription'}</span>
      </button>

      {/* Transcript Feed */}
      <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1" ref={listRef}>
        {transcripts.length === 0 && !interimText ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-xs text-center px-4">
            <FiMic size={32} className="mb-3 text-slate-700" />
            <p className="font-semibold text-slate-300">No transcript entries yet</p>
            <p className="text-slate-500 text-[11px] mt-1">
              Click "Start Live Transcription" to capture meeting speech in real-time.
            </p>
          </div>
        ) : (
          <>
            {transcripts.map(t => (
              <div key={t.id} className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-sky-400">{t.speaker}</span>
                  <span className="text-[10px] text-slate-500">{t.time}</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">{t.text}</p>
              </div>
            ))}
            {/* Interim (in-progress) text */}
            {interimText && (
              <div className="p-3 bg-slate-900/50 border border-sky-500/20 rounded-xl space-y-1 opacity-80">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">{currentUser?.name || 'You'}</span>
                  <span className="text-[10px] text-sky-400 font-medium">listening...</span>
                </div>
                <p className="text-xs text-slate-300 italic">{interimText}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* AI Summary Section */}
      <div className="pt-2 border-t border-slate-800 space-y-2.5">
        <button
          onClick={showSummary && aiSummary ? () => setShowSummary(!showSummary) : handleGenerateSummary}
          disabled={isSummarizing}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-slate-200 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
        >
          {isSummarizing ? (
            <><FiLoader size={14} className="animate-spin text-sky-400" /> Generating Summary...</>
          ) : aiSummary ? (
            <><FiZap size={14} className="text-amber-400" /> {showSummary ? 'Hide' : 'Show'} AI Hearing Summary</>
          ) : (
            <><FiZap size={14} className="text-amber-400" /> Generate AI Hearing Summary</>
          )}
        </button>

        {showSummary && aiSummary && (
          <div className="space-y-2.5 p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs">
            {/* Summary */}
            <div className="space-y-1">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Executive Summary</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{aiSummary.summary}</p>
            </div>

            {/* Key Decisions */}
            {aiSummary.keyDecisions?.length > 0 && (
              <div className="space-y-1 pt-2 border-t border-slate-800">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Key Decisions</h4>
                <ul className="space-y-1">
                  {aiSummary.keyDecisions.map((d, i) => (
                    <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                      <span className="text-sky-400 mt-0.5">•</span>
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Items */}
            {aiSummary.actionItems?.length > 0 && (
              <div className="space-y-1 pt-2 border-t border-slate-800">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Action Items</h4>
                <ul className="space-y-1">
                  {aiSummary.actionItems.map((a, i) => (
                    <li key={i} className="text-xs text-slate-300">
                      <span className="text-sky-400 font-bold">→</span> {a.task}
                      <span className="text-[11px] text-slate-500 ml-1">({a.assignee} • {a.deadline})</span>
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
