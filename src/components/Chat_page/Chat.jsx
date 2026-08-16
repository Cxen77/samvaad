import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useChats, useChatHistory } from "../../hooks/useChat";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import { 
  FiSearch, FiVideo, FiPlus, FiUserPlus, FiUsers, FiShield, 
  FiMessageSquare, FiChevronDown, FiInfo, FiLock, FiPhone,
  FiGrid, FiUser, FiBookOpen, FiTrash2, FiCheckSquare, FiSquare, FiX, FiFilter
} from "react-icons/fi";

// SIDEBAR & MODALS
import ChatListItem from "./Sidebar/ChatListItem";
import GroupChatModal from "./GroupChatModal";
import NewChatModal from "./NewChatModal";
import GroupAdminModal from "./GroupAdminModal";
import ContactProfileModal from "./ContactProfileModal";

// CHAT WINDOW
import ChatHeader from "./Window/ChatHeader";
import MessageList from "./Window/MessageList";
import MessageInput from "./Window/MessageInput";

import ContactsView from "./ContactsView";
import { useSocket } from "../../context/SocketContext";
import { useDirectCall } from "../../context/DirectCallContext";
import * as e2eeService from "../../services/e2eeService";
import toast from "react-hot-toast";

function Chat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const { onlineUsers } = useSocket();
  const { initiateCall } = useDirectCall();

  const { chats, loading: chatsLoading, refetchChats } = useChats();
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedContactUser, setSelectedContactUser] = useState(null);

  const [activeFilter, setActiveFilter] = useState('all'); // all, direct, groups, meetings, contacts
  const [search, setSearch] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reactingToMsg, setReactingToMsg] = useState(null);
  const [isReplying, setIsReplying] = useState(false);
  const [decryptedMessagesMap, setDecryptedMessagesMap] = useState(new Map());

  // Multi-Select & Clean Empty Meetings States (Zoom / Teams Style)
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedChatIds, setSelectedChatIds] = useState(new Set());
  const [hideEmptyMeetings, setHideEmptyMeetings] = useState(true);

  const chatEndRef = useRef(null);
  const emojis = ["😊", "👍", "🎉", "🔥", "😂", "💡", "😎", "❤️", "🙏", "🤔"];

  // 1. Initialize E2EE Client Key Pair on mount
  useEffect(() => {
    if (currentUser?._id) {
      e2eeService.initUserKeyPair(currentUser)
        .then(() => {
          // Keypair ready in IndexedDB
        })
        .catch(err => console.error('E2EE keypair init error:', err));
    }
  }, [currentUser]);

  // Default Self Chat object for personal space
  const selfUserInitials = currentUser?.name ? currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'DY';
  
  const selfChatObj = {
    _id: currentUser?._id || 'self-chat',
    id: currentUser?._id || 'self-chat',
    name: `${currentUser?.name || 'Dev Yadav'} (You)`,
    avatar: currentUser?.profilePic || null,
    status: 'Online',
    isGroupChat: false,
    isSelf: true,
    chatType: 'direct'
  };

  // Map API chats to UI shape
  const mappedChats = useMemo(() => {
    return chats.map(c => {
      if (c.chatType === 'meeting') {
        return {
          id: c._id,
          _id: c._id,
          name: c.chatName || 'Meeting Chat',
          avatar: null,
          status: 'Meeting Chat',
          isGroupChat: false,
          lastMessage: c.lastMessage,
          chatType: 'meeting',
          meetingId: c.meetingId,
          isEncrypted: c.isEncrypted
        };
      }

      if (c.isGroupChat || c.chatType === 'group') {
        return {
          id: c._id,
          _id: c._id,
          name: c.chatName || 'Group Chat',
          avatar: null,
          status: (c.participants?.length || 0) + " members",
          isGroupChat: true,
          lastMessage: c.lastMessage,
          chatType: 'group',
          description: c.description,
          participants: c.participants,
          groupAdmin: c.groupAdmin,
        };
      }

      // Direct Chat
      const other = (c.participants || []).find(p => p._id !== currentUser?._id) || {};
      const otherIdStr = other._id ? other._id.toString() : "";
      const isOnline = onlineUsers.has(otherIdStr) || onlineUsers.has(other._id);

      return {
        id: c._id,
        _id: c._id,
        name: other.name || "User",
        avatar: other.profilePic || null,
        status: isOnline ? "Online" : "Offline",
        isOnline: isOnline,
        lastMessage: c.lastMessage,
        isGroupChat: false,
        chatType: 'direct',
        otherUser: other,
        isEncrypted: true
      };
    });
  }, [chats, currentUser, onlineUsers]);

  // Identify empty meeting chats
  const emptyMeetingChats = useMemo(() => {
    return mappedChats.filter(c => c.chatType === 'meeting' && !c.lastMessage);
  }, [mappedChats]);

  // Combine items with self chat
  const allChatItems = useMemo(() => {
    let list = mappedChats.filter(c => c._id !== currentUser?._id);

    // If hideEmptyMeetings is active and not explicitly viewing all meetings tab, hide empty meeting chats
    if (hideEmptyMeetings && activeFilter !== 'meetings') {
      list = list.filter(c => !(c.chatType === 'meeting' && !c.lastMessage));
    }

    return [selfChatObj, ...list];
  }, [mappedChats, currentUser, hideEmptyMeetings, activeFilter]);

  // Apply Filter Pills (All, Direct, Groups, Meetings)
  const filteredByType = useMemo(() => {
    if (activeFilter === 'direct') {
      return allChatItems.filter(c => c.chatType === 'direct');
    }
    if (activeFilter === 'groups') {
      return allChatItems.filter(c => c.isGroupChat || c.chatType === 'group');
    }
    if (activeFilter === 'meetings') {
      const meetingsList = mappedChats.filter(c => c.chatType === 'meeting');
      if (hideEmptyMeetings) {
        return meetingsList.filter(c => !!c.lastMessage);
      }
      return meetingsList;
    }
    return allChatItems;
  }, [activeFilter, allChatItems, mappedChats, hideEmptyMeetings]);

  // Search filter
  const filteredChats = useMemo(() => {
    const s = search.toLowerCase().trim();
    if (!s) return filteredByType;
    return filteredByType.filter(chat => chat.name.toLowerCase().includes(s));
  }, [filteredByType, search]);

  // Active Chat Selection
  const activeChatRaw = id ? (allChatItems.find(c => c._id === id) || chats.find(c => c._id === id) || (id === currentUser?._id ? selfChatObj : null)) : selfChatObj;
  const activeChat = activeChatRaw || selfChatObj;
  const isSelfSpace = activeChat.isSelf || activeChat._id === currentUser?._id || activeChat.name?.includes('(You)');

  // Fetch History for active chat if not self space
  const {
    messages: historyMessages,
    loading: historyLoading,
    loadMore,
    sendMessage,
    sendTypingStart,
    sendTypingStop,
    typingUsers
  } = useChatHistory(id && id !== currentUser?._id ? id : null);

  // Decrypt E2EE Direct Messages on the fly
  useEffect(() => {
    if (!historyMessages || isSelfSpace || activeChat.chatType !== 'direct') return;

    let mounted = true;
    const otherUser = activeChat.otherUser || activeChat.participants?.find(p => p._id !== currentUser?._id);
    const otherUserId = otherUser?._id;

    if (!otherUserId) return;

    const decryptAll = async () => {
      const newDecrypted = new Map(decryptedMessagesMap);
      for (const m of historyMessages) {
        if (m.encryptedContent && m.iv && m.authTag && !newDecrypted.has(m._id)) {
          const text = await e2eeService.decryptDirectMessagePayload(m, currentUser._id, otherUserId);
          newDecrypted.set(m._id, text);
        }
      }
      if (mounted) setDecryptedMessagesMap(newDecrypted);
    };

    decryptAll();

    return () => { mounted = false; };
  }, [historyMessages, activeChat, currentUser, isSelfSpace]);

  // Auto-scroll
  useEffect(() => {
    if (!historyLoading) {
      chatEndRef.current?.scrollIntoView({ behavior: "auto" });
    }
  }, [historyMessages, historyLoading, activeChat]);

  const [newMessage, setNewMessage] = useState("");

  const handleSendMessage = async (text) => {
    const msgText = text || newMessage;
    if (!msgText.trim()) return;

    if (isSelfSpace) {
      setNewMessage("");
      return;
    }

    setIsReplying(true);
    try {
      sendTypingStop();

      // Check if this is a Direct E2EE Chat
      const isDirectChat = activeChat.chatType === 'direct' || (!activeChat.isGroupChat && activeChat.chatType !== 'meeting');
      const otherUser = activeChat.otherUser || activeChat.participants?.find(p => p._id !== currentUser?._id);

      if (isDirectChat && otherUser?._id) {
        // Perform Client-Side E2EE Encryption
        const encryptedPayload = await e2eeService.encryptDirectMessagePayload(
          msgText.trim(),
          currentUser._id,
          otherUser._id
        );

        if (encryptedPayload) {
          await sendMessage(encryptedPayload.text, {
            encryptedContent: encryptedPayload.encryptedContent,
            iv: encryptedPayload.iv,
            authTag: encryptedPayload.authTag
          });
        } else {
          // Fallback if E2EE key derivation fails
          await sendMessage(msgText);
        }
      } else {
        // Group or Meeting Chat
        await sendMessage(msgText);
      }

      setNewMessage("");
      setShowEmojiPicker(false);
    } catch (error) {
      console.error("Failed to send message", error);
      toast.error("Failed to send message");
    } finally {
      setIsReplying(false);
    }
  };

  // -------------------------------------------------------------
  // MULTI-SELECT & BULK MANAGEMENT HANDLERS (ZOOM / TEAMS STYLE)
  // -------------------------------------------------------------
  const toggleSelectChat = (chatId) => {
    setSelectedChatIds(prev => {
      const next = new Set(prev);
      if (next.has(chatId)) {
        next.delete(chatId);
      } else {
        next.add(chatId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const selectableIds = filteredChats.filter(c => !c.isSelf).map(c => c._id);
    if (selectedChatIds.size === selectableIds.length) {
      setSelectedChatIds(new Set());
    } else {
      setSelectedChatIds(new Set(selectableIds));
    }
  };

  const handleSelectEmptyMeetings = () => {
    const emptyIds = emptyMeetingChats.map(c => c._id);
    setSelectedChatIds(new Set(emptyIds));
    setIsMultiSelectMode(true);
    toast.success(`Selected ${emptyIds.length} empty meeting chats`);
  };

  const handleBulkDelete = async () => {
    if (selectedChatIds.size === 0) return;
    const count = selectedChatIds.size;
    if (!window.confirm(`Are you sure you want to delete ${count} selected conversation${count > 1 ? 's' : ''}?`)) {
      return;
    }

    try {
      await api.put('/chat/delete', { chatIds: Array.from(selectedChatIds) });
      toast.success(`Deleted ${count} conversation${count > 1 ? 's' : ''}`);
      setSelectedChatIds(new Set());
      setIsMultiSelectMode(false);
      refetchChats?.();
      if (selectedChatIds.has(id)) {
        navigate('/chat');
      }
    } catch (err) {
      console.error('Bulk delete failed:', err);
      toast.error('Failed to delete selected conversations');
    }
  };

  const handleCleanEmptyMeetings = async () => {
    const emptyIds = emptyMeetingChats.map(c => c._id);
    if (emptyIds.length === 0) {
      toast('No empty meeting chats to clean', { icon: 'ℹ️' });
      return;
    }

    if (!window.confirm(`Clean and delete all ${emptyIds.length} empty meeting chat${emptyIds.length > 1 ? 's' : ''}?`)) {
      return;
    }

    try {
      await api.put('/chat/delete', { chatIds: emptyIds });
      toast.success(`Cleaned ${emptyIds.length} empty meeting chat${emptyIds.length > 1 ? 's' : ''}`);
      refetchChats?.();
      if (emptyIds.includes(id)) {
        navigate('/chat');
      }
    } catch (err) {
      console.error('Failed to clean empty meetings:', err);
      toast.error('Failed to clean empty meetings');
    }
  };

  const handleDeleteSingle = async (chat) => {
    if (!chat || chat.isSelf) return;
    if (!window.confirm(`Delete conversation "${chat.name}"?`)) return;

    try {
      await api.put('/chat/delete', { chatId: chat._id });
      toast.success('Conversation deleted');
      refetchChats?.();
      if (id === chat._id) {
        navigate('/chat');
      }
    } catch (err) {
      console.error('Failed to delete chat:', err);
      toast.error('Failed to delete conversation');
    }
  };

  // Prepare UI message items with decrypted text
  const windowChat = {
    ...activeChat,
    status: typingUsers?.length > 0 ? "Typing..." : activeChat.status,
    messages: historyMessages ? historyMessages.map(m => {
      const decryptedText = decryptedMessagesMap.get(m._id) || m.text;
      return {
        id: m._id,
        from: m.senderId === currentUser?._id || m.senderId?._id === currentUser?._id ? "me" : "them",
        sender: m.senderId,
        text: decryptedText,
        timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    }) : []
  };

  return (
    <div className="w-full h-full flex bg-white dark:bg-black text-gray-900 dark:text-slate-100 overflow-hidden font-sans">
      
      {/* MODALS */}
      <NewChatModal
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
        onSelectUser={c => {
          refetchChats?.();
          navigate(`/chat/${c._id}`);
        }}
      />

      <GroupAdminModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onGroupCreated={c => {
          refetchChats?.();
          navigate(`/chat/${c._id}`);
        }}
      />

      <ContactProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        contactUser={activeChat.otherUser}
        onStartChat={c => navigate(`/chat/${c._id}`)}
        onContactRemoved={() => refetchChats?.()}
      />

      {/* LEFT SIDEBAR (LIGHT + DARK SUPPORT) */}
      <div className="w-full md:w-[380px] lg:w-[420px] flex flex-col bg-white dark:bg-black border-r border-gray-200 dark:border-slate-800 shrink-0 h-full">
        
        {/* Header with New Chat & Multi-Select Toggle */}
        <div className="px-4 py-3.5 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FiMessageSquare className="text-sky-600 dark:text-sky-400" size={20} />
              <span>Chats</span>
            </h1>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Multi-Select Toggle Button (Teams / Zoom Style) */}
            <button
              onClick={() => {
                setIsMultiSelectMode(!isMultiSelectMode);
                setSelectedChatIds(new Set());
              }}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isMultiSelectMode 
                  ? 'bg-sky-600 text-white shadow-xs' 
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
              }`}
              title={isMultiSelectMode ? "Cancel Selection" : "Select Multiple Chats"}
            >
              <FiCheckSquare size={15} />
              <span className="hidden sm:inline">{isMultiSelectMode ? "Done" : "Select"}</span>
            </button>

            {/* New Direct Chat */}
            <button
              onClick={() => setIsNewChatModalOpen(true)}
              className="p-2 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 rounded-xl transition-all cursor-pointer"
              title="New Direct Chat"
            >
              <FiUserPlus size={15} />
            </button>

            {/* New Group Chat */}
            <button
              onClick={() => setIsGroupModalOpen(true)}
              className="p-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl transition-all shadow-xs cursor-pointer"
              title="Create New Group"
            >
              <FiPlus size={15} />
            </button>
          </div>
        </div>

        {/* Filter Tabs Row */}
        <div className="px-3 py-2.5 flex items-center gap-2 border-b border-gray-100 dark:border-slate-900 overflow-x-auto scrollbar-none">
          {[
            { id: 'all', label: 'All', icon: FiGrid },
            { id: 'direct', label: 'Direct', icon: FiUser },
            { id: 'groups', label: 'Groups', icon: FiUsers },
            { id: 'meetings', label: 'Meetings', icon: FiVideo },
            { id: 'contacts', label: 'Contacts', icon: FiBookOpen }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button 
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeFilter === tab.id 
                    ? 'bg-sky-600 text-white shadow-xs' 
                    : 'bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white border border-slate-200/60 dark:border-slate-800'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Bar & Hide Empty Meetings Toggle */}
        <div className="p-3 border-b border-gray-100 dark:border-slate-900 space-y-2">
          <div className="relative">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" size={15} strokeWidth={1.5} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs md:text-sm text-gray-900 dark:text-white focus:outline-none focus:border-sky-500 focus:bg-white dark:focus:bg-black transition-all shadow-xs"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                <FiX size={14} />
              </button>
            )}
          </div>

          {/* Quick Clean Empty Meetings / Filter (Clean inline, no box or border) */}
          {emptyMeetingChats.length > 0 && (
            <div className="flex items-center justify-between px-1 pt-1 text-xs">
              <span className="text-slate-500 dark:text-slate-400 truncate">
                {emptyMeetingChats.length} empty meeting {emptyMeetingChats.length > 1 ? 'chats' : 'chat'}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleCleanEmptyMeetings}
                  className="text-sky-600 dark:text-sky-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  title="Clean all empty meeting chats at once"
                >
                  <FiTrash2 size={12} />
                  <span>Clean All</span>
                </button>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <button
                  onClick={() => setHideEmptyMeetings(!hideEmptyMeetings)}
                  className={`font-semibold cursor-pointer ${hideEmptyMeetings ? 'text-sky-500' : 'text-slate-400'}`}
                >
                  {hideEmptyMeetings ? 'Hidden' : 'Show'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* MULTI-SELECT FLOATING ACTION BAR (ZOOM / TEAMS STYLE) */}
        {isMultiSelectMode && (
          <div className="px-3.5 py-2.5 bg-sky-50 dark:bg-sky-950/60 border-b border-sky-200 dark:border-sky-800 flex items-center justify-between animate-fadeIn text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={handleSelectAll}
                className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-slate-700 dark:text-slate-300 hover:text-sky-600 transition-colors cursor-pointer"
              >
                {selectedChatIds.size === filteredChats.filter(c => !c.isSelf).length ? 'Deselect All' : 'Select All'}
              </button>
              <span className="font-bold text-sky-700 dark:text-sky-300">
                {selectedChatIds.size} selected
              </span>
            </div>

            <div className="flex items-center gap-2">
              {emptyMeetingChats.length > 0 && (
                <button
                  onClick={handleSelectEmptyMeetings}
                  className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-sky-600 rounded-lg font-semibold cursor-pointer"
                  title="Select all empty meeting chats"
                >
                  Select Empty
                </button>
              )}
              <button
                disabled={selectedChatIds.size === 0}
                onClick={handleBulkDelete}
                className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                  selectedChatIds.size > 0
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-xs cursor-pointer'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                }`}
              >
                <FiTrash2 size={13} />
                <span>Delete ({selectedChatIds.size})</span>
              </button>
            </div>
          </div>
        )}

        {/* Chat List Items */}
        <div className="flex-1 overflow-y-auto py-2 space-y-1">
          {filteredChats.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
              No conversations found
            </div>
          ) : (
            filteredChats.map(chat => (
              <ChatListItem
                key={chat._id}
                chat={chat}
                activeChat={activeChat}
                setActiveChat={c => navigate(`/chat/${c._id}`)}
                currentUser={currentUser}
                isMultiSelectMode={isMultiSelectMode}
                isSelected={selectedChatIds.has(chat._id)}
                onToggleSelect={toggleSelectChat}
                onDeleteSingle={handleDeleteSingle}
              />
            ))
          )}
        </div>
      </div>

      {/* RIGHT CHAT WINDOW (CANVAS) */}
      {activeFilter === 'contacts' ? (
        <ContactsView
          onStartChat={async (user) => {
            try {
              const res = await api.post(`/chat/direct/${user._id}`);
              refetchChats?.();
              setActiveFilter('direct');
              navigate(`/chat/${res.data._id}`);
            } catch {
              toast.error('Failed to start chat');
            }
          }}
          onOpenProfile={(user) => {
            setSelectedContactUser(user);
            setIsProfileModalOpen(true);
          }}
        />
      ) : (
        <div className="flex-1 flex flex-col bg-white dark:bg-black h-full overflow-hidden relative">
          {/* Customized Header with E2EE Badge & Profile Drawer */}
          <div className="h-16 bg-white dark:bg-black border-b border-gray-200 dark:border-slate-800 px-6 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-sky-500 flex items-center justify-center font-bold text-white shadow-md overflow-hidden">
                {activeChat.avatar ? (
                  <img src={activeChat.avatar} alt={activeChat.name} className="w-full h-full object-cover" />
                ) : (
                  activeChat.name?.[0]?.toUpperCase() || 'U'
                )}
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  <span>{activeChat.name}</span>
                  {activeChat.chatType === 'direct' && !isSelfSpace && (
                    <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-[10px]" title="End-to-End Encrypted">
                      <FiShield size={11} />
                    </span>
                  )}
                  {activeChat.chatType === 'meeting' && (
                    <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-[10px]" title="Meeting Chat">
                      <FiVideo size={11} />
                    </span>
                  )}
                  {(activeChat.chatType === 'group' || activeChat.isGroupChat) && (
                    <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-[10px]" title="Group Chat">
                      <FiUsers size={11} />
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-slate-400">{windowChat.status || 'Available'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Delete / Clear Chat Button in Header */}
              {!isSelfSpace && (
                <button
                  onClick={() => handleDeleteSingle(activeChat)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                  title="Delete Conversation"
                >
                  <FiTrash2 size={16} />
                </button>
              )}

              {(() => {
                const targetOtherUser = activeChat.otherUser || (Array.isArray(activeChat.participants) ? activeChat.participants.find(p => (p._id?.toString() || p?.toString()) !== currentUser?._id?.toString()) : null);
                const isDirectChat = activeChat.chatType === 'direct' || (!activeChat.isGroupChat && activeChat.chatType !== 'meeting');

                if (!isDirectChat || isSelfSpace || !targetOtherUser) return null;

                return (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => initiateCall({ targetUser: targetOtherUser, conversationId: activeChat._id, type: 'voice' })}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-sky-500 hover:text-white text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                      title="Start Voice Call"
                    >
                      <FiPhone size={14} /> Voice Call
                    </button>
                    <button
                      onClick={() => initiateCall({ targetUser: targetOtherUser, conversationId: activeChat._id, type: 'video' })}
                      className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                      title="Start Video Call"
                    >
                      <FiVideo size={14} /> Video Call
                    </button>
                    <button
                      onClick={() => setIsProfileModalOpen(true)}
                      className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                      title="View Contact Profile"
                    >
                      <FiInfo size={15} />
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>

          {isSelfSpace ? (
            /* PERSONAL SPACE VIEW MATCHING REFERENCE IMAGE */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-black">
              <div className="w-28 h-28 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950/80 dark:text-sky-300 font-bold text-4xl flex items-center justify-center mb-6 border-2 border-sky-200 dark:border-sky-800 shadow-2xl">
                {selfUserInitials}
              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">This is your personal space</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400 max-w-md leading-relaxed mx-auto">
                Use this workspace for personal notes, drafts, and self-sent files across device sessions.
              </p>
            </div>
          ) : (
            /* ACTIVE CONVERSATION MESSAGE LIST */
            <MessageList
              chat={windowChat}
              emojis={emojis}
              reactingToMsg={reactingToMsg}
              setReactingToMsg={setReactingToMsg}
              handleReact={() => setReactingToMsg(null)}
              chatEndRef={chatEndRef}
              isReplying={isReplying || historyLoading}
              loadMore={loadMore}
            />
          )}

          {/* Bottom Message Input Dock */}
          <MessageInput
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            sendMessage={() => handleSendMessage()}
            showEmojiPicker={showEmojiPicker}
            setShowEmojiPicker={setShowEmojiPicker}
            emojis={emojis}
            isReplying={isReplying}
            sendTypingStart={sendTypingStart}
            sendTypingStop={sendTypingStop}
          />
        </div>
      )}
    </div>
  );
}

export default Chat;
