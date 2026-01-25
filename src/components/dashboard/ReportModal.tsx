'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, AlertTriangle, AlertOctagon, Copy, Check, ArrowUpDown, Clock } from 'lucide-react';
import { useStatuteStore } from '@/lib/store';
import { StateCode, Statute } from '@/types/statute';
import { US_STATES } from '@/lib/constants/states';

type SortKey = 'state' | 'status' | 'citation' | 'date';
type SortDirection = 'asc' | 'desc';
type Status = 'success' | 'error' | 'pending';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

function getStatus(entry: Statute | Error | undefined): Status {
    if (!entry) return 'pending';
    if (entry instanceof Error) return 'error';
    return 'success';
}

function StatusIcon({ status }: { status: Status }) {
    switch (status) {
        case 'success':
            return <ShieldCheck className="w-4 h-4 text-green-500" />;
        case 'error':
            return <AlertOctagon className="w-4 h-4 text-error" />;
        case 'pending':
            return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
}

export default function ReportModal({ isOpen, onClose }: ReportModalProps) {
    const statutes = useStatuteStore((state) => state.statutes);
    const [sortKey, setSortKey] = useState<SortKey>('status');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [copied, setCopied] = useState(false);

    // Build table data
    const tableData = useMemo(() => {
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
                sourceUrl: statute?.sourceUrl || null,
            };
        });
    }, [statutes]);

    // Sort data
    const sortedData = useMemo(() => {
        const sorted = [...tableData].sort((a, b) => {
            let comparison = 0;

            switch (sortKey) {
                case 'state':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'status':
                    const statusOrder = { error: 0, pending: 1, success: 2 };
                    comparison = statusOrder[a.status] - statusOrder[b.status];
                    break;
                case 'citation':
                    comparison = a.citation.localeCompare(b.citation);
                    break;
                case 'date':
                    comparison = a.effectiveDate.localeCompare(b.effectiveDate);
                    break;
            }

            return sortDirection === 'asc' ? comparison : -comparison;
        });

        return sorted;
    }, [tableData, sortKey, sortDirection]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('desc');
        }
    };

    const generateMarkdown = () => {
        const headers = '| State | Status | Citation | Effective Date |';
        const separator = '|-------|--------|----------|----------------|';
        const rows = sortedData.map((row) => {
            const statusText =
                row.status === 'success' ? '✓ Verified' : row.status === 'error' ? '✗ Error' : '○ Pending';
            return `| ${row.name} | ${statusText} | ${row.citation} | ${row.effectiveDate} |`;
        });

        return [headers, separator, ...rows].join('\n');
    };

    const handleCopy = async () => {
        const markdown = generateMarkdown();
        await navigator.clipboard.writeText(markdown);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const successCount = tableData.filter((r) => r.status === 'success').length;
    const errorCount = tableData.filter((r) => r.status === 'error').length;
    const pendingCount = tableData.filter((r) => r.status === 'pending').length;

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
                        className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-4xl md:max-h-[85vh] bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex-shrink-0 p-6 border-b border-border">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-foreground tracking-tight">
                                        50-State Survey Report
                                    </h2>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <ShieldCheck className="w-4 h-4 text-green-500" />
                                            {successCount} Verified
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <AlertOctagon className="w-4 h-4 text-error" />
                                            {errorCount} Errors
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            {pendingCount} Pending
                                        </span>
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

                        {/* Table */}
                        <div className="flex-1 overflow-auto p-6">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-card">
                                    <tr className="border-b border-border">
                                        <th
                                            className="text-left py-3 px-4 font-semibold text-muted-foreground cursor-pointer hover:text-foreground"
                                            onClick={() => handleSort('state')}
                                        >
                                            <span className="flex items-center gap-1">
                                                State
                                                {sortKey === 'state' && <ArrowUpDown className="w-3 h-3" />}
                                            </span>
                                        </th>
                                        <th
                                            className="text-left py-3 px-4 font-semibold text-muted-foreground cursor-pointer hover:text-foreground"
                                            onClick={() => handleSort('status')}
                                        >
                                            <span className="flex items-center gap-1">
                                                Status
                                                {sortKey === 'status' && <ArrowUpDown className="w-3 h-3" />}
                                            </span>
                                        </th>
                                        <th
                                            className="text-left py-3 px-4 font-semibold text-muted-foreground cursor-pointer hover:text-foreground"
                                            onClick={() => handleSort('citation')}
                                        >
                                            <span className="flex items-center gap-1">
                                                Citation
                                                {sortKey === 'citation' && <ArrowUpDown className="w-3 h-3" />}
                                            </span>
                                        </th>
                                        <th
                                            className="text-left py-3 px-4 font-semibold text-muted-foreground cursor-pointer hover:text-foreground"
                                            onClick={() => handleSort('date')}
                                        >
                                            <span className="flex items-center gap-1">
                                                Effective Date
                                                {sortKey === 'date' && <ArrowUpDown className="w-3 h-3" />}
                                            </span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedData.map((row) => (
                                        <tr
                                            key={row.code}
                                            className="border-b border-border/50 hover:bg-muted/50 transition-colors"
                                        >
                                            <td className="py-3 px-4 font-medium">{row.name}</td>
                                            <td className="py-3 px-4">
                                                <StatusIcon status={row.status} />
                                            </td>
                                            <td className="py-3 px-4 font-mono text-xs">{row.citation}</td>
                                            <td className="py-3 px-4 text-muted-foreground">{row.effectiveDate}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer */}
                        <div className="flex-shrink-0 p-6 border-t border-border bg-muted/30">
                            <div className="flex justify-end">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleCopy}
                                    className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="w-4 h-4" />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4" />
                                            Copy as Markdown
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
