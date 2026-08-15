import { useState, useRef, useEffect } from "react";
import { FaArrowLeft, FaTrash } from "react-icons/fa";
import { FiSearch, FiMoreHorizontal, FiVideo, FiPhone, FiLock, FiCheck } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import api from "../../../api/axios";
import toast from "react-hot-toast";

function ChatHeader({ chat, onBack }) {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!chat) return null;

    const handleDeleteChat = async () => {
        if (!window.confirm("Are you sure you want to delete this chat?")) return;
        try {
            await api.put('/chat/delete', { chatId: chat._id });
            toast.success("Chat deleted");
            navigate('/chat');
            window.location.reload();
        } catch (error) {
            toast.error("Failed to delete chat");
        }
    };

    const handleVoiceCall = () => {
        toast.success(`Starting voice call with ${chat.name}...`);
    };

    const handleVideoCall = () => {
        toast.success(`Starting video call with ${chat.name}...`);
    };

    const initials = chat.name ? chat.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'DY';

    return (
        <div className="h-16 px-6 flex items-center justify-between border-b border-gray-200 dark:border-slate-800/80 bg-white dark:bg-black text-gray-900 dark:text-white shrink-0 z-30">
            <div className="flex items-center gap-3">
                <button
                    onClick={onBack}
                    className="md:hidden p-2 -ml-2 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition"
                >
                    <FaArrowLeft />
                </button>

                <div className="relative flex items-center justify-center">
                    {chat.avatar && !chat.avatar.includes('placeholder') ? (
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
                    {/* Status Checkmark Badge */}
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full flex items-center justify-center shadow">
                        <FiCheck size={8} className="text-white" strokeWidth={3} />
                    </span>
                </div>

                <div>
                    <h3 className="font-bold text-sm text-gray-900 dark:text-slate-100 flex items-center gap-1.5">
                        {chat.isEncrypted && (
                            <FiLock size={13} className="text-emerald-500 shrink-0" title="End-to-End Encrypted" />
                        )}
                        {chat.name}
                    </h3>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                        <span>{chat.status || 'Active'}</span>
                        {chat.isEncrypted && (
                            <span className="text-emerald-500 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Encrypted
                            </span>
                        )}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-1 text-gray-500 dark:text-slate-400">
                <button 
                    onClick={handleVoiceCall}
                    className="p-2.5 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-sky-600 dark:hover:text-sky-400 rounded-full transition-colors"
                    title="Start Voice Call"
                >
                    <FiPhone size={18} />
                </button>
                <button 
                    onClick={handleVideoCall}
                    className="p-2.5 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-sky-600 dark:hover:text-sky-400 rounded-full transition-colors"
                    title="Start Video Call"
                >
                    <FiVideo size={18} />
                </button>
                <button 
                    className="p-2.5 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white rounded-full transition-colors"
                    title="Search Messages"
                >
                    <FiSearch size={18} />
                </button>

                <div ref={menuRef} className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className={`p-2.5 rounded-full transition-colors ${showMenu ? 'bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white' : 'hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'}`}
                        title="More Options"
                    >
                        <FiMoreHorizontal size={18} />
                    </button>

                    {showMenu && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-black rounded-xl shadow-2xl border border-gray-200 dark:border-slate-800 py-2 z-50 animate-fadeIn text-xs">
                            <button
                                onClick={handleDeleteChat}
                                className="w-full text-left px-4 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 transition-colors font-medium"
                            >
                                <FaTrash /> Delete Conversation
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ChatHeader;
