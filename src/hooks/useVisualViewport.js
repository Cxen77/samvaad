import { useState, useEffect } from 'react';

function useVisualViewport() {
    const [viewport, setViewport] = useState({
        height: typeof window !== 'undefined' ? window.visualViewport?.height || window.innerHeight : 0,
        offset: 0,
        offsetTop: 0
    });

    useEffect(() => {
        if (typeof window === 'undefined' || !window.visualViewport) return;

        const handleResize = () => {
            // Use rAF to throttle updates and ensure we catch frames during animation
            requestAnimationFrame(() => {
                if (!window.visualViewport) return;
                setViewport({
                    height: window.visualViewport.height,
                    offset: window.innerHeight - window.visualViewport.height,
                    offsetTop: window.visualViewport.offsetTop
                });
            });
        };

        window.visualViewport.addEventListener('resize', handleResize);
        window.visualViewport.addEventListener('scroll', handleResize); // Sometimes scroll affects it

        // Initial set
        handleResize();

        return () => {
            window.visualViewport.removeEventListener('resize', handleResize);
            window.visualViewport.removeEventListener('scroll', handleResize);
        };
    }, []);

    return viewport;
}

export default useVisualViewport;
