import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    HiHome, HiOutlineHome,
    HiUserGroup, HiOutlineUserGroup,
    HiCalendar, HiOutlineCalendar,
    HiChatAlt2, HiOutlineChatAlt2,
    HiCog, HiOutlineCog
} from 'react-icons/hi';

import FeatureGate from '../common/FeatureGate';

const BottomNav = () => {
    const navItems = [
        { to: "/", icon: HiOutlineHome, activeIcon: HiHome, label: "Home" },
        { to: "/teams", icon: HiOutlineUserGroup, activeIcon: HiUserGroup, label: "Teams" },
        { to: "/forums", icon: HiOutlineChatAlt2, activeIcon: HiChatAlt2, label: "Forums", featureKey: "forum" },
        { to: "/events", icon: HiOutlineCalendar, activeIcon: HiCalendar, label: "Events", featureKey: "events" },
        { to: "/chat", icon: HiOutlineChatAlt2, activeIcon: HiChatAlt2, label: "Chat", featureKey: "chat" },
        { to: "/settings", icon: HiOutlineCog, activeIcon: HiCog, label: "Settings" },
    ];

    return (
        <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 py-2.5 md:hidden z-50 flex justify-between items-center pb-safe">
            {navItems.map((item) => (
                <FeatureGate key={item.to} featureKey={item.featureKey} className="flex-1 max-w-[80px]">
                    <NavLink
                        to={item.to}
                        title={item.label}
                        className={({ isActive }) =>
                            `flex items-center justify-center p-2 rounded-xl transition-all w-full h-full ${isActive
                                ? "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40"
                                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 active:scale-90"
                            }`
                        }
                    >
                        {({ isActive }) => (
                            isActive ? <item.activeIcon className="w-6 h-6" /> : <item.icon className="w-6 h-6" />
                        )}
                    </NavLink>
                </FeatureGate>
            ))}
        </div>
    );
};

export default BottomNav;
