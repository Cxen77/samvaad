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
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 px-4 py-2 md:hidden z-50 flex justify-between items-center pb-safe">
            {navItems.map((item) => (
                <FeatureGate key={item.to} featureKey={item.featureKey} className="flex-1 max-w-[80px]">
                    <NavLink
                        to={item.to}
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center gap-1 p-1 transition-all w-full h-full ${isActive
                                ? "text-sky-600"
                                : "text-gray-400 active:scale-90"
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                {isActive ? <item.activeIcon className="w-6 h-6" /> : <item.icon className="w-6 h-6" />}
                                <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
                            </>
                        )}
                    </NavLink>
                </FeatureGate>
            ))}
        </div>
    );
};

export default BottomNav;
