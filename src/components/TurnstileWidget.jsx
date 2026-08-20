import React from 'react';
import Turnstile from 'react-turnstile';

const TurnstileWidget = ({ onVerify, onError }) => {
    // Use configured site key or Cloudflare's official testing site key (Always passes)
    const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';

    return (
        <div className="w-full my-2 flex justify-center">
            <Turnstile
                sitekey={siteKey}
                onVerify={onVerify}
                onError={onError}
                theme="light"
                size="flexible"
                style={{ width: '100%' }}
            />
        </div>
    );
};

export default TurnstileWidget;
