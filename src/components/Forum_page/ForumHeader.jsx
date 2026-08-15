import React from 'react';
import { Search, Plus } from 'lucide-react';

const ForumHeader = ({ onCreateThread, onSearch }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

                {/* Title & Subtitle */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Community Forum</h1>
                    <p className="text-sm text-gray-500">Discuss, share, and collaborate with your peers.</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                    {/* Search Bar */}
                    <div className="relative flex-1 md:flex-none">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search discussions..."
                            className="w-full md:w-64 pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                            onChange={(e) => onSearch && onSearch(e.target.value)}
                        />
                    </div>

                    {/* Create Button */}
                    <button
                        onClick={onCreateThread}
                        className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-sm transition-all shadow-md active:scale-95 whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">New Discussion</span>
                        <span className="sm:hidden">New</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ForumHeader;
