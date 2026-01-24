'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Zap, AlertTriangle, Key, Eye, EyeOff } from 'lucide-react';
import { useSettingsStore } from '@/lib/store';

// ============================================================
// Premium Toggle Switch Component
// ============================================================

interface PremiumToggleProps {
    id: string;
    label: string;
    description?: string;
    checked: boolean;
    onChange: () => void;
    disabled?: boolean;
    warning?: string;
}

const PremiumToggle = ({
    id,
    label,
    description,
    checked,
    onChange,
    disabled = false,
    warning,
}: PremiumToggleProps) => {
    return (
        <div className="relative">
            <label
                htmlFor={id}
                className={`flex items-start gap-6 cursor-pointer group ${disabled ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
            >
                {/* Toggle Switch Container */}
                <div className="relative flex items-center justify-center mt-1">
                    <input
                        id={id}
                        type="checkbox"
                        checked={checked}
                        onChange={onChange}
                        disabled={disabled}
                        className="sr-only"
                    />

                    {/* Custom toggle switch */}
                    <motion.div
                        className={`
                            w-14 h-8 rounded-full flex items-center px-1
                            transition-colors duration-300
                            ${checked
                                ? 'bg-primary'
                                : 'bg-muted border border-border group-hover:border-muted-foreground'
                            }
                        `}
                        whileHover={!disabled ? { scale: 1.02 } : {}}
                        whileTap={!disabled ? { scale: 0.98 } : {}}
                    >
                        <motion.div
                            className={`
                                w-6 h-6 rounded-full shadow-md
                                ${checked ? 'bg-primary-foreground' : 'bg-foreground/80'}
                            `}
                            animate={{ x: checked ? 24 : 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                    </motion.div>

                    {/* Glow effect on hover */}
                    {!disabled && (
                        <motion.div
                            className="absolute inset-0 rounded-full bg-primary opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-md"
                        />
                    )}
                </div>

                {/* Label and Description */}
                <div className="flex-1 space-y-2">
                    <div className="text-foreground font-medium text-lg tracking-wide">
                        {label}
                    </div>
                    {description && (
                        <div className="text-muted-foreground text-sm leading-relaxed">
                            {description}
                        </div>
                    )}
                    {warning && !checked && (
                        <div className="flex items-center gap-2 text-amber-500 text-sm mt-2">
                            <AlertTriangle className="w-4 h-4" />
                            <span>{warning}</span>
                        </div>
                    )}
                </div>
            </label>
        </div>
    );
};

// ============================================================
// API Key Input Component
// ============================================================

interface ApiKeyInputProps {
    value: string;
    onChange: (key: string) => void;
}

const ApiKeyInput = ({ value, onChange }: ApiKeyInputProps) => {
    const [showKey, setShowKey] = React.useState(false);
    const hasKey = value.length > 0;

    return (
        <div className="space-y-3 pt-4 border-t border-border">
            <div className="flex items-start gap-6">
                <div className="p-2 rounded-lg bg-amber-500/10 mt-1">
                    <Key className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex-1 space-y-3">
                    <div>
                        <div className="text-foreground font-medium text-lg tracking-wide">
                            OpenAI API Key
                        </div>
                        <div className="text-muted-foreground text-sm leading-relaxed mt-1">
                            Required for LLM-based statute verification in Real Mode.
                        </div>
                    </div>

                    {/* Input with visibility toggle */}
                    <div className="relative">
                        <input
                            type={showKey ? 'text' : 'password'}
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder="sk-..."
                            className="w-full px-4 py-3 pr-12 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all font-mono text-sm"
                        />
                        <button
                            type="button"
                            onClick={() => setShowKey(!showKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>

                    {/* Warning if empty */}
                    {!hasKey && (
                        <div className="flex items-center gap-2 text-amber-500 text-sm">
                            <AlertTriangle className="w-4 h-4" />
                            <span>Real Mode requires a valid OpenAI API Key.</span>
                        </div>
                    )}

                    {/* Security helper text */}
                    <div className="text-xs text-muted-foreground italic">
                        Your key is stored locally in your browser and only used for verification.
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================================================
// Grid Background Component
// ============================================================

const GridBackground = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Vertical lines */}
            <div className="absolute inset-0">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={`v-${i}`}
                        className="absolute top-0 bottom-0 w-px bg-border opacity-30"
                        style={{ left: `${(i + 1) * 5}%` }}
                    />
                ))}
            </div>

            {/* Horizontal lines */}
            <div className="absolute inset-0">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={`h-${i}`}
                        className="absolute left-0 right-0 h-px bg-border opacity-30"
                        style={{ top: `${(i + 1) * 5}%` }}
                    />
                ))}
            </div>
        </div>
    );
};

// ============================================================
// Settings Modal Component
// ============================================================

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface SettingOption {
    id: 'enableMockMode' | 'parallelFetch' | 'autoVerify' | 'showConfidence' | 'cacheResults';
    label: string;
    description: string;
    warning?: string;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const settings = useSettingsStore();

    const options: SettingOption[] = [
        {
            id: 'enableMockMode',
            label: 'Mock Data Mode',
            description:
                'Use simulated data for fast testing (~1-2 seconds per survey). Disable for real web scraping.',
            warning: 'Real mode is significantly slower (30+ seconds) and requires API keys.',
        },
        {
            id: 'parallelFetch',
            label: 'Parallel Fetching',
            description:
                'Enable simultaneous queries across all 50 jurisdictions for maximum speed.',
        },
        {
            id: 'autoVerify',
            label: 'Auto-Verification',
            description:
                'Automatically run Shepardizing checks on all returned statutes to detect hallucinations.',
        },
        {
            id: 'showConfidence',
            label: 'Confidence Scores',
            description:
                'Display confidence percentages and trust badges on statute cards.',
        },
        {
            id: 'cacheResults',
            label: 'Cache Results',
            description:
                'Store verified results locally to speed up repeat queries (experimental).',
        },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl md:max-h-[85vh] bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
                    >
                        {/* Grid Background */}
                        <GridBackground />

                        {/* Content */}
                        <div className="relative z-10 h-full flex flex-col">
                            {/* Header */}
                            <div className="flex-shrink-0 p-6 border-b border-border">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-primary/10">
                                            <Settings className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-foreground tracking-tight">
                                                Preferences
                                            </h2>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Zap className="w-4 h-4 text-primary" />
                                                <span className="text-sm font-medium text-muted-foreground">
                                                    50 States in 50 Seconds
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                                    >
                                        <X className="w-5 h-5 text-muted-foreground" />
                                    </button>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="flex-1 overflow-auto p-6">
                                <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
                                    Customize your research experience with granular control over
                                    performance, verification, and display preferences.
                                </p>

                                <div className="space-y-8">
                                    {options.map((option, index) => (
                                        <motion.div
                                            key={option.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{
                                                delay: 0.1 + index * 0.1,
                                                duration: 0.5,
                                                ease: [0.22, 1, 0.36, 1],
                                            }}
                                        >
                                            <PremiumToggle
                                                id={option.id}
                                                label={option.label}
                                                description={option.description}
                                                warning={option.warning}
                                                checked={settings[option.id] as boolean}
                                                onChange={() => settings.toggleSetting(option.id)}
                                            />
                                        </motion.div>
                                    ))}

                                    {/* API Key Section - Only visible when Mock Mode is OFF */}
                                    <AnimatePresence>
                                        {!settings.enableMockMode && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <ApiKeyInput
                                                    value={settings.openaiApiKey}
                                                    onChange={(key) => settings.setApiKey(key)}
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex-shrink-0 p-6 border-t border-border bg-muted/30">
                                <div className="flex justify-between items-center">
                                    <div className="text-sm text-muted-foreground">
                                        {settings.enableMockMode ? (
                                            <span className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-green-500" />
                                                Mock Mode Active
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2 text-amber-500">
                                                <span className="w-2 h-2 rounded-full bg-amber-500" />
                                                Real Mode (Slower)
                                            </span>
                                        )}
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={onClose}
                                        className="px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity"
                                    >
                                        Done
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
