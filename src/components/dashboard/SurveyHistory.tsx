'use client';

import React from 'react';
import { useSurveyHistoryStore, SurveyRecord, useShallow } from '@/lib/store';
import { Statute } from '@/types/statute';
import { cn } from '@/lib/utils';
import { Clock, CheckCircle, AlertCircle, Loader2, FileText, Eye, Play, Trash2, Calendar, LayoutGrid, AlertTriangle } from 'lucide-react';
import { ExportButton } from './ExportButton';

function formatTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}

function StatusBadge({ status, progress }: { status: SurveyRecord['status']; progress?: number }) {
    switch (status) {
        case 'running':
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Running{progress !== undefined ? ` (${progress}%)` : ''}
                </span>
            );
        case 'completed':
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    <CheckCircle className="w-3 h-3" />
                    Completed
                </span>
            );
        case 'failed':
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-error/15 text-error dark:border-error/30">
                    <AlertCircle className="w-3 h-3" />
                    Failed
                </span>
            );
        case 'cancelled':
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400">
                    <Clock className="w-3 h-3" />
                    Cancelled
                </span>
            );
    }
}

function formatDuration(ms: number): string {
    if (ms < 1000) return '<1s';
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));

    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
}

export function SurveyHistory() {
    // Use useShallow for array selection to prevent infinite re-renders
    const surveys = useSurveyHistoryStore(useShallow((state) => state.surveys));
    const activeSurveyId = useSurveyHistoryStore((state) => state.activeSurveyId);
    const setActiveSurvey = useSurveyHistoryStore((state) => state.setActiveSurvey);
    const [currentTime, setCurrentTime] = React.useState(() => Date.now());

    React.useEffect(() => {
        const hasRunning = surveys.some(s => s.status === 'running');
        if (!hasRunning) return;

        const interval = setInterval(() => {
            setCurrentTime(Date.now());
        }, 1000);

        return () => clearInterval(interval);
    }, [surveys]);

    if (surveys.length === 0) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">History</h3>
                    <ExportButton data={surveys} type="history" />
                </div>
                <div className="p-6 text-center text-muted-foreground border border-dashed rounded-lg">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No surveys yet</p>
                    <p className="text-xs mt-1">Run a search to get started</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">History</h3>
                <ExportButton data={surveys} type="history" />
            </div>
            <div className="space-y-2">
                {surveys.map((survey) => {
                    const riskCount = Object.values(survey.statutes || {}).filter((entry) => {
                        if (!entry || entry instanceof Error) return false;
                        const statute = entry as Statute;
                        return statute.confidenceScore < 85 ||
                            statute.trustLevel === 'suspicious' ||
                            statute.trustLevel === 'unverified';
                    }).length;

                    // Calculate duration
                    const duration = survey.status === 'running'
                        ? currentTime - survey.startedAt
                        : (survey.completedAt ? survey.completedAt - survey.startedAt : 0);

                    return (
                        <button
                            key={survey.id}
                            onClick={() => setActiveSurvey(survey.id)}
                            className={cn(
                                'w-full text-left p-3 rounded-lg border transition-colors',
                                activeSurveyId === survey.id
                                    ? 'bg-primary/5 border-primary/30'
                                    : 'bg-card border-border hover:bg-muted'
                            )}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono text-muted-foreground">
                                            #{survey.id}
                                        </span>
                                        <StatusBadge
                                            status={survey.status}
                                            progress={survey.status === 'running' ? Math.round((Object.keys(survey.statutes || {}).length / 50) * 100) : undefined}
                                        />
                                        {duration > 0 && (
                                            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground ml-auto">
                                                {survey.status === 'running' ? 'Running: ' : ''}{formatDuration(duration)}
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-1 text-sm font-medium truncate" title={survey.query}>
                                        {survey.query}
                                    </p>
                                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                                        <span>{formatTime(survey.startedAt)}</span>
                                        {survey.status !== 'running' && (
                                            <>
                                                <span>•</span>
                                                <>
                                                    <span>•</span>
                                                    <span className="text-green-500">
                                                        {Object.values(survey.statutes || {}).filter(s =>
                                                            !(s instanceof Error) &&
                                                            (s as Statute).confidenceScore >= 85 &&
                                                            (s as Statute).trustLevel !== 'suspicious' &&
                                                            (s as Statute).trustLevel !== 'unverified'
                                                        ).length} success
                                                    </span>
                                                    {riskCount > 0 && <span className="text-risk">{riskCount} risk</span>}
                                                    <span className="text-error">{Object.values(survey.statutes || {}).filter(s => s instanceof Error).length} errors</span>
                                                </>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default SurveyHistory;

