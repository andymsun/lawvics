'use client';

import { useEffect } from 'react';
import { useSettingsStore, ThemeColor } from '@/lib/store';

// Color definitions (HSL/Hex compatible CSS variables)
const THEMES: Record<ThemeColor, Record<string, string>> = {
    blue: {
        '--primary': '#3b82f6', // blue-500
        '--ring': '#3b82f6',
    },
    violet: {
        '--primary': '#7c3aed', // violet-600
        '--ring': '#7c3aed',
    },
    green: {
        '--primary': '#10b981', // emerald-500
        '--ring': '#10b981',
    },
    rose: {
        '--primary': '#f43f5e', // rose-500
        '--ring': '#f43f5e',
    },
    orange: {
        '--primary': '#f97316', // orange-500
        '--ring': '#f97316',
    }
};

const DARK_THEMES: Record<ThemeColor, Record<string, string>> = {
    blue: {
        '--primary': '#3b82f6', // blue-500
        '--ring': '#3b82f6',
    },
    violet: {
        '--primary': '#8b5cf6', // violet-500
        '--ring': '#8b5cf6',
    },
    green: {
        '--primary': '#34d399', // emerald-400
        '--ring': '#34d399',
    },
    rose: {
        '--primary': '#fb7185', // rose-400
        '--ring': '#fb7185',
    },
    orange: {
        '--primary': '#fb923c', // orange-400
        '--ring': '#fb923c',
    }
};

export default function ThemeManager() {
    const themeColor = useSettingsStore((state) => state.themeColor);

    useEffect(() => {
        const root = document.documentElement;

        // Helper to apply vars
        const applyTheme = (vars: Record<string, string>) => {
            Object.entries(vars).forEach(([key, value]) => {
                root.style.setProperty(key, value);
            });
        };

        const updateTheme = () => {
            const isDark = root.classList.contains('dark');
            const colors = isDark ? DARK_THEMES[themeColor] : THEMES[themeColor];
            applyTheme(colors || THEMES.blue);
        };

        // Apply immediately
        updateTheme();

        // Watch for dark mode changes
        const observer = new MutationObserver(updateTheme);
        observer.observe(root, { attributes: true, attributeFilter: ['class'] });

        return () => observer.disconnect();
    }, [themeColor]);

    return null;
}
