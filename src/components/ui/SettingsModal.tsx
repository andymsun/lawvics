'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Settings, Zap } from 'lucide-react';

// ============================================================
// Premium Checkbox Component
// ============================================================

interface PremiumCheckboxProps {
    id: string;
    label: string;
    description?: string;
    checked: boolean;
    onChange: () => void;
    disabled?: boolean;
}

const PremiumCheckbox = ({
    id,
    label,
    description,
    checked,
    onChange,
    disabled = false,
}: PremiumCheckboxProps) => {
    return (
        <div className="relative">
            <label
                htmlFor={id}
                className={`flex items-start gap-6 cursor-pointer group ${disabled ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
            >
                {/* Checkbox Container */}
                <div className="relative flex items-center justify-center mt-1">
                    <input
                        id={id}
                        type="checkbox"
                        checked={checked}
                        onChange={onChange}
                        disabled={disabled}
                        className="sr-only"
                    />

                    {/* Custom checkbox visual - uses semantic colors */}
                    <motion.div
                        className={`
              w-7 h-7 rounded-lg border-2 flex items-center justify-center
              transition-colors duration-300
              ${checked
                                ? 'bg-primary border-primary'
                                : 'bg-card border-border group-hover:border-muted-foreground'
                            }
            `}
                        whileHover={!disabled ? { scale: 1.05 } : {}}
                        whileTap={!disabled ? { scale: 0.95 } : {}}
                    >
                        <AnimatePresence mode="wait">
                            {checked && (
                                <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    transition={{
                                        type: 'spring',
                                        stiffness: 500,
                                        damping: 25,
                                    }}
                                >
                                    <Check className="w-5 h-5 text-primary-foreground stroke-[3]" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* Glow effect on hover */}
                    {!disabled && (
                        <motion.div
                            className="absolute inset-0 rounded-lg bg-primary opacity-0 group-hover:opacity-20 transition-opacity duration-300"
                            style={{ filter: 'blur(8px)' }}
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
                </div>
            </label>
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
                    <motion.div
                        key={`v-${i}`}
                        className="absolute top-0 bottom-0 w-px bg-border"
                        style={{ left: `${(i + 1) * 5}%` }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.3 }}
                        transition={{ delay: i * 0.02 }}
                    />
                ))}
            </div>

            {/* Horizontal lines */}
            <div className="absolute inset-0">
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={`h-${i}`}
                        className="absolute left-0 right-0 h-px bg-border"
                        style={{ top: `${(i + 1) * 5}%` }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.3 }}
                        transition={{ delay: i * 0.02 }}
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

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const [settings, setSettings] = useState({
        parallelFetch: true,
        autoVerify: true,
        showConfidence: true,
        cacheResults: false,
    });

    const handleSettingChange = (key: keyof typeof settings) => {
        setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const options = [
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
                                            <PremiumCheckbox
                                                id={option.id}
                                                label={option.label}
                                                description={option.description}
                                                checked={settings[option.id as keyof typeof settings]}
                                                onChange={() =>
                                                    handleSettingChange(option.id as keyof typeof settings)
                                                }
                                            />
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex-shrink-0 p-6 border-t border-border bg-muted/30">
                                <div className="flex justify-end gap-3">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={onClose}
                                        className="px-6 py-3 text-muted-foreground font-medium rounded-lg hover:bg-muted transition-colors"
                                    >
                                        Cancel
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={onClose}
                                        className="px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity"
                                    >
                                        Save Preferences
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
