'use client';

import { useState, useEffect } from 'react';
import { useSurveyHistoryStore, SurveyRecord } from '@/lib/store';
import { FileText, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import { DoubleConfirmDelete } from '@/components/ui/DoubleConfirmDelete';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

function formatDate(timestamp: number): string {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(timestamp));
}

function formatDuration(start: number, end?: number): string {
    if (!end) return 'In Progress';
    const seconds = Math.round((end - start) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
}

export default function HistoryPage() {
    const [mounted, setMounted] = useState(false);
    const surveys = useSurveyHistoryStore((state) => state.surveys);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <main className="flex-1 flex flex-col overflow-hidden p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Survey History</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        View and manage your past 50-state survey results.
                    </p>
                </div>
                {surveys.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                        {surveys.length} {surveys.length === 1 ? 'survey' : 'surveys'}
                    </div>
                )}
            </div>

            {/* Content */}
            {surveys.length === 0 ? (
                /* Empty State */
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                        <Clock className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h2 className="text-lg font-semibold text-foreground mb-2">
                        No surveys run yet
                    </h2>
                    <p className="text-sm text-muted-foreground max-w-sm mb-6">
                        Run your first 50-state survey from the workspace to see your research history here.
                    </p>
                    <Link
                        href="/dashboard"
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
                    >
                        Go to Workspace
                    </Link>
                </div>
            ) : (
                /* Survey Table */
                <div className="flex-1 overflow-auto rounded-lg border border-border bg-card">
                    <table className="w-full">
                        <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                            <tr className="border-b border-border">
                                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                                    Survey Name
                                </th>
                                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                                    Date
                                </th>
                                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                                    States Analyzed
                                </th>
                                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                                    Risk Found
                                </th>
                                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                                    Duration
                                </th>
                                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {surveys.map((survey) => (
                                <SurveyRow key={survey.id} survey={survey} />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </main>
    );
}

function SurveyRow({ survey }: { survey: SurveyRecord }) {
    const router = useRouter();
    const setActiveSurvey = useSurveyHistoryStore((state) => state.setActiveSurvey);

    // Derived state for live updates
    const statutes = survey.statutes || {};
    const statesAnalyzed = Object.keys(statutes).length;

    // Check for risk types
    const riskItems = Object.values(statutes).filter(s => s instanceof Error || s.trustLevel === 'suspicious');
    const unverifiedItems = Object.values(statutes).filter(s => !(s instanceof Error) && s.trustLevel === 'unverified');

    const hasCriticalRisk = riskItems.length > 0;
    const hasUnverified = unverifiedItems.length > 0;

    const statusColor = {
        running: 'text-yellow-500',
        completed: 'text-green-500',
        failed: 'text-red-500',
        cancelled: 'text-slate-500',
    }[survey.status];

    const handleViewResults = () => {
        setActiveSurvey(survey.id);
        router.push('/dashboard');
    };

    return (
        <tr className="hover:bg-muted/50 transition-colors">
            {/* Survey Name (Query) */}
            <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm font-medium text-foreground truncate max-w-xs">
                        {survey.query || `Survey #${survey.id}`}
                    </span>
                </div>
            </td>

            {/* Date */}
            <td className="px-4 py-4">
                <span className="text-sm text-muted-foreground">
                    {formatDate(survey.startedAt)}
                </span>
            </td>

            {/* States Analyzed */}
            <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{statesAnalyzed}</span>
                    <span className="text-xs text-muted-foreground">/ 50</span>
                    {statesAnalyzed === 50 && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                </div>
            </td>

            {/* Risk Found */}
            <td className="px-4 py-4">
                {hasCriticalRisk ? (
                    <div className="flex items-center gap-1.5">
                        <XCircle className="w-4 h-4 text-red-500" />
                        <span className="text-sm font-medium text-red-500">
                            Yes ({riskItems.length})
                        </span>
                    </div>
                ) : hasUnverified ? (
                    <div className="flex items-center gap-1.5">
                        <Eye className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-medium text-yellow-500">
                            Unverified ({unverifiedItems.length})
                        </span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium text-green-500">No</span>
                    </div>
                )}
            </td>

            {/* Duration */}
            <td className="px-4 py-4">
                <span className={cn('text-sm', statusColor)}>
                    {formatDuration(survey.startedAt, survey.completedAt)}
                </span>
            </td>

            {/* Action */}
            <td className="px-4 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={handleViewResults}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                    >
                        <Eye className="w-3.5 h-3.5" />
                        View Results
                    </button>
                    <DoubleConfirmDelete
                        onConfirm={() => useSurveyHistoryStore.getState().deleteSurvey(survey.id)}
                        className="hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                    />
                </div>
            </td>
        </tr>
    );
}
