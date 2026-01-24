'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import { useSurveyHistoryStore, useNotificationStore } from '@/lib/store';
import {
    Settings,
    Sun,
    Moon,
    Monitor,
    Check,
    X,
    Trash2,
    Zap,
    Search,
    User,
    AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// ============================================================
// Premium Toggle Component (reused pattern from SettingsModal)
// ============================================================

interface PremiumToggleProps {
    id: string;
    label: string;
    description?: string;
    checked: boolean;
    onChange: () => void;
    disabled?: boolean;
}

function PremiumToggle({
    id,
    label,
    description,
    checked,
    onChange,
    disabled = false,
}: PremiumToggleProps) {
    return (
        <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-1">
                <label htmlFor={id} className="text-sm font-medium text-foreground cursor-pointer">
                    {label}
                </label>
                {description && (
                    <p className="text-xs text-muted-foreground">{description}</p>
                )}
            </div>
            <button
                id={id}
                role="switch"
                aria-checked={checked}
                onClick={onChange}
                disabled={disabled}
                className={cn(
                    'relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background',
                    checked ? 'bg-primary' : 'bg-muted',
                    disabled && 'opacity-50 cursor-not-allowed'
                )}
            >
                <motion.div
                    className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm"
                    animate={{ x: checked ? 20 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
            </button>
        </div>
    );
}

// ============================================================
// Slider Component
// ============================================================

interface SliderProps {
    id: string;
    label: string;
    description?: string;
    value: number;
    onChange: (value: number) => void;
    min: number;
    max: number;
    step?: number;
}

function Slider({ id, label, description, value, onChange, min, max, step = 1 }: SliderProps) {
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <label htmlFor={id} className="text-sm font-medium text-foreground">
                        {label}
                    </label>
                    {description && (
                        <p className="text-xs text-muted-foreground">{description}</p>
                    )}
                </div>
                <span className="text-sm font-semibold text-primary">{value}</span>
            </div>
            <input
                id={id}
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
                <span>{min}</span>
                <span>{max}</span>
            </div>
        </div>
    );
}

// ============================================================
// Theme Selector Component
// ============================================================

function ThemeSelector() {
    const { theme, setTheme } = useTheme();

    const themes = [
        { id: 'light', label: 'Light', icon: Sun },
        { id: 'dark', label: 'Dark', icon: Moon },
        { id: 'system', label: 'System', icon: Monitor },
    ];

    return (
        <div className="space-y-3">
            <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Theme</label>
                <p className="text-xs text-muted-foreground">
                    Choose your preferred color scheme.
                </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
                {themes.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        className={cn(
                            'flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all',
                            theme === t.id
                                ? 'border-primary bg-primary/10'
                                : 'border-border hover:border-muted-foreground bg-card'
                        )}
                    >
                        <t.icon className={cn(
                            'w-5 h-5',
                            theme === t.id ? 'text-primary' : 'text-muted-foreground'
                        )} />
                        <span className={cn(
                            'text-xs font-medium',
                            theme === t.id ? 'text-primary' : 'text-muted-foreground'
                        )}>
                            {t.label}
                        </span>
                        {theme === t.id && (
                            <Check className="w-4 h-4 text-primary" />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}

// ============================================================
// Main Settings Page
// ============================================================

export default function SettingsPage() {
    const { resolvedTheme, setTheme } = useTheme();
    const clearSurveys = useSurveyHistoryStore((state) => {
        // Create a custom clear function
        return () => {
            useSurveyHistoryStore.setState({ surveys: [], activeSurveyId: null });
        };
    });
    const clearNotifications = useNotificationStore((state) => state.clearNotifications);

    // Local settings state (would typically persist to localStorage or backend)
    const [settings, setSettings] = useState({
        autoVerify: true,
        parallelChunkSize: 5,
    });
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    const toggleTheme = () => {
        setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    };

    const handleClearHistory = () => {
        clearSurveys();
        clearNotifications();
        setShowClearConfirm(false);
    };

    return (
        <div className="h-screen w-full flex flex-col bg-background text-foreground font-sans overflow-hidden">
            {/* Top Bar */}
            <header className="flex-shrink-0 border-b border-border bg-card/80 backdrop-blur-sm z-30">
                <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="flex items-center gap-2">
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-700 to-slate-500 dark:from-slate-200 dark:to-slate-400">
                                Lawvics
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full font-medium">
                                v1.0
                            </span>
                        </Link>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                            title={resolvedTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        >
                            {resolvedTheme === 'dark' ? (
                                <Sun className="w-5 h-5 text-yellow-400" />
                            ) : (
                                <Moon className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                            )}
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Layout */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar */}
                <DashboardSidebar activeTab="settings" />

                {/* Main Content */}
                <main className="flex-1 overflow-auto p-6">
                    <div className="max-w-2xl">
                        {/* Header */}
                        <div className="mb-8">
                            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Configure your research preferences and account settings.
                            </p>
                        </div>

                        {/* Settings Sections */}
                        <div className="space-y-8">
                            {/* General Section */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-primary/10">
                                        <Settings className="w-4 h-4 text-primary" />
                                    </div>
                                    <h2 className="text-lg font-semibold text-foreground">General</h2>
                                </div>
                                <div className="bg-card border border-border rounded-xl p-6 space-y-6">
                                    <ThemeSelector />
                                </div>
                            </section>

                            {/* Search Section */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-primary/10">
                                        <Search className="w-4 h-4 text-primary" />
                                    </div>
                                    <h2 className="text-lg font-semibold text-foreground">Search</h2>
                                </div>
                                <div className="bg-card border border-border rounded-xl p-6 space-y-6">
                                    <PremiumToggle
                                        id="auto-verify"
                                        label="Auto-Verify Citations"
                                        description="Automatically run Shepardizing checks on all returned statutes to detect outdated or repealed laws."
                                        checked={settings.autoVerify}
                                        onChange={() => setSettings((s) => ({ ...s, autoVerify: !s.autoVerify }))}
                                    />
                                    <div className="h-px bg-border" />
                                    <Slider
                                        id="parallel-chunk"
                                        label="Parallel Chunk Size"
                                        description="Number of states to query simultaneously. Higher values are faster but may hit rate limits."
                                        value={settings.parallelChunkSize}
                                        onChange={(v) => setSettings((s) => ({ ...s, parallelChunkSize: v }))}
                                        min={1}
                                        max={10}
                                    />
                                </div>
                            </section>

                            {/* Account Section */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-primary/10">
                                        <User className="w-4 h-4 text-primary" />
                                    </div>
                                    <h2 className="text-lg font-semibold text-foreground">Account</h2>
                                </div>
                                <div className="bg-card border border-border rounded-xl p-6 space-y-6">
                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium text-foreground">
                                                Clear All History
                                            </label>
                                            <p className="text-xs text-muted-foreground">
                                                Permanently delete all survey history and notifications. This cannot be undone.
                                            </p>
                                        </div>

                                        <AnimatePresence mode="wait">
                                            {showClearConfirm ? (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
                                                >
                                                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                                    <span className="text-sm text-red-600 dark:text-red-400 flex-1">
                                                        Are you sure? This cannot be undone.
                                                    </span>
                                                    <button
                                                        onClick={handleClearHistory}
                                                        className="px-3 py-1.5 text-xs font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                                    >
                                                        Yes, Clear
                                                    </button>
                                                    <button
                                                        onClick={() => setShowClearConfirm(false)}
                                                        className="px-3 py-1.5 text-xs font-medium bg-muted text-muted-foreground rounded-lg hover:bg-accent transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                </motion.div>
                                            ) : (
                                                <motion.button
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 10 }}
                                                    onClick={() => setShowClearConfirm(true)}
                                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Clear All History
                                                </motion.button>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
