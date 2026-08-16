import React from 'react';
import { FiUser, FiUsers, FiVideo, FiShield, FiCheck, FiTrash2, FiSquare, FiCheckSquare } from 'react-icons/fi';

function ChatListItem({ 
  chat, 
  activeChat, 
  setActiveChat, 
  currentUser, 
  isMultiSelectMode, 
  isSelected, 
  onToggleSelect, 
  onDeleteSingle 
}) {
  const lastMsg = chat.lastMessage || (chat.messages && chat.messages[chat.messages.length - 1]);
  const isActive = activeChat?._id === chat._id;
  const isSelf = currentUser && (chat.id === currentUser._id || chat.name?.includes('You'));

  const initials = chat.name ? chat.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'DY';

  const handleClick = () => {
    if (isMultiSelectMode && !isSelf) {
      onToggleSelect?.(chat._id);
    } else {
      setActiveChat(chat);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`group flex items-center gap-3 p-3 mx-2 rounded-xl cursor-pointer transition-all relative select-none ${
        isSelected
          ? "bg-sky-50 dark:bg-sky-950/40 border border-sky-500/50 text-slate-900 dark:text-white"
          : isActive && !isMultiSelectMode
            ? "bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white font-semibold shadow-xs border border-gray-200 dark:border-slate-700/60"
            : "text-gray-700 dark:text-slate-300 hover:bg-gray-100/70 dark:hover:bg-slate-900/60 hover:text-gray-900 dark:hover:text-white border border-transparent"
      }`}
    >
      {/* Multi-Select Checkbox (Zoom / Teams Style) */}
      {isMultiSelectMode && !isSelf && (
        <div 
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect?.(chat._id);
          }}
          className="shrink-0 text-slate-400 hover:text-sky-500 transition-colors"
        >
          {isSelected ? (
            <FiCheckSquare size={18} className="text-sky-500" />
          ) : (
            <FiSquare size={18} className="text-slate-400 dark:text-slate-600" />
          )}
        </div>
      )}

      {/* Avatar Circle with Online Indicator */}
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

        {/* Online Status Dot */}
        {chat.isOnline && (
          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-950 rounded-full" />
        )}
      </div>

      {/* Name + Details */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <span className="font-bold text-sm text-gray-900 dark:text-slate-100 truncate flex items-center gap-1.5">
            {chat.chatType === 'direct' || (!chat.isGroupChat && chat.chatType !== 'meeting') ? (
              <FiUser className="text-gray-500 dark:text-slate-400 shrink-0" size={13} title="Direct Chat" />
            ) : chat.isGroupChat || chat.chatType === 'group' ? (
              <FiUsers className="text-gray-500 dark:text-slate-400 shrink-0" size={13} title="Group Chat" />
            ) : (
              <FiVideo className="text-gray-500 dark:text-slate-400 shrink-0" size={13} title="Meeting Chat" />
            )}
            <span className="truncate">{chat.name}</span>
            {isSelf && <span className="text-gray-500 dark:text-slate-400 font-normal text-xs">(You)</span>}
          </span>

          {/* Timestamp when not hovering */}
          {lastMsg?.createdAt && !isMultiSelectMode && (
            <span className="text-[11px] text-gray-400 dark:text-slate-500 shrink-0 ml-1 group-hover:hidden">
              {new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        <div className="flex justify-between items-center mt-0.5">
          <p className="text-xs text-gray-500 dark:text-slate-400 truncate flex items-center gap-1">
            {chat.chatType === 'direct' && !isSelf && <FiShield size={10} className="text-gray-400 shrink-0" title="E2EE" />}
            {lastMsg?.text || (isSelf ? "This is your personal space" : "No messages yet")}
          </p>

          {/* Single Delete Button on Hover (Teams/Zoom style) */}
          {!isSelf && !isMultiSelectMode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteSingle?.(chat);
              }}
              className="hidden group-hover:flex items-center justify-center p-1 text-slate-400 hover:text-red-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md transition-all shrink-0 ml-1"
              title="Delete conversation"
            >
              <FiTrash2 size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatListItem;
