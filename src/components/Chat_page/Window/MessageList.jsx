import MessageBubble from "./MessageBubble";

function MessageList({
  chat,
  emojis,
  reactingToMsg,
  setReactingToMsg,
  handleReact,
  chatEndRef,
  isReplying
}) {
  return (
    <div className="flex-1 p-4 overflow-y-auto bg-white dark:bg-black min-h-0 touch-pan-y" style={{ WebkitOverflowScrolling: 'touch', overscrollBehaviorY: 'none' }}>
      <div className="flex flex-col gap-3">
        <div className="text-center text-gray-400 dark:text-slate-500 text-[11px] font-mono">Today</div>

        {chat?.messages?.map((msg) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            isMe={msg.from === "me"}
            emojis={emojis}
            reactingToMsg={reactingToMsg}
            setReactingToMsg={setReactingToMsg}
            handleReact={handleReact}
          />
        ))}

        {/* Typing indicator */}
        {isReplying && (
          <div className="flex items-start gap-3">
            {chat?.avatar && (
              <img
                src={chat.avatar}
                alt="avatar"
                className="w-7 h-7 rounded-full border border-gray-200 dark:border-slate-700"
              />
            )}
            <div className="px-4 py-2 rounded-2xl rounded-bl-md bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 text-xs">
              <span className="italic text-gray-400 dark:text-slate-400">typing...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>
    </div>
  );
}

export default MessageList;
