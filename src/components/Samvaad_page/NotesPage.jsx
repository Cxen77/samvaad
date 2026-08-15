import React, { useState } from 'react';
import { FiPlus, FiSearch, FiEdit3, FiTrash2, FiStar, FiClock, FiX, FiSave } from 'react-icons/fi';
import { useSamvaad } from '../../context/SamvaadContext';
import toast from 'react-hot-toast';

const NotesPage = () => {
  const { getNotes, createNote, updateNote, deleteNote, togglePinNote, getMeetings } = useSamvaad();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNote, setEditingNote] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', meetingId: '' });

  const notes = getNotes();
  const meetings = getMeetings();

  const filtered = searchQuery
    ? notes.filter(n => n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : notes;

  const pinned = filtered.filter(n => n.pinned);
  const unpinned = filtered.filter(n => !n.pinned);

  const handleCreate = () => {
    if (!form.title.trim()) { toast.error('Note title is required.'); return; }
    createNote(form);
    toast.success('Note created!');
    setForm({ title: '', content: '', meetingId: '' });
    setShowCreate(false);
  };

  const handleSaveEdit = () => {
    if (!editingNote) return;
    updateNote(editingNote.id, { title: editingNote.title, content: editingNote.content, meetingId: editingNote.meetingId });
    toast.success('Note saved!');
    setEditingNote(null);
  };

  const handleDelete = (id) => {
    if (confirm('Delete this note?')) {
      deleteNote(id);
      toast.success('Note deleted');
      if (editingNote?.id === id) setEditingNote(null);
    }
  };

  return (
    <div className="flex h-full bg-white">
      {/* Notes List */}
      <div className="w-80 border-r border-gray-200 flex flex-col shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-slate-800">My Notes</h1>
            <button onClick={() => { setShowCreate(true); setEditingNote(null); }} className="p-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-colors">
              <FiPlus size={16} />
            </button>
          </div>
          <div className="relative">
            <FiSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/40"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="flex-1 overflow-y-auto">
          {pinned.length > 0 && (
            <div className="px-4 pt-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">📌 Pinned</p>
              {pinned.map(n => <NoteItem key={n.id} note={n} selected={editingNote?.id === n.id} onClick={() => { setEditingNote({ ...n }); setShowCreate(false); }} onPin={() => togglePinNote(n.id)} onDelete={() => handleDelete(n.id)} />)}
            </div>
          )}
          <div className="px-4 pt-3 pb-4">
            {pinned.length > 0 && unpinned.length > 0 && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">All Notes</p>}
            {unpinned.map(n => <NoteItem key={n.id} note={n} selected={editingNote?.id === n.id} onClick={() => { setEditingNote({ ...n }); setShowCreate(false); }} onPin={() => togglePinNote(n.id)} onDelete={() => handleDelete(n.id)} />)}
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <FiEdit3 size={32} className="text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400">{searchQuery ? 'No notes match your search.' : 'No notes yet.'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Editor / Create Panel */}
      <div className="flex-1 p-6 overflow-y-auto">
        {showCreate ? (
          <div className="max-w-2xl mx-auto space-y-5">
            <h2 className="text-xl font-bold text-slate-800">Create New Note</h2>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Title</label>
              <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Note title..." className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/40 bg-gray-50" autoFocus />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Content</label>
              <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} rows={8} placeholder="Write your notes..." className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/40 bg-gray-50 resize-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Associate with Meeting (optional)</label>
              <select value={form.meetingId} onChange={e => setForm(p => ({ ...p, meetingId: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/40 bg-gray-50">
                <option value="">None</option>
                {meetings.map(m => <option key={m.id} value={m.id}>{m.title} ({m.date})</option>)}
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-slate-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleCreate} className="px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-semibold"><FiSave size={14} className="inline mr-1" />Save Note</button>
            </div>
          </div>
        ) : editingNote ? (
          <div className="max-w-2xl mx-auto space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Edit Note</h2>
              <p className="text-xs text-slate-400"><FiClock size={10} className="inline mr-1" />Last edited: {new Date(editingNote.updatedAt).toLocaleString()}</p>
            </div>
            <input type="text" value={editingNote.title} onChange={e => setEditingNote(p => ({ ...p, title: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/40 bg-gray-50 font-semibold" />
            <textarea value={editingNote.content} onChange={e => setEditingNote(p => ({ ...p, content: e.target.value }))} rows={12} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/40 bg-gray-50 resize-none" />
            <select value={editingNote.meetingId || ''} onChange={e => setEditingNote(p => ({ ...p, meetingId: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50">
              <option value="">No associated meeting</option>
              {meetings.map(m => <option key={m.id} value={m.id}>{m.title} ({m.date})</option>)}
            </select>
            <button onClick={handleSaveEdit} className="px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-semibold"><FiSave size={14} className="inline mr-1" />Save Changes</button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <FiEdit3 size={48} className="text-gray-200 mb-4" />
            <p className="text-slate-400 text-sm">Select a note or create a new one</p>
          </div>
        )}
      </div>
    </div>
  );
};

const NoteItem = ({ note, selected, onClick, onPin, onDelete }) => (
  <div onClick={onClick} className={`p-3 rounded-xl mb-2 cursor-pointer transition-colors group ${selected ? 'bg-sky-50 border border-sky-200' : 'bg-gray-50 hover:bg-gray-100 border border-transparent'}`}>
    <div className="flex items-start justify-between">
      <p className="text-sm font-semibold text-slate-800 truncate flex-1">{note.title}</p>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button onClick={e => { e.stopPropagation(); onPin(); }} className={`p-1 rounded ${note.pinned ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500'}`}><FiStar size={12} /></button>
        <button onClick={e => { e.stopPropagation(); onDelete(); }} className="p-1 text-slate-400 hover:text-red-500 rounded"><FiTrash2 size={12} /></button>
      </div>
    </div>
    <p className="text-xs text-slate-400 truncate mt-0.5">{note.content || 'No content'}</p>
    <p className="text-[10px] text-slate-300 mt-1">{new Date(note.updatedAt).toLocaleDateString()}</p>
  </div>
);

export default NotesPage;
