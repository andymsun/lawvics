'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe, Bot, Zap, ExternalLink, Code2, Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useSurveyHistoryStore, useSettingsStore, useShallow, getActiveSessionStatutes, useSavedStatuteStore } from '@/lib/store';
import { StateCode, Statute } from '@/types/statute';
import { StatuteErrorWithSuggestions } from '@/lib/agents/suggester';
import StatuteCard from '@/components/ui/StatuteCard';

/**
 * RetryButton component for "Did you mean?" suggestions
 * Handles loading state and proper async fetch
 */
function RetryButton({ suggestion, stateCode, surveyId }: { suggestion: string; stateCode: StateCode; surveyId: number }) {
    const [isLoading, setIsLoading] = useState(false);

    const handleRetry = async () => {
        setIsLoading(true);
        try {
            const { fetchStateStatute } = await import('@/lib/agents/orchestrator');
            await fetchStateStatute(stateCode, suggestion, surveyId);
        } catch (error) {
            console.error('Retry failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleRetry}
            disabled={isLoading}
            className="w-full text-left flex items-center justify-between px-3 py-2 bg-background/50 hover:bg-primary/5 border border-transparent hover:border-primary/20 rounded-md text-sm transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <span className="text-foreground group-hover:text-primary transition-colors">
                {suggestion}
            </span>
            {isLoading ? (
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
            ) : (
                <span className="text-xs text-muted-foreground group-hover:text-primary/70">
                    Retry
                </span>
            )}
        </button>
    );
}

export default function StatuteDetailPanel() {
    const activeStateCode = useSurveyHistoryStore((state) => state.activeStateCode);
    const setActiveState = useSurveyHistoryStore((state) => state.setActiveState);
    const settings = useSettingsStore();
    const saveStatute = useSavedStatuteStore((state) => state.saveStatute);
    const removeStatute = useSavedStatuteStore((state) => state.removeStatute);
    const savedStatutes = useSavedStatuteStore((state) => state.savedStatutes);

    // Local state for sliding window
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Get active session data
    const activeSurveyId = useSurveyHistoryStore((state) => state.activeSurveyId);
    const surveys = useSurveyHistoryStore((state) => state.surveys);
    const activeSurvey = surveys.find((s) => s.id === activeSurveyId);

    // Derived state
    const activeStatutes = activeSurvey?.statutes || {};
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
            case 'system-api':
                return (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-medium border border-indigo-200 dark:border-indigo-800">
                        <Zap className="w-3.5 h-3.5" />
                        Source: Lawvics Proprietary Systems
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
                    {/* Floating Panel (Non-intrusive) */}
                    <motion.div
                        key={activeStateCode}
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{
                            x: isCollapsed ? 'calc(100% - 0px)' : 0,
                            opacity: 1
                        }}
                        exit={{ x: '100%', opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                        className="absolute right-4 top-4 bottom-4 w-96 bg-card/95 backdrop-blur-md border border-border rounded-xl shadow-2xl z-50 flex flex-col pointer-events-auto overflow-visible"
                    >
                        {/* Semicircle Toggle Button */}
                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 w-8 h-16 bg-card border-y border-l border-border rounded-l-full shadow-md flex items-center justify-center hover:bg-muted transition-colors z-50 focus:outline-none"
                            aria-label={isCollapsed ? "Expand panel" : "Collapse panel"}
                        >
                            {isCollapsed ? (
                                <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                            ) : (
                                <ChevronRight className="w-5 h-5 text-muted-foreground" />
                            )}
                        </button>

                        {/* Content Container - hidden when collapsed to prevent interaction/focus issues */}
                        <div className={`flex flex-col h-full overflow-hidden transition-opacity duration-300 ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                            {/* Header */}
                            <div className="sticky top-0 bg-card/95 backdrop-blur z-10 px-6 py-4 border-b border-border flex items-center justify-between flex-shrink-0">
                                <div>
                                    <h2 className="text-lg font-bold text-foreground">
                                        {activeStateCode} Statute Details
                                    </h2>
                                    <div className="mt-1">
                                        {getSourceBadge()}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    {statute && (
                                        <button
                                            onClick={() => {
                                                if (!!savedStatutes[statute.citation]) {
                                                    removeStatute(statute.citation);
                                                } else {
                                                    saveStatute(statute, activeSurvey?.query);
                                                }
                                            }}
                                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                                            title={!!savedStatutes[statute.citation] ? 'Remove from saved' : 'Save statute'}
                                        >
                                            {!!savedStatutes[statute.citation] ? (
                                                <BookmarkCheck className="w-5 h-5 text-primary" />
                                            ) : (
                                                <Bookmark className="w-5 h-5 text-muted-foreground" />
                                            )}
                                        </button>
                                    )}
                                    <button
                                        onClick={handleClose}
                                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                                    >
                                        <X className="w-5 h-5 text-muted-foreground" />
                                    </button>
                                </div>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {isError ? (
                                    <div className="p-4 bg-slate-500/10 border border-slate-500/20 rounded-lg text-slate-600 dark:text-slate-400">
                                        <h3 className="font-semibold mb-1">System Error</h3>
                                        <p className="text-sm">{(selectedStatuteEntry as Error).message}</p>

                                        {/* Suggestions Section */}
                                        {selectedStatuteEntry instanceof StatuteErrorWithSuggestions && selectedStatuteEntry.suggestions && selectedStatuteEntry.suggestions.length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-slate-500/20">
                                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                                    Did you mean?
                                                </p>
                                                <div className="space-y-2">
                                                    {(selectedStatuteEntry.suggestions).map((suggestion, idx) => (
                                                        <RetryButton
                                                            key={idx}
                                                            suggestion={suggestion}
                                                            stateCode={activeStateCode!}
                                                            surveyId={activeSurveyId!}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : statute ? (

                                    <>
                                        <StatuteCard statute={statute} />

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

                                {/* Similar Statute Findings Section */}
                                {statute && (
                                    <div className="pt-8 border-t border-border mt-8">
                                        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                                            <Bookmark className="w-4 h-4 text-primary" />
                                            Similar Statute Findings
                                        </h3>
                                        <div className="space-y-3">
                                            {Object.entries(activeStatutes)
                                                .filter(([code, entry]) =>
                                                    code !== activeStateCode && // Exclude current
                                                    !(entry instanceof Error) // Exclude errors
                                                )
                                                .map(([code, entry]) => {
                                                    const s = entry as Statute;
                                                    return (
                                                        <button
                                                            key={code}
                                                            onClick={() => setActiveState(code as StateCode)}
                                                            className="w-full text-left p-3 rounded-lg border border-border bg-card/50 hover:bg-muted/80 transition-all group"
                                                        >
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                                                                    {code}
                                                                </span>
                                                                <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors">
                                                                    View Details →
                                                                </span>
                                                            </div>
                                                            <div className="text-sm font-medium text-foreground line-clamp-1">
                                                                {s.citation}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                                {s.textSnippet.substring(0, 100)}...
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            {Object.entries(activeStatutes).filter(([code, entry]) => code !== activeStateCode && !(entry instanceof Error)).length === 0 && (
                                                <p className="text-xs text-muted-foreground text-center py-4">
                                                    No other findings found for this search.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
