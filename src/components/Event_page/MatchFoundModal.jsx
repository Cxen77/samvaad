import React from 'react';
import { FaUsers, FaComments, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const MatchFoundModal = ({ isOpen, onClose, matchData }) => {
    const navigate = useNavigate();

    if (!isOpen || !matchData) return null;

    const handleGoToChat = () => {
        navigate(`/chat/${matchData.chatId}`);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in zoom-in-95 duration-300">
                {/* Confetti / Decorative Background */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-sky-600 to-sky-600 overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/confetti-doodles.png')]"></div>
                    <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/20 rounded-full blur-xl"></div>
                    <div className="absolute top-4 left-4 w-16 h-16 bg-white/20 rounded-full blur-lg"></div>
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition z-10 backdrop-blur-md"
                >
                    <FaTimes size={14} />
                </button>

                {/* Content */}
                <div className="pt-20 px-8 pb-8 text-center relative z-0">
                    <div className="w-20 h-20 bg-white rounded-full mx-auto shadow-xl flex items-center justify-center mb-4 ring-8 ring-sky-50 relative">
                        <span className="text-4xl">🎉</span>
                        <div className="absolute -bottom-1 -right-1 bg-sky-600 text-white rounded-full p-2 border-4 border-white">
                            <FaUsers size={14} />
                        </div>
                    </div>

                    <h2 className="text-2xl font-extrabold text-gray-900 mb-2">It's a Match!</h2>
                    <p className="text-gray-500 text-sm mb-6 max-w-[260px] mx-auto leading-relaxed">
                        We found a great team for you. Get ready to build something amazing!
                    </p>

                    <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-5 mb-8 text-left border border-gray-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-sky-50 rounded-full -mr-8 -mt-8 opacity-50 group-hover:scale-150 transition-transform duration-500"></div>

                        <div className="flex items-center justify-between mb-3 relative z-10 transition-colors">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-pulse"></span>
                                Team Found
                            </span>
                            <span className="bg-sky-100 text-sky-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-sky-200">
                                {matchData.project || "Hackathon"}
                            </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 truncate mb-1 relative z-10">{matchData.name || "New Squad"}</h3>
                        <p className="text-sm text-gray-500 flex items-center gap-2 relative z-10">
                            <FaUsers className="text-sky-400" />
                            <span className="font-medium text-gray-700">{matchData.members || 2} Members</span>
                            <span className="text-gray-300">•</span>
                            <span>Ready to chat</span>
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3.5 px-4 rounded-xl font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition"
                        >
                            Later
                        </button>
                        <button
                            onClick={handleGoToChat}
                            className="flex-[2] py-3.5 px-4 rounded-xl font-bold text-white bg-sky-600 hover:bg-sky-700 transition shadow-lg shadow-sky-200 flex items-center justify-center gap-2 active:scale-95 transform duration-150"
                        >
                            <FaComments size={18} />
                            Open Chat
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MatchFoundModal;
