import React from 'react';
import { useFollow } from '../../hooks/useFollow';
import { HiUserAdd, HiUserRemove } from "react-icons/hi";
import { Loader2, Check } from "lucide-react";
import { useAuth } from '../../context/AuthContext';

const FollowButton = ({ targetUser, variant = 'icon' }) => {
    const { currentUser } = useAuth();
    const { follow, isPending } = useFollow(targetUser?._id);

    if (!targetUser || !currentUser || targetUser._id === currentUser._id) return null;

    const isFollowing = targetUser.followers?.includes(currentUser._id);

    if (variant === 'icon') {
        return (
            <button 
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    follow();
                }}
                disabled={isPending}
                className={`p-2 rounded-full transition flex-shrink-0 ${
                    isFollowing 
                        ? 'text-sky-600 hover:bg-gray-100' 
                        : 'text-sky-600 hover:bg-sky-50'
                }`}
                title={isFollowing ? 'Unfollow' : 'Follow'}
            >
                {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : isFollowing ? (
                    <HiUserRemove size={16} />
                ) : (
                    <HiUserAdd size={16} />
                )}
            </button>
        );
    }

    return (
        <button
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                follow();
            }}
            disabled={isPending}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                isFollowing
                    ? "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                    : "bg-sky-600 text-white hover:bg-sky-700 shadow-sm"
            }`}
        >
            {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : isFollowing ? (
                <>
                    <Check className="w-4 h-4" />
                    <span>Following</span>
                </>
            ) : (
                <>
                    <HiUserAdd size={18} />
                    <span>Follow</span>
                </>
            )}
        </button>
    );
};

export default FollowButton;
