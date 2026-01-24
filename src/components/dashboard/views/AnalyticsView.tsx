'use client';

import React, { useMemo } from 'react';
import { useSurveyHistoryStore, useShallow, StatuteEntry } from '@/lib/store';
import { US_STATES } from '@/lib/constants/states';
import { StateCode } from '@/types/statute';
import { BarChart3, TrendingUp, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Region groupings
const REGIONS = {
    Northeast: ['CT', 'DE', 'MA', 'MD', 'ME', 'NH', 'NJ', 'NY', 'PA', 'RI', 'VT'],
    Southeast: ['AL', 'FL', 'GA', 'KY', 'NC', 'SC', 'TN', 'VA', 'WV'],
    Midwest: ['IA', 'IL', 'IN', 'KS', 'MI', 'MN', 'MO', 'ND', 'NE', 'OH', 'SD', 'WI'],
    Southwest: ['AZ', 'NM', 'OK', 'TX'],
    West: ['AK', 'CA', 'CO', 'HI', 'ID', 'MT', 'NV', 'OR', 'UT', 'WA', 'WY', 'AR', 'LA', 'MS'],
};

interface BarProps {
    label: string;
    value: number;
    max: number;
    color: string;
}

function Bar({ label, value, max, color }: BarProps) {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    return (
        <div className="flex items-center gap-3">
            <span className="w-24 text-sm text-muted-foreground truncate">{label}</span>
            <div className="flex-1 h-6 bg-muted rounded-md overflow-hidden">
                <div
                    className={cn('h-full transition-all duration-500', color)}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <span className="w-12 text-right text-sm font-semibold">{value}</span>
        </div>
    );
}

export default function AnalyticsView() {
    // Get statutes from the ACTIVE SESSION (not global store)
    const activeSession = useSurveyHistoryStore(
        useShallow((state) => state.surveys.find((s) => s.id === state.activeSurveyId))
    );
    const statutes = useMemo<Partial<Record<StateCode, StatuteEntry>>>(() =>
        activeSession?.statutes ?? {},
        [activeSession?.statutes]
    );
    const surveys = useSurveyHistoryStore((state) => state.surveys);

    // Calculate analytics
    const analytics = useMemo(() => {
        // Count by status
        let successCount = 0;
        let errorCount = 0;
        let pendingCount = 0;
        let totalConfidence = 0;
        let confidenceCount = 0;

        Object.entries(statutes).forEach(([_, entry]) => {
            if (!entry) {
                pendingCount++;
            } else if (entry instanceof Error) {
                errorCount++;
            } else {
                successCount++;
                totalConfidence += entry.confidenceScore;
                confidenceCount++;
            }
        });

        pendingCount = 50 - successCount - errorCount;

        // Count by region
        const regionStats = Object.entries(REGIONS).map(([region, codes]) => {
            let found = 0;
            let errors = 0;
            codes.forEach((code) => {
                const entry = statutes[code as StateCode];
                if (entry && !(entry instanceof Error)) found++;
                if (entry instanceof Error) errors++;
            });
            return { region, found, errors, total: codes.length };
        });

        // Average confidence
        const avgConfidence = confidenceCount > 0 ? Math.round(totalConfidence / confidenceCount) : 0;

        // Survey stats
        const completedSurveys = surveys.filter((s) => s.status === 'completed').length;
        const avgSuccessRate = surveys.length > 0
            ? Math.round(surveys.reduce((acc, s) => acc + (s.successCount / 50) * 100, 0) / surveys.length)
            : 0;

        return {
            successCount,
            errorCount,
            pendingCount,
            avgConfidence,
            regionStats,
            completedSurveys,
            avgSuccessRate,
        };
    }, [statutes, surveys]);

    const maxRegion = Math.max(...analytics.regionStats.map((r) => r.found));

    return (
        <div className="h-full flex flex-col p-6 overflow-auto">
            {/* Header */}
            <div className="flex-shrink-0 mb-6">
                <h2 className="text-lg font-semibold text-foreground">Survey Analytics</h2>
                <p className="text-sm text-muted-foreground">Aggregate insights across all jurisdictions</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="p-4 rounded-lg bg-card border border-border">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase">Verified</span>
                    </div>
                    <div className="text-3xl font-bold text-green-500">{analytics.successCount}</div>
                </div>
                <div className="p-4 rounded-lg bg-card border border-border">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase">Errors</span>
                    </div>
                    <div className="text-3xl font-bold text-error">{analytics.errorCount}</div>
                </div>
                <div className="p-4 rounded-lg bg-card border border-border">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase">Avg Confidence</span>
                    </div>
                    <div className="text-3xl font-bold text-primary">{analytics.avgConfidence}%</div>
                </div>
                <div className="p-4 rounded-lg bg-card border border-border">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <BarChart3 className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase">Surveys Run</span>
                    </div>
                    <div className="text-3xl font-bold">{analytics.completedSurveys}</div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-2 gap-6">
                {/* Coverage by Region */}
                <div className="p-4 rounded-lg bg-card border border-border">
                    <h3 className="text-sm font-semibold mb-4">Coverage by Region</h3>
                    <div className="space-y-3">
                        {analytics.regionStats.map((r) => (
                            <Bar
                                key={r.region}
                                label={r.region}
                                value={r.found}
                                max={maxRegion}
                                color="bg-primary"
                            />
                        ))}
                    </div>
                </div>

                {/* Status Distribution */}
                <div className="p-4 rounded-lg bg-card border border-border">
                    <h3 className="text-sm font-semibold mb-4">Status Distribution</h3>
                    <div className="space-y-3">
                        <Bar label="Verified" value={analytics.successCount} max={50} color="bg-green-500" />
                        <Bar label="Errors" value={analytics.errorCount} max={50} color="bg-error" />
                        <Bar label="Pending" value={analytics.pendingCount} max={50} color="bg-slate-400" />
                    </div>

                    {/* Pie-like summary */}
                    <div className="mt-6 flex items-center justify-center">
                        <div className="relative w-32 h-32">
                            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                                <circle
                                    cx="18" cy="18" r="16"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    className="text-muted"
                                />
                                <circle
                                    cx="18" cy="18" r="16"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeDasharray={`${(analytics.successCount / 50) * 100} 100`}
                                    className="text-green-500"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                    <div className="text-2xl font-bold">{Math.round((analytics.successCount / 50) * 100)}%</div>
                                    <div className="text-xs text-muted-foreground">Complete</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
