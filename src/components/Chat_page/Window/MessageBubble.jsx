import { FaSmile } from "react-icons/fa";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FiCheck, FiVideo, FiPhone, FiPhoneOff } from "react-icons/fi";
import ReactionPicker from "./ReactionPicker";

function MessageBubble({
  msg,
  isMe,
  emojis,
  reactingToMsg,
  setReactingToMsg,
  handleReact
}) {
  if (!msg) return null;

  // Render message content, converting call emojis to icons without changing layout
  const renderMessageContent = (text) => {
    if (!text) return null;

    if (
      typeof text === 'string' &&
      (text.includes('📹') ||
        text.includes('📞') ||
        msg.messageType === 'call' ||
        text.toLowerCase().includes('video call') ||
        text.toLowerCase().includes('voice call') ||
        text.toLowerCase().includes('missed call'))
    ) {
      const isVideo = text.includes('📹') || text.toLowerCase().includes('video');
      const isMissed =
        text.toLowerCase().includes('missed') ||
        text.toLowerCase().includes('declined') ||
        text.toLowerCase().includes('busy');

      // Strip any broken unicode replacement characters (), emoji surrogate fragments, or stray symbols
      const callMatch = text.match(/(Voice call.*|Video call.*|Missed .*)/i);
      const cleanText = callMatch
        ? callMatch[1].trim()
        : text.replace(/^[\uFFFD\uD800-\uDFFF\uFE0F\s?📹📞☎️📱]+/u, '').trim();

      return (
        <span className="inline-flex items-center gap-2 align-middle leading-none">
          <span className="inline-flex items-center justify-center shrink-0 self-center">
            {isVideo ? (
              <FiVideo
                className={
                  isMissed
                    ? 'text-red-400'
                    : isMe
                    ? 'text-white'
                    : 'text-sky-600 dark:text-sky-400'
                }
                size={16}
              />
            ) : isMissed ? (
              <FiPhoneOff className="text-red-400" size={16} />
            ) : (
              <FiPhone
                className={
                  isMe ? 'text-white' : 'text-sky-600 dark:text-sky-400'
                }
                size={16}
              />
            )}
          </span>
          <span className="leading-normal">{cleanText}</span>
        </span>
      );
    }

    return <span className="break-words">{text}</span>;
  };

  // System messages render as centered notifications
  if (msg.messageType === 'system') {
    return (
      <div className="flex justify-center my-2">
        <div className="px-4 py-1.5 rounded-full bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 text-sky-500 dark:text-sky-300 text-xs font-medium text-center">
          {renderMessageContent(msg.text)}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>

      {/* Sender Name/Avatar for Group Chats (Incoming only) */}
      {!isMe && msg.sender && (
        <div className="flex items-center gap-2 mb-1 ml-1">
          <img
            src={msg.sender.profilePic || "https://via.placeholder.com/30"}
            alt={msg.sender.name || "Sender"}
            className="w-5 h-5 rounded-full object-cover"
          />
          <span className="text-xs text-gray-500 dark:text-slate-400 font-semibold">{msg.sender.name}</span>
        </div>
      )}

      <div className="group relative max-w-md">

        {/* MESSAGE BUBBLE */}
        <div
          className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm leading-relaxed ${isMe
              ? "bg-sky-500 hover:bg-sky-600 text-white rounded-br-md font-medium"
              : "bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-bl-md border border-gray-200 dark:border-slate-700"
            }`}
        >
          {renderMessageContent(msg.text)}
        </div>

        {/* REACTIONS UNDER BUBBLE */}
        {msg.reactions && msg.reactions.length > 0 && (
          <div className="absolute -bottom-2.5 right-2 flex gap-1 bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 px-2 py-0.5 rounded-full border border-gray-200 dark:border-slate-700 shadow-sm text-xs">
            {msg.reactions.map((r, i) => (
              <span key={i}>
                {r}
              </span>
            ))}
          </div>
        )}

        {/* HOVER ACTIONS — REACT, MORE */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? "-left-16" : "-right-16"
            }`}
        >
          {/* React button */}
          <button
            onClick={() =>
              setReactingToMsg(reactingToMsg === msg.id ? null : msg.id)
            }
            className="p-1.5 bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 shadow-sm"
            title="React"
          >
            <FaSmile size={13} />
          </button>

          {/* More options button */}
          <button className="p-1.5 bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 shadow-sm">
            <BsThreeDotsVertical size={12} />
          </button>
        </div>

        {/* REACTION PICKER POPUP */}
        {reactingToMsg === msg.id && (
          <ReactionPicker
            emojis={emojis}
            onSelect={(emoji) => handleReact(msg.id, emoji)}
            isMe={isMe}
          />
        )}
      </div>

      {/* TIMESTAMP + SEEN */}
      <div className="mt-1 flex items-center text-xs text-gray-400 dark:text-slate-500">
        <span className="mr-1">{msg.timestamp}</span>

        {/* Seen checkmark */}
        {isMe && (
          <span className="text-sky-500 dark:text-sky-400 flex items-center ml-1">
            <FiCheck size={12} strokeWidth={3} />
          </span>
        )}
      </div>

    </div>
  );
}

export default MessageBubble;
