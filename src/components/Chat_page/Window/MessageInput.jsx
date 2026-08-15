import React, { useState, useRef } from "react";
import { FiSmile, FiPaperclip, FiImage, FiPlus, FiSend } from "react-icons/fi";

function MessageInput({
  newMessage,
  setNewMessage,
  sendMessage,
  showEmojiPicker,
  setShowEmojiPicker,
  emojis,
  isReplying,
  sendTypingStart,
  sendTypingStop
}) {
  const [isTyping, setIsTyping] = useState(false);
  const startTimeoutRef = useRef(null);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    if (value.trim() !== "") {
      if (!isTyping) {
        setIsTyping(true);
        if (startTimeoutRef.current) clearTimeout(startTimeoutRef.current);
        startTimeoutRef.current = setTimeout(() => {
          sendTypingStart();
        }, 300);
      }
    } else {
      if (startTimeoutRef.current) clearTimeout(startTimeoutRef.current);
      sendTypingStop();
      setIsTyping(false);
    }
  };

  const handleBlur = () => {
    if (startTimeoutRef.current) clearTimeout(startTimeoutRef.current);
    sendTypingStop();
    setIsTyping(false);
  };

  const handleSend = () => {
    if (!newMessage.trim() || isReplying) return;
    if (startTimeoutRef.current) clearTimeout(startTimeoutRef.current);
    sendTypingStop();
    setIsTyping(false);
    sendMessage();
  };

  return (
    <div className="p-4 bg-white dark:bg-black border-t border-gray-200 dark:border-slate-800 shrink-0 relative w-full">
      
      {/* Emoji Picker Dropdown */}
      {showEmojiPicker && (
        <div className="absolute bottom-20 right-6 bg-white dark:bg-black border border-gray-200 dark:border-slate-700 p-3 rounded-2xl shadow-2xl grid grid-cols-5 gap-2 z-50">
          {emojis.map((e) => (
            <button
              key={e}
              onClick={() => setNewMessage(newMessage + e)}
              className="text-2xl p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition text-gray-800 dark:text-slate-200"
            >
              {e}
            </button>
          ))}
        </div>
      )}

      {/* Input Dock Bar */}
      <div className="flex items-center gap-3 bg-gray-100 dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700/80 rounded-2xl px-4 py-3 shadow-inner">
        {/* Text Input */}
        <input
          type="text"
          value={newMessage}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message"
          className="flex-1 min-w-0 bg-transparent text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-400 text-sm focus:outline-none"
          disabled={isReplying}
        />

        {/* Right Icon Actions Cluster */}
        <div className="flex items-center gap-3 text-gray-500 dark:text-slate-400">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-1 hover:text-gray-900 dark:hover:text-white transition-colors"
            title="Add Emoji"
          >
            <FiSmile size={19} />
          </button>

          <button
            type="button"
            onClick={() => alert("Attachment upload ready")}
            className="p-1 hover:text-gray-900 dark:hover:text-white transition-colors"
            title="Attach file"
          >
            <FiPaperclip size={19} />
          </button>

          <button
            type="button"
            onClick={() => alert("Media upload ready")}
            className="p-1 hover:text-gray-900 dark:hover:text-white transition-colors"
            title="Attach image"
          >
            <FiImage size={19} />
          </button>

          <button
            type="button"
            onClick={() => alert("More options")}
            className="p-1 hover:text-gray-900 dark:hover:text-white transition-colors"
            title="More"
          >
            <FiPlus size={19} />
          </button>

          <button
            type="button"
            onClick={handleSend}
            disabled={!newMessage.trim() || isReplying}
            className={`p-2 rounded-lg transition-all flex items-center justify-center ${
              newMessage.trim() && !isReplying
                ? "bg-sky-500 hover:bg-sky-600 text-white shadow-md"
                : "text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"
            }`}
            title="Send Message"
          >
            <FiSend size={17} />
          </button>

        </div>
      </div>
    </div>
  );
}

export default MessageInput;
