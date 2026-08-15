import React from 'react';

const Skeleton = ({ className, variant = "text", ...props }) => {
    const baseClasses = "animate-pulse bg-gray-200 rounded";

    const variants = {
        text: "h-4 w-full",
        circular: "rounded-full",
        rectangular: "h-full w-full",
        avatar: "h-10 w-10 rounded-full",
        card: "h-64 w-full rounded-xl"
    };

    return (
        <div
            className={`${baseClasses} ${variants[variant] || ""} ${className}`}
            {...props}
        />
    );
};

export default Skeleton;
