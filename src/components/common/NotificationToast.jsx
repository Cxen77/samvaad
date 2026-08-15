import React from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const NotificationToast = ({ t, senderName, message, profilePic, chatId }) => {
    return (
        <AnimatePresence>
            {t.visible && (
                <motion.div
                    initial={{ opacity: 0, y: -50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="max-w-[360px] w-full bg-white/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 rounded-full pointer-events-auto flex items-center p-2 pr-4 cursor-pointer z-[99999]"
                    onClick={() => {
                        toast.dismiss(t.id);
                        window.location.href = `/chat/${chatId}`;
                    }}
                    drag="y"
                    dragConstraints={{ top: 0, bottom: 0 }}
                    onDragEnd={(event, info) => {
                        if (info.offset.y < -30) {
                            toast.dismiss(t.id);
                        }
                    }}
                >
                    {/* Avatar */}
                    <div className="flex-shrink-0 relative">
                        <img
                            className="h-10 w-10 rounded-full object-cover border-[2px] border-white shadow-sm"
                            src={profilePic || "https://via.placeholder.com/40"}
                            alt={senderName}
                        />
                    </div>

                    {/* Content */}
                    <div className="ml-3 flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-gray-900 leading-tight truncate">
                            {senderName}
                        </p>
                        <p className="text-[13px] text-gray-600 truncate leading-snug">
                            {message}
                        </p>
                    </div>

                    {/* Time or Indicator (Optional, opting for clean look) */}
                    {/* <div className="ml-2 text-[10px] text-gray-400">Now</div> */}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default NotificationToast;
