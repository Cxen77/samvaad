import React, { useState, useEffect } from 'react';
import { 
  FiSearch, FiUserPlus, FiMessageSquare, FiUserMinus, FiShield, 
  FiMail, FiBriefcase, FiMoreVertical, FiCheck, FiUser
} from 'react-icons/fi';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const ContactsView = ({ onStartChat, onOpenProfile, onBack, onContactAdded }) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [directoryResults, setDirectoryResults] = useState([]);
  const [directoryLoading, setDirectoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('contacts'); // 'contacts' | 'directory'

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/contacts');
      setContacts(res.data || []);
    } catch (err) {
      console.error('Error fetching contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  // Directory search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setDirectoryResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setDirectoryLoading(true);
      try {
        const res = await api.get(`/users/directory?q=${encodeURIComponent(searchQuery.trim())}`);
        setDirectoryResults(res.data || []);
      } catch (err) {
        console.error('Error searching directory:', err);
      } finally {
        setDirectoryLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleAddContact = async (user) => {
    try {
      await api.post(`/users/contacts/${user._id}`);
      // Also initialize or fetch direct chat so it's immediately ready
      let chatData = null;
      try {
        const chatRes = await api.post(`/chat/direct/${user._id}`);
        chatData = chatRes.data;
      } catch (e) {
        // Non-fatal
      }

      toast.success(`${user.name} added to contacts`);
      fetchContacts();
      setDirectoryResults(prev => prev.map(u => u._id === user._id ? { ...u, isContact: true } : u));
      if (onContactAdded) {
        onContactAdded(user, chatData);
      }
    } catch {
      toast.error('Failed to add contact');
    }
  };

  const handleRemoveContact = async (userId, userName) => {
    try {
      await api.delete(`/users/contacts/${userId}`);
      toast.success(`${userName || 'Contact'} removed`);
      setContacts(prev => prev.filter(c => c._id !== userId));
    } catch {
      toast.error('Failed to remove contact');
    }
  };

  const filteredContacts = contacts.filter(c => {
    const q = searchQuery.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.role?.toLowerCase().includes(q) ||
      c.college?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-black h-full overflow-hidden font-sans">
      {/* Header */}
      <div className="h-auto sm:h-16 px-4 sm:px-6 py-3 sm:py-0 border-b border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between shrink-0 bg-white dark:bg-black gap-2">
        <div className="flex items-center gap-2">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-1.5 -ml-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Back to chats"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            </button>
          )}
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <FiUser className="text-slate-500" size={18} />
              <span>Contacts</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {contacts.length} saved {contacts.length === 1 ? 'contact' : 'contacts'} in your directory
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('contacts')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'contacts'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            My Contacts ({contacts.length})
          </button>
          <button
            onClick={() => setActiveTab('directory')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'directory'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FiUserPlus size={14} /> Add / Search Directory
          </button>
        </div>
      </div>

      {/* Main Search & Control Toolbar */}
      <div className="p-4 border-b border-gray-200 dark:border-slate-800 bg-slate-50/50 dark:bg-black/50">
        <div className="max-w-md relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === 'directory'
                ? "Search directory by name, email, role, or organization..."
                : "Filter contacts..."
            }
            className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500 dark:focus:border-sky-500"
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'contacts' ? (
          loading ? (
            <div className="text-center py-12 text-xs text-slate-400">Loading contacts...</div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-16 max-w-sm mx-auto">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <FiUser size={20} />
              </div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {searchQuery ? 'No matching contacts found' : 'No contacts saved yet'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                {searchQuery
                  ? `Try searching directory for "${searchQuery}"`
                  : 'Add people from your institution or directory to quickly start end-to-end encrypted direct chats.'}
              </p>
              <button
                onClick={() => setActiveTab('directory')}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                Find & Add People
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredContacts.map(contact => (
                <div
                  key={contact._id}
                  onClick={() => onStartChat(contact)}
                  className="bg-white dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700/60 rounded-xl p-4 hover:border-sky-500/80 dark:hover:border-sky-500/80 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm flex items-center justify-center shrink-0 overflow-hidden">
                      {contact.profilePic ? (
                        <img src={contact.profilePic} alt={contact.name} className="w-full h-full object-cover" />
                      ) : (
                        contact.name?.[0]?.toUpperCase() || 'U'
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                          {contact.name}
                        </h4>
                        {contact.publicKey && (
                          <FiShield size={11} className="text-emerald-500 shrink-0" title="E2EE Enabled" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {contact.role || 'Member'}
                      </p>
                      {contact.college && (
                        <p className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-1">
                          <FiBriefcase size={10} className="shrink-0" />
                          <span className="truncate">{contact.college}</span>
                        </p>
                      )}
                      {contact.email && (
                        <p className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                          <FiMail size={10} className="shrink-0" />
                          <span className="truncate">{contact.email}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700/50 flex items-center justify-between gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartChat(contact);
                      }}
                      className="flex-1 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-md text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <FiMessageSquare size={13} /> Message
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenProfile(contact);
                      }}
                      className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-md text-xs font-medium transition-colors cursor-pointer"
                    >
                      Details
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveContact(contact._id, contact.name);
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                      title="Remove contact"
                    >
                      <FiUserMinus size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Directory Search Tab */
          <div>
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Directory Search
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Search verified AICTE Samvaad registered users across institutions and departments.
              </p>
            </div>

            {directoryLoading ? (
              <div className="text-center py-12 text-xs text-slate-400">Searching user directory...</div>
            ) : searchQuery.trim() === '' ? (
              <div className="text-center py-12 text-xs text-slate-400">
                Type a name, email, or college in the search box above to find people.
              </div>
            ) : directoryResults.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-400">
                No users found matching "{searchQuery}"
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-slate-800 border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-800">
                {directoryResults.map(user => (
                  <div
                    key={user._id}
                    onClick={() => onStartChat(user)}
                    className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                        {user.profilePic ? (
                          <img src={user.profilePic} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          user.name?.[0]?.toUpperCase() || 'U'
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                          {user.name}
                          {user.publicKey && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                              <FiShield size={10} /> E2EE
                            </span>
                          )}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {user.role || 'Member'} • {user.college || user.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {user.isContact ? (
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 rounded-md border border-emerald-200 dark:border-emerald-800/40">
                          <FiCheck size={12} /> Contact
                        </span>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddContact(user);
                          }}
                          className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <FiUserPlus size={13} /> Add Contact
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onStartChat(user);
                        }}
                        className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold rounded-md transition-colors cursor-pointer"
                      >
                        Message
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactsView;
