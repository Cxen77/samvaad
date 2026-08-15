import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import ForumSidebar from './ForumSidebar';
import CreateForumModal from './CreateForumModal'; // We'll build this next

const ForumLayout = () => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const handleCreateThread = () => {
        setIsCreateModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Left Sidebar (Desktop) */}
                    <ForumSidebar />

                    {/* Main Content Area */}
                    <div className="flex-1 min-w-0">
                        {/* We pass the create handler down via context or props to Outlet if needed, 
                            but for now, the Home page might have its own header, or we can hoist it here.
                            Actually, ForumHeader is likely usually part of the feed page, 
                            but let's see. If we put ForumHeader here, it stays on detail pages too.
                            Let's keep the layout simple: Sidebar + Outlet. 
                            The specific pages will render their headers.
                        */}
                        <Outlet context={{ openCreateModal: handleCreateThread }} />
                    </div>
                </div>
            </div>

            {/* Global Create Thread Modal */}
            {isCreateModalOpen && (
                <CreateForumModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                />
            )}
        </div>
    );
};

export default ForumLayout;
