import React, { useState } from 'react';
import Turnstile from 'react-turnstile';

const TurnstileWidget = ({ onVerify, onError }) => {
    // Fallback to Cloudflare's official testing site key (Always passes) if not specified
    const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || "1x00000000000000000000AA";
    const [hasError, setHasError] = useState(false);

    const handleTurnstileError = (errorCode) => {
        console.warn(`[Turnstile] Captcha error ${errorCode} (Domain unauthorized on localhost).`);
        setHasError(true);
        if (onError) onError(errorCode);
        // Auto-provide token in dev mode so login/signup flow is not blocked
        if (import.meta.env.DEV) {
            onVerify("dev_bypass_token");
        }
    };

    return (
        <div className="w-full my-2">
            <Turnstile
                sitekey={siteKey}
                onVerify={onVerify}
                onError={handleTurnstileError}
                theme="light"
                size="flexible"
                style={{ width: '100%' }}
            />
            {hasError && import.meta.env.DEV && (
                <p className="text-xs text-amber-600 mt-1">
                    ⚠️ Turnstile Sitekey not authorized for localhost. (Auto-bypassed for development).
                </p>
            )}
        </div>
    );
};

export default TurnstileWidget;
