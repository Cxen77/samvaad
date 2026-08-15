import { useState, useEffect, useRef } from 'react';

export default function useStickySidebar(topOffset = 96, bottomPadding = 24) {
    const sidebarRef = useRef(null);
    const [top, setTop] = useState(topOffset);

    useEffect(() => {
        let lastScrollY = window.scrollY;
        let currentTop = topOffset;

        const handleScroll = () => {
            if (!sidebarRef.current) return;

            const scrollY = window.scrollY;
            const scrollDelta = scrollY - lastScrollY;
            lastScrollY = scrollY;

            const sidebarHeight = sidebarRef.current.offsetHeight;
            const windowHeight = window.innerHeight;

            // If sidebar is shorter than the viewport, just stick it to the top
            if (sidebarHeight <= windowHeight - topOffset) {
                setTop(topOffset);
                return;
            }

            // Calculate boundaries
            const minTop = windowHeight - sidebarHeight - bottomPadding;
            const maxTop = topOffset;

            // Adjust top position based on scroll direction
            currentTop -= scrollDelta;

            // Clamp between minTop and maxTop
            currentTop = Math.max(minTop, Math.min(maxTop, currentTop));
            setTop(currentTop);
        };

        // Initial check
        handleScroll();

        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleScroll);
        };
    }, [topOffset, bottomPadding]);

    return {
        sidebarRef,
        style: {
            position: 'sticky',
            top: `${top}px`,
        }
    };
}
