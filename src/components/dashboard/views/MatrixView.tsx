'use client';

import React, { useMemo } from 'react';
import { useSurveyHistoryStore, useShallow, StatuteEntry } from '@/lib/store';
import { US_STATES } from '@/lib/constants/states';
import { StateCode } from '@/types/statute';
import { ShieldCheck, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

type Status = 'success' | 'error' | 'pending';

function getStatus(entry: unknown): Status {
    if (!entry) return 'pending';
    if (entry instanceof Error) return 'error';
    return 'success';
}

function StatusCell({ status }: { status: Status }) {
    switch (status) {
        case 'success':
            return <ShieldCheck className="w-4 h-4 text-green-500" />;
        case 'error':
            return <AlertCircle className="w-4 h-4 text-error" />;
        case 'pending':
            return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
}

export default function MatrixView() {
    // Get statutes from the ACTIVE SESSION (not global store)
    const activeSession = useSurveyHistoryStore(
        useShallow((state) => state.surveys.find((s) => s.id === state.activeSurveyId))
    );
    const statutes = useMemo<Partial<Record<StateCode, StatuteEntry>>>(() =>
        activeSession?.statutes ?? {},
        [activeSession?.statutes]
    );

    // Build matrix data
    const matrixData = useMemo(() => {
        return US_STATES.map((state) => {
            const entry = statutes[state.code as StateCode];
            const status = getStatus(entry);
            const statute = entry instanceof Error ? null : entry;

            return {
                code: state.code,
                name: state.name,
                status,
                citation: statute?.citation || '-',
                effectiveDate: statute?.effectiveDate || '-',
                confidence: statute?.confidenceScore || 0,
                riskLevel: statute && statute.confidenceScore < 85 ? 'Review' : 'Low',
            };
        });
    }, [statutes]);

    // Group by region (simplified)
    const regions = {
        Northeast: ['CT', 'DE', 'MA', 'MD', 'ME', 'NH', 'NJ', 'NY', 'PA', 'RI', 'VT'],
        Southeast: ['AL', 'FL', 'GA', 'KY', 'NC', 'SC', 'TN', 'VA', 'WV'],
        Midwest: ['IA', 'IL', 'IN', 'KS', 'MI', 'MN', 'MO', 'ND', 'NE', 'OH', 'SD', 'WI'],
        Southwest: ['AZ', 'NM', 'OK', 'TX'],
        West: ['AK', 'CA', 'CO', 'HI', 'ID', 'MT', 'NV', 'OR', 'UT', 'WA', 'WY', 'AR', 'LA', 'MS'],
    };

    return (
        <div className="h-full flex flex-col p-4 overflow-hidden">
            {/* Header */}
            <div className="flex-shrink-0 mb-4">
                <h2 className="text-lg font-semibold text-foreground">50-State Matrix Comparison</h2>
                <p className="text-sm text-muted-foreground">Side-by-side analysis of all jurisdictions</p>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-card z-10">
                        <tr className="border-b border-border">
                            <th className="text-left py-3 px-4 font-semibold text-muted-foreground">State</th>
                            <th className="text-center py-3 px-2 font-semibold text-muted-foreground w-16">Status</th>
                            <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Citation</th>
                            <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Effective</th>
                            <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Confidence</th>
                            <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Risk</th>
                        </tr>
                    </thead>
                    <tbody>
                        {matrixData.map((row) => (
                            <tr
                                key={row.code}
                                className="border-b border-border/50 hover:bg-muted/50 transition-colors"
                            >
                                <td className="py-2 px-4">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs text-muted-foreground">{row.code}</span>
                                        <span className="font-medium">{row.name}</span>
                                    </div>
                                </td>
                                <td className="py-2 px-2 text-center">
                                    <StatusCell status={row.status} />
                                </td>
                                <td className="py-2 px-4 font-mono text-xs">{row.citation}</td>
                                <td className="py-2 px-4 text-muted-foreground">{row.effectiveDate}</td>
                                <td className="py-2 px-4 text-center">
                                    <span className={cn(
                                        'text-xs font-semibold',
                                        row.confidence >= 90 ? 'text-green-500' :
                                            row.confidence >= 80 ? 'text-risk' : 'text-error'
                                    )}>
                                        {row.confidence > 0 ? `${row.confidence}%` : '-'}
                                    </span>
                                </td>
                                <td className="py-2 px-4 text-center">
                                    <span className={cn(
                                        'text-xs px-2 py-0.5 rounded-full',
                                        row.riskLevel === 'Low'
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                            : 'bg-risk/15 text-yellow-700 dark:text-risk'
                                    )}>
                                        {row.status === 'pending' ? '-' : row.riskLevel}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
