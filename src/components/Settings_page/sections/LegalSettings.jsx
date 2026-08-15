import React, { useState } from 'react';
import { FileText, ChevronRight, ArrowLeft, Clock } from 'lucide-react';
import api from '../../../api/axios';

const LegalSettings = () => {
    const [view, setView] = useState('list'); // 'list' | 'privacy' | 'terms'
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchContent = async (type) => {
        setLoading(true);
        setView(type);
        try {
            const { data } = await api.get(`/legal/${type}`);
            setContent(data);
        } catch (error) {
            console.error(`Error loading ${type}:`, error);
        } finally {
            setLoading(false);
        }
    };

    const legalItems = [
        { id: 'privacy', label: 'Privacy Policy', icon: FileText },
        { id: 'terms', label: 'Terms of Service', icon: FileText },
    ];

    if (view !== 'list') {
        return (
            <div className="space-y-8 animate-fadeIn">
                {/* Header with Back Button */}
                <div className="flex items-center justify-between pb-6 border-b border-gray-100">
                    <button 
                        onClick={() => { setView('list'); setContent(null); }}
                        className="flex items-center gap-2 text-gray-500 hover:text-sky-600 transition-colors group"
                    >
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="font-semibold text-sm">Back to Legal</span>
                    </button>
                    {content && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <Clock size={12} />
                            <span>Last updated: {content.lastUpdated}</span>
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-600"></div>
                        <p className="text-gray-400 text-sm animate-pulse">Loading {view === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}...</p>
                    </div>
                ) : content ? (
                    <div className="max-w-3xl mx-auto space-y-10">
                        <header>
                            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
                                {content.title}
                            </h1>
                            <p className="text-gray-500">
                                Please read these carefully to understand our {view === 'privacy' ? 'privacy practices' : 'terms of service'}.
                            </p>
                        </header>

                        <div className="space-y-12 pb-12">
                            {content.sections.map((section, index) => (
                                <section key={index} className="space-y-4">
                                    <h2 className="text-xl font-bold text-gray-900 border-l-4 border-sky-500 pl-4">
                                        {section.title}
                                    </h2>
                                    <div className="text-gray-600 leading-relaxed pl-5">
                                        {section.content}
                                    </div>
                                </section>
                            ))}
                        </div>
                        
                        <footer className="pt-10 border-t border-dotted border-gray-200 text-center">
                            <p className="text-sm text-gray-400 mb-2 font-medium">© {new Date().getFullYear()} Fuseon. All rights reserved.</p>
                            <p className="text-xs text-gray-400">support@fuseon.app</p>
                        </footer>
                    </div>
                ) : (
                    <div className="text-center py-10">
                        <p className="text-red-500 font-medium">Failed to load content. Please try again.</p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="divide-y divide-gray-50">
                    {legalItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => fetchContent(item.id)}
                            className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-all group text-left"
                        >
                            <div className="flex items-center gap-5">
                                <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 group-hover:scale-110 group-hover:bg-sky-100 transition-all duration-300">
                                    <item.icon size={24} />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 text-lg leading-tight mb-0.5">{item.label}</p>
                                    <p className="text-sm text-gray-500">View the {item.label.toLowerCase()} for Fuseon</p>
                                </div>
                            </div>
                            <ChevronRight className="text-gray-300 group-hover:text-sky-500 transition-colors" size={24} />
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center">
                <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
                    We're committed to your privacy and security. These documents explain how we handle your data and the rules for using our platform.
                </p>
            </div>
        </div>
    );
};

export default LegalSettings;
