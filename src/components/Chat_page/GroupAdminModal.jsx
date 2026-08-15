import React, { useState, useEffect } from 'react';
import { FiX, FiUsers, FiPlus, FiTrash2, FiSearch, FiEdit2, FiCheck } from 'react-icons/fi';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const GroupAdminModal = ({ isOpen, onClose, activeGroup, onGroupCreated, onGroupUpdated }) => {
  const isEditing = !!activeGroup;

  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeGroup) {
      setGroupName(activeGroup.name || activeGroup.chatName || '');
      setDescription(activeGroup.description || '');
      setSelectedUsers(activeGroup.participants || []);
    } else {
      setGroupName('');
      setDescription('');
      setSelectedUsers([]);
    }
  }, [activeGroup, isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/users/directory?q=${encodeURIComponent(query.trim())}`);
        setSearchResults(res.data || []);
      } catch (err) {
        console.error('Directory search error:', err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const toggleSelectUser = (user) => {
    if (selectedUsers.some(u => (u._id || u) === (user._id || user))) {
      setSelectedUsers(prev => prev.filter(u => (u._id || u) !== (user._id || user)));
    } else {
      setSelectedUsers(prev => [...prev, user]);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error('Group name is required');
      return;
    }
    if (selectedUsers.length < 1) {
      toast.error('Please select at least 1 other member');
      return;
    }

    setLoading(true);
    try {
      const userIds = selectedUsers.map(u => u._id || u);
      const res = await api.post('/chat/group', {
        name: groupName.trim(),
        description: description.trim(),
        users: JSON.stringify(userIds)
      });
      toast.success(`Group "${groupName}" created!`);
      onGroupCreated?.(res.data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create group chat');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGroup = async () => {
    if (!groupName.trim()) return;
    setLoading(true);
    try {
      const res = await api.put('/chat/rename', {
        chatId: activeGroup._id || activeGroup.id,
        chatName: groupName.trim(),
        description: description.trim()
      });
      toast.success('Group settings updated');
      onGroupUpdated?.(res.data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update group');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMemberToGroup = async (user) => {
    try {
      const res = await api.put('/chat/groupadd', {
        chatId: activeGroup._id || activeGroup.id,
        userId: user._id
      });
      toast.success(`${user.name} added to group`);
      setSelectedUsers(res.data.participants || []);
      onGroupUpdated?.(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    }
  };

  const handleRemoveMemberFromGroup = async (userId, userName) => {
    try {
      const res = await api.put('/chat/groupremove', {
        chatId: activeGroup._id || activeGroup.id,
        userId
      });
      toast.success(`${userName || 'Member'} removed from group`);
      setSelectedUsers(res.data.participants || []);
      onGroupUpdated?.(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2 text-white font-bold">
            <FiUsers className="text-sky-400" />
            <span>{isEditing ? 'Group Chat Settings' : 'Create New Group Chat'}</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <FiX size={18} />
          </button>
        </div>

        {/* Body Form */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Group Name</label>
            <input
              type="text"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              placeholder="e.g., AI & DS Review Committee"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description (Optional)</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g., AICTE accreditation committee discussion group"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Member Search */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Search & Add Members</label>
            <div className="relative mb-2">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search registered users by name, role, or college..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Search Dropdown Results */}
            {query.trim() !== '' && (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-2 max-h-40 overflow-y-auto mb-3 space-y-1">
                {searchResults.map(user => {
                  const isSelected = selectedUsers.some(u => (u._id || u) === user._id);
                  return (
                    <div
                      key={user._id}
                      onClick={() => {
                        if (isEditing) {
                          handleAddMemberToGroup(user);
                        } else {
                          toggleSelectUser(user);
                        }
                      }}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-700 cursor-pointer text-xs"
                    >
                      <div>
                        <span className="font-semibold text-white">{user.name}</span>
                        <span className="text-[10px] text-slate-400 block">{user.role || 'Member'} • {user.college || user.email}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isSelected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-sky-500 text-white'}`}>
                        {isSelected ? 'Selected' : '+ Add'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Members List */}
          <div>
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Selected Members ({selectedUsers.length})
            </h4>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {selectedUsers.map(u => {
                const uId = u._id || u;
                const uName = u.name || 'Member';
                return (
                  <div key={uId} className="flex items-center justify-between p-2 bg-slate-800/60 rounded-xl border border-slate-700/60 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center font-bold text-[10px] text-sky-400">
                        {uName[0]?.toUpperCase()}
                      </div>
                      <span className="font-semibold text-slate-200">{uName}</span>
                    </div>
                    {isEditing ? (
                      <button
                        onClick={() => handleRemoveMemberFromGroup(uId, uName)}
                        className="text-red-400 hover:text-red-300 p-1"
                        title="Remove member"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    ) : (
                      <button
                        onClick={() => toggleSelectUser(u)}
                        className="text-slate-400 hover:text-red-400 p-1"
                      >
                        <FiX size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold">
            Cancel
          </button>
          <button
            onClick={isEditing ? handleUpdateGroup : handleCreateGroup}
            disabled={loading || !groupName.trim()}
            className="px-5 py-2 bg-sky-500 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-lg disabled:opacity-50"
          >
            {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Group Chat'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupAdminModal;
