import React, { useState, useEffect } from 'react';
import { FiX, FiSearch, FiUserPlus, FiCheck, FiMessageSquare, FiUser } from 'react-icons/fi';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const NewChatModal = ({ isOpen, onClose, onSelectUser, onContactAdded }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    if (isOpen) {
      // Load user contacts on open
      api.get('/users/contacts')
        .then(res => setContacts(res.data || []))
        .catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/users/directory?q=${encodeURIComponent(query.trim())}`);
        setResults(res.data || []);
      } catch (err) {
        console.error('User directory search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleAddContact = async (user) => {
    try {
      await api.post(`/users/contacts/${user._id}`);
      let chatData = null;
      try {
        const chatRes = await api.post(`/chat/direct/${user._id}`);
        chatData = chatRes.data;
      } catch (e) {
        // Non-fatal
      }
      toast.success(`${user.name} added to contacts`);
      setContacts(prev => [...prev, user]);
      setResults(prev => prev.map(u => u._id === user._id ? { ...u, isContact: true } : u));
      if (onContactAdded) {
        onContactAdded(user, chatData);
      }
    } catch {
      toast.error('Failed to add contact');
    }
  };

  const handleStartChat = async (user) => {
    try {
      const res = await api.post(`/chat/direct/${user._id}`);
      onSelectUser(res.data);
      onClose();
    } catch {
      toast.error('Failed to start chat');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2 text-white font-bold">
            <FiMessageSquare className="text-sky-400" />
            <span>New Direct Conversation</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <FiX size={18} />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-slate-800 bg-slate-900">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search people by name, email, role, or college..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
              autoFocus
            />
          </div>
        </div>

        {/* Results List / Contacts List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="text-center text-xs text-slate-400 py-8">Searching user directory...</div>
          ) : query.trim() !== '' ? (
            results.length === 0 ? (
              <div className="text-center text-xs text-slate-500 py-8">No registered users found matching "{query}"</div>
            ) : (
              results.map(user => (
                <div key={user._id} className="flex items-center justify-between p-3 bg-slate-800/60 hover:bg-slate-800 rounded-xl border border-slate-700/60 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center font-bold text-sky-400 text-sm overflow-hidden">
                      {user.profilePic ? (
                        <img src={user.profilePic} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        user.name?.[0]?.toUpperCase() || 'U'
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        {user.name}
                        {user.publicKey && <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">🔐 E2EE</span>}
                      </h4>
                      <p className="text-[10px] text-slate-400">{user.role || 'Member'} • {user.college || user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!user.isContact ? (
                      <button
                        onClick={() => handleAddContact(user)}
                        className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1"
                        title="Add to Contacts"
                      >
                        <FiUserPlus size={12} /> Contact
                      </button>
                    ) : (
                      <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 px-2 py-1 bg-emerald-500/10 rounded">
                        <FiCheck size={12} /> Contact
                      </span>
                    )}

                    <button
                      onClick={() => handleStartChat(user)}
                      className="px-3 py-1.5 bg-sky-500 hover:bg-sky-500 text-white rounded-lg text-xs font-bold shadow-md"
                    >
                      Message
                    </button>
                  </div>
                </div>
              ))
            )
          ) : (
            /* Show My Contacts by default when no search query */
            <div>
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <FiUser size={12} /> Your Contacts ({contacts.length})
              </h4>
              {contacts.length === 0 ? (
                <div className="text-center text-xs text-slate-500 py-6">
                  No saved contacts yet. Search for people above to add them to your contact list.
                </div>
              ) : (
                contacts.map(c => (
                  <div key={c._id} className="flex items-center justify-between p-2.5 bg-slate-800/40 hover:bg-slate-800/80 rounded-xl mb-2 border border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-sky-400">
                        {c.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-200">{c.name}</p>
                        <p className="text-[10px] text-slate-400">{c.role || 'Member'} • {c.college || c.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleStartChat(c)}
                      className="px-2.5 py-1 bg-sky-500/80 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold"
                    >
                      Message
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewChatModal;
