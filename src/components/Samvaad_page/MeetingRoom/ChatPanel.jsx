import React, { useRef, useEffect } from 'react';
import { FiSend, FiLock, FiShield } from 'react-icons/fi';

const ChatPanel = ({ chat, currentUser, isMeetingSealed, meeting }) => {
  const { messages, loading, sendMessage } = chat;
  const [input, setInput] = React.useState('');
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
    <div className="panel-chat">
      {/* Header */}
      <div className="panel-chat__header">
        <div>
          <h3 className="panel-chat__title flex items-center gap-1.5">
            <FiLock size={13} className="text-sky-400" />
            <span>Meeting Chat</span>
          </h3>
          <p className="panel-chat__subtitle">{meeting.title}</p>
        </div>
        <span className="panel-chat__status">
          {isMeetingSealed ? 'Read-Only' : 'Encrypted'}
        </span>
      </div>

      {/* Sealed Banner */}
      {isMeetingSealed && (
        <div className="panel-chat__sealed-banner">
          <p className="panel-chat__sealed-title">
            <FiLock size={12} /> Meeting Ended
          </p>
          <p className="panel-chat__sealed-desc">This session has ended. Chat history is read-only.</p>
        </div>
      )}

      {/* Messages */}
      {loading ? (
        <div className="panel-chat__loading">Loading messages...</div>
      ) : (
        <div className="panel-chat__messages">
          {messages.length === 0 && (
            <div className="panel-chat__empty">
              <p className="panel-chat__empty-title">Meeting chat ready</p>
              <p className="panel-chat__empty-desc">Send a message to everyone in the room.</p>
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
                className={`panel-chat__msg ${isSystem ? 'panel-chat__msg--system' : ''} ${isMe ? 'panel-chat__msg--me' : ''}`}
              >
                {isSystem ? (
                  <p className="panel-chat__msg-text">{msg.text}</p>
                ) : (
                  <>
                    <div className="panel-chat__msg-header">
                      <span className={`panel-chat__msg-sender ${isMe ? 'panel-chat__msg-sender--me' : ''}`}>
                        {isMe ? 'You' : senderName}
                      </span>
                      <span className="panel-chat__msg-time">{msgTime}</span>
                    </div>
                    <p className="panel-chat__msg-text">{msg.text}</p>
                  </>
                )}
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSend} className="panel-chat__input-form">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={isMeetingSealed}
          placeholder={isMeetingSealed ? 'Meeting is sealed' : 'Type a message...'}
          className="panel-chat__input"
        />
        <button
          type="submit"
          disabled={isMeetingSealed || !input.trim()}
          className="panel-chat__send-btn"
          title="Send"
        >
          <FiSend size={14} />
        </button>
      </form>
    </div>
  );
};

export default ChatPanel;
