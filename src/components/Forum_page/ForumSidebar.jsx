import React from 'react';
import {
    MessageSquare,
    Hash,
    TrendingUp,
    Star,
    HelpCircle,
    Code,
    Briefcase
} from 'lucide-react';

const ForumSidebar = () => {
    const categories = [
        { id: 'general', label: 'General Discussion', icon: MessageSquare, color: 'text-sky-500' },
        { id: 'tech', label: 'Tech & Programming', icon: Code, color: 'text-sky-500' },
        { id: 'projects', label: 'Project Showcase', icon: Star, color: 'text-yellow-500' },
        { id: 'career', label: 'Career Advice', icon: Briefcase, color: 'text-green-500' },
        { id: 'help', label: 'Help & Support', icon: HelpCircle, color: 'text-red-500' },
    ];

    const tags = [
        'react', 'nodejs', 'javascript', 'python', 'design', 'career', 'freelance'
    ];

    return (
        <div className="hidden lg:block w-72 flex-shrink-0 space-y-6">
            {/* Start Discussion Button (Mobile/Tablet usually have this in header, but good to have here too) */}

            {/* Categories */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider">Categories</h3>
                </div>
                <div className="p-2">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors text-left group"
                        >
                            <div className={`p-1.5 rounded-md bg-gray-50 group-hover:bg-white transition-colors ${cat.color}`}>
                                <cat.icon className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium">{cat.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Trending Tags */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider">Trending Tags</h3>
                </div>
                <div className="p-4">
                    <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                            <span
                                key={tag}
                                className="px-2.5 py-1 bg-gray-50 text-gray-600 border border-gray-100 rounded-md text-xs font-medium cursor-pointer hover:bg-gray-100 hover:border-gray-200 transition-colors"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForumSidebar;
