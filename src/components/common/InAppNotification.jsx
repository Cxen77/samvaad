import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

/**
 * Instagram-style in-app notification
 * Slides from the top edge of the viewport
 */
const InAppNotification = ({ notification, onDismiss }) => {
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Auto-dismiss after 4 seconds
        const timer = setTimeout(() => {
            handleDismiss();
        }, 4000);

        return () => clearTimeout(timer);
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        setTimeout(() => {
            onDismiss?.();
        }, 300); // Wait for exit animation
    };

    const handleClick = () => {
        handleDismiss();
        if (notification.chatId) {
            navigate(`/chat/${notification.chatId}`);
        }
    };

    const notificationContent = (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                        mass: 0.8
                    }}
                    className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none flex justify-center px-4 pt-3"
                >
                    <motion.div
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={0.2}
                        onDragEnd={(e, info) => {
                            if (info.offset.y < -50) {
                                handleDismiss();
                            }
                        }}
                        className="pointer-events-auto w-full max-w-md"
                    >
                        <div
                            onClick={handleClick}
                            className="bg-white/95 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-white/20 rounded-2xl p-3 cursor-pointer active:scale-[0.98] transition-transform"
                        >
                            <div className="flex items-center gap-3">
                                {/* Avatar */}
                                <div className="flex-shrink-0">
                                    <img
                                        src={notification.profilePic || "https://via.placeholder.com/48"}
                                        alt={notification.senderName}
                                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                                    />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-sm font-bold text-gray-900 truncate">
                                            {notification.senderName}
                                        </p>
                                        <span className="text-xs text-gray-400 flex-shrink-0">now</span>
                                    </div>
                                    <p className="text-sm text-gray-600 truncate mt-0.5">
                                        {notification.message}
                                    </p>
                                </div>

                                {/* App Icon/Badge (optional) */}
                                <div className="flex-shrink-0">
                                    <div className="w-2 h-2 bg-sky-500 rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return createPortal(notificationContent, document.body);
};

export default InAppNotification;
