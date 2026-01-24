'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Zap, AlertTriangle, Key, Eye, EyeOff, Database, Bot, Globe } from 'lucide-react';
import { useSettingsStore, DataSource } from '@/lib/store';

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
    label: string;
    value: string;
    onChange: (key: string) => void;
    placeholder?: string;
    helperText?: string;
    required?: boolean;
}

const ApiKeyInput = ({ label, value, onChange, placeholder = "sk-...", helperText, required = false }: ApiKeyInputProps) => {
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
                            {label}
                        </div>
                        {helperText && (
                            <div className="text-muted-foreground text-sm leading-relaxed mt-1">
                                {helperText}
                            </div>
                        )}
                    </div>

                    {/* Input with visibility toggle */}
                    <div className="relative">
                        <input
                            type={showKey ? 'text' : 'password'}
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={placeholder}
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

                    {/* Warning if empty & required */}
                    {required && !hasKey && (
                        <div className="flex items-center gap-2 text-amber-500 text-sm">
                            <AlertTriangle className="w-4 h-4" />
                            <span>{label} is required for this mode.</span>
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
// Data Source Selector
// ============================================================

interface DataSourceOption {
    id: DataSource;
    icon: React.ElementType;
    label: string;
    description: string;
}

const DataSourceSelector = () => {
    const { dataSource, setDataSource } = useSettingsStore();

    const sources: DataSourceOption[] = [
        {
            id: 'mock',
            icon: Zap,
            label: 'Mock Data',
            description: 'Instant, free, simulated data. Best for testing UI flows.'
        },
        {
            id: 'llm-scraper',
            icon: Bot,
            label: 'AI Scraper',
            description: 'Deep search using LLMs + Web Browsing. Slow but thorough.'
        },
        {
            id: 'official-api',
            icon: Globe,
            label: 'Open States API',
            description: 'Official legislative data. Fast and accurate.'
        }
    ];

    return (
        <div className="space-y-4">
            <label className="text-foreground font-medium text-lg tracking-wide flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                Data Source
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {sources.map((source) => (
                    <div
                        key={source.id}
                        onClick={() => setDataSource(source.id)}
                        className={`
                            cursor-pointer p-4 rounded-xl border-2 transition-all duration-200
                            flex flex-col gap-3
                            ${dataSource === source.id
                                ? 'border-primary bg-primary/5 shadow-lg scale-[1.02]'
                                : 'border-border bg-card hover:border-muted-foreground/50 hover:bg-muted/30'
                            }
                        `}
                    >
                        <div className={`p-2 w-fit rounded-lg ${dataSource === source.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                            <source.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="font-semibold text-foreground">{source.label}</div>
                            <div className="text-xs text-muted-foreground mt-1 leading-snug">{source.description}</div>
                        </div>
                    </div>
                ))}
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
    id: 'parallelFetch' | 'autoVerify' | 'showConfidence' | 'cacheResults';
    label: string;
    description: string;
    warning?: string;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const settings = useSettingsStore();

    const options: SettingOption[] = [
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
                                    {/* Data Source Selector */}
                                    <DataSourceSelector />

                                    {/* API Keys based on Data Source */}
                                    <AnimatePresence mode='wait'>
                                        {settings.dataSource === 'llm-scraper' && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="space-y-4"
                                            >
                                                <ApiKeyInput
                                                    label="OpenAI API Key"
                                                    value={settings.openaiApiKey}
                                                    onChange={settings.setOpenaiApiKey}
                                                    helperText="Required for OpenAI models."
                                                />
                                                <ApiKeyInput
                                                    label="Gemini API Key"
                                                    value={settings.geminiApiKey}
                                                    onChange={settings.setGeminiApiKey}
                                                    helperText="Required for Google Gemini models."
                                                    placeholder="AIzp..."
                                                />
                                            </motion.div>
                                        )}
                                        {settings.dataSource === 'official-api' && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                            >
                                                <ApiKeyInput
                                                    label="Open States API Key"
                                                    value={settings.openStatesApiKey}
                                                    onChange={settings.setOpenStatesApiKey}
                                                    helperText="Get a free key at openstates.org"
                                                    required={true}
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className="border-t border-border my-6"></div>

                                    {/* Other Settings */}
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
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex-shrink-0 p-6 border-t border-border bg-muted/30">
                                <div className="flex justify-between items-center">
                                    <div className="text-sm text-muted-foreground">
                                        <span className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${settings.dataSource === 'mock' ? 'bg-green-500' : 'bg-amber-500'}`} />
                                            Active Source: <span className="font-semibold uppercase">{settings.dataSource.replace('-', ' ')}</span>
                                        </span>
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
