import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useChats, useChatHistory } from "../../hooks/useChat";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import { 
  FiSearch, FiVideo, FiPlus, FiUserPlus, FiUsers, FiShield, 
  FiMessageSquare, FiChevronDown, FiInfo, FiLock, FiPhone,
  FiGrid, FiUser, FiBookOpen 
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

  const [activeFilter, setActiveFilter] = useState('all'); // all, direct, groups, meetings
  const [search, setSearch] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reactingToMsg, setReactingToMsg] = useState(null);
  const [isReplying, setIsReplying] = useState(false);
  const [decryptedMessagesMap, setDecryptedMessagesMap] = useState(new Map());

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
  const mappedChats = chats.map(c => {
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

  const allChatItems = [selfChatObj, ...mappedChats.filter(c => c._id !== currentUser?._id)];

  // Apply Filter Pills (All, Direct, Groups, Meetings)
  const filteredByType = activeFilter === 'direct'
    ? allChatItems.filter(c => c.chatType === 'direct')
    : activeFilter === 'groups'
      ? allChatItems.filter(c => c.isGroupChat || c.chatType === 'group')
      : activeFilter === 'meetings'
        ? allChatItems.filter(c => c.chatType === 'meeting')
        : allChatItems;

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

  // Search filter
  const filteredChats = filteredByType.filter(chat => {
    const s = search.toLowerCase();
    return chat.name.toLowerCase().includes(s);
  });

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
      <div className="w-full md:w-[380px] lg:w-[420px] flex flex-col bg-white dark:bg-black border-r border-gray-200 dark:border-slate-800/80 shrink-0 h-full">
        


        {/* Filter Tabs Row */}
        <div className="px-3 py-3 flex items-center gap-2 border-b border-gray-100 dark:border-slate-900 overflow-x-auto scrollbar-none">
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
                className={`px-3.5 py-1.5 rounded-full text-xs md:text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  activeFilter === tab.id 
                    ? 'bg-sky-500 text-white shadow-sm' 
                    : 'bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-gray-100 dark:border-slate-900">
          <div className="relative">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" size={16} strokeWidth={1.5} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-full pl-10 pr-4 py-2 text-xs md:text-sm text-gray-900 dark:text-white focus:outline-none focus:border-sky-500 focus:bg-white dark:focus:bg-black transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Chat List Items */}
        <div className="flex-1 overflow-y-auto py-2 space-y-1">
          {filteredChats.map(chat => (
            <ChatListItem
              key={chat._id}
              chat={chat}
              activeChat={activeChat}
              setActiveChat={c => navigate(`/chat/${c._id}`)}
              currentUser={currentUser}
            />
          ))}
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

            {(() => {
              const targetOtherUser = activeChat.otherUser || (Array.isArray(activeChat.participants) ? activeChat.participants.find(p => (p._id?.toString() || p?.toString()) !== currentUser?._id?.toString()) : null);
              const isDirectChat = activeChat.chatType === 'direct' || (!activeChat.isGroupChat && activeChat.chatType !== 'meeting');

              if (!isDirectChat || isSelfSpace || !targetOtherUser) return null;

              return (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => initiateCall({ targetUser: targetOtherUser, conversationId: activeChat._id, type: 'voice' })}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-sky-500 hover:text-white text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                    title="Start Voice Call"
                  >
                    <FiPhone size={14} /> Voice Call
                  </button>
                  <button
                    onClick={() => initiateCall({ targetUser: targetOtherUser, conversationId: activeChat._id, type: 'video' })}
                    className="px-3 py-1.5 bg-sky-500 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                    title="Start Video Call"
                  >
                    <FiVideo size={14} /> Video Call
                  </button>
                  <button
                    onClick={() => setIsProfileModalOpen(true)}
                    className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors"
                    title="View Contact Profile"
                  >
                    <FiInfo size={15} />
                  </button>
                </div>
              );
            })()}
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
