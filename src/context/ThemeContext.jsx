import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const ThemeContext = createContext(null);

const STORAGE_KEY = 'fuseon-theme';

function resolveTheme(stored) {
    if (stored === 'light') return 'light';
    if (stored === 'dark') return 'dark';
    // 'system' or null → defer to OS
    return 'system';
}

function getSystemDark() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyClass(isDark) {
    if (isDark) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

export function ThemeProvider({ children }) {
    const [theme, setThemeState] = useState(() => resolveTheme(localStorage.getItem(STORAGE_KEY)));

    // Apply the correct dark/light class whenever theme changes
    const applyTheme = useCallback((t) => {
        if (t === 'dark') {
            applyClass(true);
        } else if (t === 'light') {
            applyClass(false);
        } else {
            // system
            applyClass(getSystemDark());
        }
    }, []);

    // On mount — apply immediately, then listen for OS changes
    useEffect(() => {
        applyTheme(theme);

        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const handleOsChange = () => {
            if (theme === 'system') {
                applyClass(mq.matches);
            }
        };

        mq.addEventListener('change', handleOsChange);
        return () => mq.removeEventListener('change', handleOsChange);
    }, [theme, applyTheme]);

    const setTheme = useCallback((t) => {
        localStorage.setItem(STORAGE_KEY, t);
        setThemeState(t);
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
    return ctx;
}
