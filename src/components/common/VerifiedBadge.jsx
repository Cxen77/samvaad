import React from 'react';

/**
 * VerifiedBadge — Verified Student indicator.
 * Renders when `verified === true` (legacy boolean) OR `verified === 'true'` (new String enum).
 * "pending", "rejected", "false", null, undefined → renders nothing.
 */
const VerifiedBadge = ({ verified, className = "" }) => {
    if (verified !== true && verified !== 'true') return null;

    return (
        <span
            title="Verified"
            aria-label="Verified"
            className={`inline-flex flex-shrink-0 items-center justify-center relative translate-y-[0.05em] md:translate-y-[0.125em] ${className}`}
            style={{
                width: '0.62em',
                height: '0.62em',
                minWidth: '0.62em'
            }}
        >
            <svg
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full text-sky-500"
            >
                <path
                    d="M19.998 3.094 14.638 0l-2.972 5.15H5.432v6.354L0 14.64 3.094 20 0 25.359l5.432 3.137v5.905h5.975L14.638 40l5.36-3.094L25.358 40l3.232-5.6h6.162v-6.01L40 25.359 36.905 20 40 14.641l-5.248-3.03v-6.46h-6.419L25.358 0l-5.36 3.094Z"
                    fill="currentColor"
                />
                <path
                    d="M27.413 14.319l2.254 2.287-11.43 11.5-6.835-6.93 2.244-2.258 4.587 4.581 9.18-9.18Z"
                    fill="white"
                />
            </svg>
        </span>
    );
};

export default VerifiedBadge;
