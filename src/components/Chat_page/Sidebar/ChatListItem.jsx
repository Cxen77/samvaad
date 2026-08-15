import { FiUser, FiUsers, FiVideo, FiShield, FiCheck } from 'react-icons/fi';

function ChatListItem({ chat, activeChat, setActiveChat, currentUser }) {
  const lastMsg = chat.lastMessage || (chat.messages && chat.messages[chat.messages.length - 1]);
  const isActive = activeChat?._id === chat._id;
  const isSelf = currentUser && (chat.id === currentUser._id || chat.name?.includes('You'));

  const initials = chat.name ? chat.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'DY';

  return (
    <div
      className={`flex items-center gap-3 p-3 mx-2 rounded-xl cursor-pointer transition-all ${
        isActive
          ? "bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white font-semibold shadow-sm border border-gray-200 dark:border-slate-700/60"
          : "text-gray-700 dark:text-slate-300 hover:bg-gray-100/70 dark:hover:bg-slate-900/60 hover:text-gray-900 dark:hover:text-white border border-transparent"
      }`}
      onClick={() => setActiveChat(chat)}
    >
      {/* Avatar Circle with Checkmark Badge */}
      <div className="relative shrink-0 flex items-center justify-center">
        {chat.avatar && !chat.avatar.includes('placeholder') && !chat.avatar.includes('via.placeholder') ? (
          <img
            src={chat.avatar}
            alt={chat.name}
            className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-slate-700"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950/80 dark:text-sky-300 font-bold text-sm flex items-center justify-center border border-sky-200 dark:border-sky-800">
            {initials}
          </div>
        )}

        {/* Green Online Checkmark Badge */}
        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-950 rounded-full flex items-center justify-center shadow">
          <FiCheck size={9} className="text-white" strokeWidth={3} />
        </span>
      </div>

      {/* Name + Details */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <span className="font-bold text-sm text-gray-900 dark:text-slate-100 truncate flex items-center gap-1.5">
            {chat.chatType === 'direct' || (!chat.isGroupChat && chat.chatType !== 'meeting') ? (
              <FiUser className="text-gray-500 dark:text-slate-400" title="Direct Chat" />
            ) : chat.isGroupChat || chat.chatType === 'group' ? (
              <FiUsers className="text-gray-500 dark:text-slate-400" title="Group Chat" />
            ) : (
              <FiVideo className="text-gray-500 dark:text-slate-400" title="Meeting Chat" />
            )}
            <span className="truncate">{chat.name}</span> {isSelf && <span className="text-gray-500 dark:text-slate-400 font-normal">(You)</span>}
          </span>
        </div>

        <div className="flex justify-between items-center mt-0.5">
          <p className="text-xs text-gray-500 dark:text-slate-400 truncate flex items-center gap-1">
            {chat.chatType === 'direct' && !isSelf && <FiShield size={10} className="text-gray-400" title="E2EE" />}
            {lastMsg?.text || (isSelf ? "This is your personal space" : "No messages yet")}
          </p>
          {lastMsg?.createdAt && (
            <span className="text-[10px] text-gray-400 dark:text-slate-500 shrink-0 ml-1">
              {new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatListItem;
