'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe, Bot, Zap, ExternalLink, Code2 } from 'lucide-react';
import { useSurveyHistoryStore, useSettingsStore, useShallow, getActiveSessionStatutes } from '@/lib/store';
import StatuteCard from '@/components/ui/StatuteCard';

export default function StatuteDetailPanel() {
    const activeStateCode = useSurveyHistoryStore((state) => state.activeStateCode);
    const setActiveState = useSurveyHistoryStore((state) => state.setActiveState);
    const settings = useSettingsStore();

    // Get active session data
    const activeStatutes = useSurveyHistoryStore(useShallow(getActiveSessionStatutes));

    // Derived state
    const selectedStatuteEntry = activeStateCode ? activeStatutes[activeStateCode] : null;
    const isError = selectedStatuteEntry instanceof Error;
    const statute = !isError ? selectedStatuteEntry : null;

    const handleClose = () => setActiveState(null);

    // Source Badge Helper
    const getSourceBadge = () => {
        switch (settings.dataSource) {
            case 'official-api':
                return (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-medium border border-blue-200 dark:border-blue-800">
                        <Globe className="w-3.5 h-3.5" />
                        Source: Open States API
                    </div>
                );
            case 'llm-scraper':
                return (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-medium border border-purple-200 dark:border-purple-800">
                        <Bot className="w-3.5 h-3.5" />
                        Source: AI Verification
                    </div>
                );
            default: // mock
                return (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-medium border border-green-200 dark:border-green-800">
                        <Zap className="w-3.5 h-3.5" />
                        Source: Mock Data
                    </div>
                );
        }
    };

    return (
        <AnimatePresence>
            {activeStateCode && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-background/50 backdrop-blur-sm z-40"
                        onClick={handleClose}
                    />

                    {/* Slide-over Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border shadow-2xl z-50 overflow-y-auto"
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-card/95 backdrop-blur z-10 px-6 py-4 border-b border-border flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-foreground">
                                    {activeStateCode} Statute Details
                                </h2>
                                <div className="mt-1">
                                    {getSourceBadge()}
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                className="p-2 rounded-lg hover:bg-muted transition-colors"
                            >
                                <X className="w-5 h-5 text-muted-foreground" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            {isError ? (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-600 dark:text-red-400">
                                    <h3 className="font-semibold mb-1">Error Fetching Data</h3>
                                    <p className="text-sm">{(selectedStatuteEntry as Error).message}</p>
                                </div>
                            ) : statute ? (
                                <>
                                    <StatuteCard statute={statute} onClose={handleClose} />

                                    {/* Raw Data View for Official API */}
                                    {settings.dataSource === 'official-api' && (
                                        <div className="mt-8 space-y-3">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                                <Code2 className="w-4 h-4" />
                                                Raw API Response
                                            </div>
                                            <div className="bg-muted rounded-lg p-4 overflow-x-auto border border-border">
                                                <pre className="text-xs font-mono text-muted-foreground">
                                                    {JSON.stringify(statute, null, 2)}
                                                </pre>
                                            </div>
                                            <div className="text-xs text-muted-foreground text-center">
                                                Data provided by Open States v3 API
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    <p>No data available for this state yet.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
