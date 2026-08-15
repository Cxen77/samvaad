import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { MessageSquare, Code, Star, Briefcase, HelpCircle } from 'lucide-react';
import ForumHeader from './ForumHeader';
import ForumThreadCard from './ForumThreadCard';
import api from '../../api/axios';
import Skeleton from '../common/Skeleton';

const ForumHome = () => {
    const { openCreateModal } = useOutletContext();
    const [threads, setThreads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('latest'); // latest, top, unanswered
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const categories = [
        { id: 'all', label: 'All', icon: MessageSquare, color: 'text-gray-500' },
        { id: 'general', label: 'General', icon: MessageSquare, color: 'text-sky-500' },
        { id: 'tech', label: 'Tech', icon: Code, color: 'text-sky-500' },
        { id: 'projects', label: 'Projects', icon: Star, color: 'text-yellow-500' },
        { id: 'career', label: 'Career', icon: Briefcase, color: 'text-green-500' },
        { id: 'help', label: 'Help', icon: HelpCircle, color: 'text-red-500' },
    ];

    useEffect(() => {
        fetchThreads();
    }, [filter, activeCategory]);

    const fetchThreads = async () => {
        setLoading(true);
        try {
            // Mocking endpoint for now if it doesn't exist, but standard practice:
            // Add category param if needed: ?sort=${filter}&category=${activeCategory}
            const { data } = await api.get(`/forums/posts?sort=${filter}`);
            setThreads(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to fetch threads", err);
            // Fallback for demo/development if backend not ready
            // setThreads([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredThreads = threads.filter(thread => {
        const matchesSearch = thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            thread.content.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === 'all' || thread.category === activeCategory; // Assuming thread has category field
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="space-y-6">
            <ForumHeader
                onCreateThread={openCreateModal}
                onSearch={setSearchQuery}
            />

            {/* Mobile Categories (Visible < lg) */}
            <div className="lg:hidden">
                <div className="flex overflow-x-auto no-scrollbar gap-3 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`flex flex-shrink-0 items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors whitespace-nowrap ${activeCategory === cat.id
                                ? 'bg-gray-900 border-gray-900 text-white'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <cat.icon className={`w-3.5 h-3.5 ${activeCategory === cat.id ? 'text-white' : cat.color}`} />
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-200 w-fit">
                {['latest', 'top', 'unanswered'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-1.5 rounded-md text-sm font-bold capitalize transition-all ${filter === f
                            ? 'bg-gray-900 text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Feed */}
            <div className="space-y-4">
                {loading ? (
                    // Skeleton Loading State
                    [1, 2, 3, 4].map((n) => (
                        <div key={n} className="bg-white p-6 rounded-xl border border-gray-100 flex gap-4">
                            <Skeleton variant="circular" className="h-10 w-10 shrink-0" />
                            <div className="flex-1 space-y-3">
                                <Skeleton variant="rectangular" className="h-4 w-1/3" />
                                <Skeleton variant="rectangular" className="h-6 w-3/4" />
                                <Skeleton variant="rectangular" className="h-16 w-full" />
                            </div>
                        </div>
                    ))
                ) : filteredThreads.length > 0 ? (
                    filteredThreads.map(thread => (
                        <ForumThreadCard key={thread._id} thread={thread} />
                    ))
                ) : (
                    // Empty State
                    <div className="text-center py-16 bg-white rounded-xl border border-gray-200 border-dashed">
                        <div className="text-gray-400 mb-3 text-4xl">💬</div>
                        <h3 className="text-lg font-bold text-gray-900">No discussions found</h3>
                        <p className="text-gray-500 max-w-sm mx-auto mb-6">
                            Be the first to start a conversation in this category!
                        </p>
                        <button
                            onClick={openCreateModal}
                            className="text-sky-600 font-bold hover:underline"
                        >
                            Start a Discussion
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ForumHome;
