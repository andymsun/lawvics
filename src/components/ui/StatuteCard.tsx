'use client';

import React, { useEffect, useState } from 'react';
import { Statute, StateCode } from '@/types/statute';
import { verifyStatuteV2, VerificationResult, TrustLevel } from '@/lib/agents/auditor';
import { Shield, AlertTriangle, AlertOctagon, ExternalLink, Clock, Search } from 'lucide-react';

interface StatuteCardProps {
    statute: Statute;
}

/**
 * Trust Badge component
 */
function TrustBadge({ trustLevel, message }: { trustLevel: TrustLevel; message: string }) {
    const badges: Record<TrustLevel, { icon: React.ReactNode; className: string; label: string }> = {
        verified: {
            icon: <Shield className="w-4 h-4" />,
            className: 'bg-green-100 text-green-800 border-green-200',
            label: 'Verified',
        },
        unverified: {
            icon: <AlertTriangle className="w-4 h-4" />,
            className: 'bg-risk/15 text-yellow-800 border-risk/30 dark:text-risk',
            label: 'Unverified',
        },
        suspicious: {
            icon: <AlertOctagon className="w-4 h-4" />,
            className: 'bg-error/15 text-error border-error/30',
            label: 'Suspicious',
        },
    };

    const badge = badges[trustLevel];

    return (
        <div
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${badge.className}`}
            title={message}
        >
            {badge.icon}
            <span>{badge.label}</span>
        </div>
    );
}

/**
 * Statute Card component showing statute details with verification badge
 */
export default function StatuteCard({ statute }: StatuteCardProps) {
    const [verification, setVerification] = useState<VerificationResult | null>(null);
    const [isVerifying, setIsVerifying] = useState(true);

    // Run verification after mount (non-blocking)
    useEffect(() => {
        let cancelled = false;

        async function runVerification() {
            setIsVerifying(true);
            try {
                const result = await verifyStatuteV2(statute);
                if (!cancelled) {
                    setVerification(result);
                }
            } catch (error) {
                console.error('Verification failed:', error);
            } finally {
                if (!cancelled) {
                    setIsVerifying(false);
                }
            }
        }

        runVerification();

        return () => {
            cancelled = true;
        };
    }, [statute]);

    return (
        <div className="bg-background rounded-xl shadow-lg border border-border overflow-hidden max-w-lg w-full">
            {/* Header */}
            <div className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">{statute.stateCode}</span>
                        <span className="text-sm opacity-80">Statute Details</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                {/* Trust Badge */}
                <div className="flex items-center justify-between">
                    {isVerifying ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4 animate-spin" />
                            <span>Verifying...</span>
                        </div>
                    ) : verification ? (
                        <TrustBadge trustLevel={verification.trustLevel} message={verification.message} />
                    ) : null}
                    <div className="text-xs text-muted-foreground">
                        Confidence: <span className="font-semibold">{statute.confidenceScore}%</span>
                    </div>
                </div>

                {/* Verification Message */}
                {verification && (
                    <div
                        className={`text-sm p-2 rounded ${verification.trustLevel === 'verified'
                            ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                            : verification.trustLevel === 'unverified'
                                ? 'bg-risk/10 text-yellow-700 dark:text-risk'
                                : 'bg-error/10 text-error'
                            }`}
                    >
                        {verification.message}
                    </div>
                )}

                {/* Citation */}
                <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        Citation
                    </h4>
                    <p className="text-sm font-mono bg-muted p-2 rounded text-foreground">{statute.citation}</p>
                </div>

                {/* Text Snippet */}
                <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        Excerpt
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{statute.textSnippet}</p>
                </div>

                {/* Effective Date */}
                <div className="flex items-center gap-4 text-sm">
                    <div>
                        <span className="text-muted-foreground">Effective: </span>
                        <span className="font-medium text-foreground">{statute.effectiveDate}</span>
                    </div>
                </div>

                {/* Source Links */}
                <div className="flex flex-col gap-2">
                    <a
                        href={statute.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                    >
                        <ExternalLink className="w-4 h-4" />
                        View Official Source
                    </a>
                    {statute.googleSearchUrl && (
                        <a
                            href={statute.googleSearchUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <Search className="w-4 h-4" />
                            Search Google for Citation
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}
