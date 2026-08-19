import React, { useRef, useEffect, useState } from 'react';
import { FiSend, FiLock } from 'react-icons/fi';

const ChatPanel = ({ chat, currentUser, isMeetingSealed, meeting }) => {
  const { messages, loading, sendMessage } = chat;
  const [input, setInput] = useState('');
  const chatEndRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || isMeetingSealed) return;
    sendMessage(input.trim());
    setInput('');
  };

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Sealed Banner */}
      {isMeetingSealed && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 flex items-center justify-center gap-1.5">
            <FiLock size={13} /> Meeting Ended
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">This session has ended. Chat history is read-only.</p>
        </div>
      )}

      {/* Messages Feed */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
          Loading encrypted messages...
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[300px]">
          {messages.length === 0 && (
            <div className="text-center py-16 text-slate-500 space-y-1">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Meeting chat ready</p>
              <p className="text-[11px] text-slate-500">Send an encrypted message to everyone in the room.</p>
            </div>
          )}
          {messages.map(msg => {
            const isSystem = msg.messageType === 'system';
            const senderName = msg.senderId?.name || msg.sender || 'Unknown';
            const isMe = msg.senderId?._id === currentUser?._id || msg.senderId === currentUser?._id;
            const msgTime = msg.createdAt
              ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '';

            return (
              <div
                key={msg._id || msg.id}
                className={`p-3 rounded-xl border text-xs leading-relaxed transition-all ${
                  isSystem 
                    ? 'bg-sky-500/10 border-sky-500/20 text-sky-700 dark:text-sky-300 text-center font-medium' 
                    : isMe 
                    ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/60 ml-4' 
                    : 'bg-slate-50 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 mr-4'
                }`}
              >
                {isSystem ? (
                  <p>{msg.text}</p>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-semibold ${isMe ? 'text-sky-600 dark:text-sky-400' : 'text-slate-800 dark:text-slate-200'}`}>
                        {isMe ? 'You' : senderName}
                      </span>
                      <span className="text-[10px] text-slate-500">{msgTime}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-200 word-break">{msg.text}</p>
                  </>
                )}
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSend} className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={isMeetingSealed}
          placeholder={isMeetingSealed ? 'Meeting is sealed' : 'Type an encrypted message...'}
          className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
        />
        <button
          type="submit"
          disabled={isMeetingSealed || !input.trim()}
          className="p-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white rounded-xl transition-all cursor-pointer shadow-md shadow-sky-600/20"
        >
          <FiSend size={14} />
        </button>
      </form>
    </div>
  );
};

export default ChatPanel;
