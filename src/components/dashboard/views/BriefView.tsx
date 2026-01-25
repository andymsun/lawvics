'use client';

import React, { useMemo, useState } from 'react';
import { useSurveyHistoryStore, useShallow, StatuteEntry } from '@/lib/store';
import { useSettingsStore } from '@/lib/store';
import { US_STATES } from '@/lib/constants/states';
import { StateCode, Statute } from '@/types/statute';
import { FileText, Loader2, RefreshCw, CheckCircle, AlertTriangle, XCircle, Clock, Download, ChevronDown, FileJson, FileType } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isDemoQuery } from '@/lib/agents/orchestrator';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, BorderStyle, WidthType, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

// Pre-generated demo summaries for demo queries (no API call needed)
const DEMO_SUMMARIES: Record<string, string> = {
    adverse_possession: `## Executive Summary: Adverse Possession Laws

**Legal Landscape Overview**
Of the 50 U.S. states surveyed, 48 states have codified adverse possession statutes with specific time requirements. The majority approach (approximately 60% of states) requires between 10-20 years of continuous adverse possession. The minority approach includes states with shorter periods (5-7 years with color of title or payment of taxes) and outliers like New Jersey requiring up to 60 years for woodland tracts.

**Key Findings & Notable Variations**
• **Shortest Period**: Montana and California allow claims after just 5 years with payment of taxes and color of title
• **Longest Period**: New Jersey requires 30 years (60 for woodlands)—the strictest in the nation
• **Tax Payment Requirement**: Approximately 35% of states require proof of property tax payment during the possession period
• **Color of Title**: Many states offer reduced timeframes (often 7-10 years) when claimant possesses under "color of title"

**Compliance Recommendations**
For multi-state property portfolios, organizations should implement monitoring systems for potential adverse claims. The safest approach is to follow the strictest applicable state standard (New Jersey's 30-year rule as baseline) and conduct regular property inspections at intervals shorter than the shortest applicable statute (every 4 years to account for California/Montana).`,

    fraud_sol: `## Executive Summary: Civil Fraud Statutes of Limitations

**Legal Landscape Overview**
All 50 states have enacted civil fraud statutes of limitations, with the majority (approximately 65%) adopting a 3-6 year discovery-based limitation period. The discovery rule applies in most jurisdictions, meaning the clock begins when the fraud is discovered or reasonably should have been discovered. Louisiana stands as the only 1-year statute of limitations state—the shortest in the nation.

**Key Findings & Notable Variations**
• **Shortest Period**: Louisiana requires claims within 1 year of discovery
• **Longest Period**: Several states (MI, MN, NJ, WI) allow 6 years from discovery
• **Discovery Rule**: Universally applied—time runs from when fraud was or should have been discovered
• **Absolute Bars**: Some states (Florida) impose maximum outer limits (e.g., 12 years) regardless of discovery date

**Compliance Recommendations**
Entities conducting business across multiple states should assume a 1-year limitation period (Louisiana standard) for internal compliance protocols. Document retention policies should extend beyond the longest applicable period (6 years + buffer). For multi-state fraud disputes, forum selection becomes critical—plaintiffs should evaluate states with longer periods and defendant-friendly discovery rules.`,

    gta_threshold: `## Executive Summary: Felony Theft Thresholds

**Legal Landscape Overview**
All 50 states distinguish between misdemeanor and felony theft based on property value thresholds. The national average threshold is approximately $1,500, though significant variation exists. Recent legislative trends (2022-2025) show movement toward higher thresholds to account for inflation, with 12 states having raised their thresholds in the past 3 years.

**Key Findings & Notable Variations**
• **Lowest Threshold**: New Jersey ($200) and Virginia ($500)—the strictest in the nation
• **Highest Threshold**: Texas ($2,500) and Colorado ($2,000)
• **Motor Vehicle Exception**: Most states classify motor vehicle theft as automatic felony regardless of value
• **Recent Trends**: 12 states raised thresholds since 2022, average increase of $500

**Compliance Recommendations**
Retailers and businesses with multi-state operations should train loss prevention teams on state-specific thresholds. For prosecution strategy, understand that the same theft amount may be a misdemeanor in one state and felony in another. Asset protection policies should be calibrated to the lowest applicable threshold ($200 in NJ) when operating across jurisdictions.`,
};

// Normalize query to demo type for summary lookup
function getDemoSummaryType(query: string): string | null {
    const ql = query.toLowerCase();
    if (ql.includes('adverse possession')) return 'adverse_possession';
    if (ql.includes('fraud') && (ql.includes('statute of limitations') || ql.includes('sol') || ql.includes('time limit'))) return 'fraud_sol';
    if ((ql.includes('theft') || ql.includes('larceny') || ql.includes('stealing') || ql.includes('grand theft')) &&
        (ql.includes('grand') || ql.includes('felony') || ql.includes('threshold'))) return 'gta_threshold';
    return null;
}

// Region groupings
const REGIONS: Record<string, StateCode[]> = {
    Northeast: ['CT', 'DE', 'MA', 'MD', 'ME', 'NH', 'NJ', 'NY', 'PA', 'RI', 'VT'],
    Southeast: ['AL', 'FL', 'GA', 'KY', 'NC', 'SC', 'TN', 'VA', 'WV'],
    Midwest: ['IA', 'IL', 'IN', 'KS', 'MI', 'MN', 'MO', 'ND', 'NE', 'OH', 'SD', 'WI'],
    Southwest: ['AZ', 'NM', 'OK', 'TX'],
    West: ['AK', 'CA', 'CO', 'HI', 'ID', 'MT', 'NV', 'OR', 'UT', 'WA', 'WY', 'AR', 'LA', 'MS'],
};

interface BriefData {
    query: string;
    date: string;
    verifiedCount: number;
    unverifiedCount: number;
    errorCount: number;
    pendingCount: number;
    avgConfidence: number;
    regionBreakdown: { region: string; count: number; total: number }[];
    stateDetails: { code: StateCode; name: string; status: 'verified' | 'unverified' | 'error' | 'pending'; citation?: string; snippet?: string }[];
}

export default function BriefView() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const activeSession = useSurveyHistoryStore(
        useShallow((state) => state.surveys.find((s) => s.id === state.activeSurveyId))
    );
    const setBriefSummary = useSurveyHistoryStore((state) => state.setBriefSummary);

    const settings = useSettingsStore();

    // Use stored summary from session, not local state
    const storedSummary = activeSession?.briefSummary ?? null;

    const statutes = useMemo<Partial<Record<StateCode, StatuteEntry>>>(() =>
        activeSession?.statutes ?? {},
        [activeSession?.statutes]
    );

    // Compute brief data
    const briefData = useMemo<BriefData | null>(() => {
        if (!activeSession) return null;

        let verifiedCount = 0;
        let unverifiedCount = 0;
        let errorCount = 0;
        let totalConfidence = 0;
        let confidenceCount = 0;

        const stateDetails: BriefData['stateDetails'] = [];

        US_STATES.forEach((usState) => {
            const code = usState.code;
            const name = usState.name;
            const entry = statutes[code];

            if (!entry) {
                stateDetails.push({ code, name, status: 'pending' });
            } else if (entry instanceof Error) {
                errorCount++;
                stateDetails.push({ code, name, status: 'error' });
            } else {
                const isUnverified = entry.trustLevel === 'suspicious' || entry.trustLevel === 'unverified' || entry.confidenceScore < 70;
                if (isUnverified) {
                    unverifiedCount++;
                    stateDetails.push({
                        code,
                        name,
                        status: 'unverified',
                        citation: entry.citation,
                        snippet: entry.textSnippet?.slice(0, 150)
                    });
                } else {
                    verifiedCount++;
                    stateDetails.push({
                        code,
                        name,
                        status: 'verified',
                        citation: entry.citation,
                        snippet: entry.textSnippet?.slice(0, 150)
                    });
                }
                totalConfidence += entry.confidenceScore;
                confidenceCount++;
            }
        });

        const pendingCount = 50 - verifiedCount - unverifiedCount - errorCount;

        const regionBreakdown = Object.entries(REGIONS).map(([region, codes]) => {
            let count = 0;
            codes.forEach((code) => {
                const entry = statutes[code];
                if (entry && !(entry instanceof Error)) count++;
            });
            return { region, count, total: codes.length };
        });

        return {
            query: activeSession.query,
            date: new Date(activeSession.startedAt).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
            }),
            verifiedCount,
            unverifiedCount,
            errorCount,
            pendingCount,
            avgConfidence: confidenceCount > 0 ? Math.round(totalConfidence / confidenceCount) : 0,
            regionBreakdown,
            stateDetails: stateDetails.sort((a, b) => a.name.localeCompare(b.name)),
        };
    }, [activeSession, statutes]);

    // Generate AI summary and store it
    const generateSummary = async () => {
        if (!briefData || !activeSession) return;

        setIsGenerating(true);
        setError(null);

        try {
            // 1. Check for demo query - return pre-generated summary immediately
            const demoType = getDemoSummaryType(briefData.query);
            if (isDemoQuery(briefData.query) && demoType && DEMO_SUMMARIES[demoType]) {
                // Simulate brief loading delay for UX
                await new Promise(resolve => setTimeout(resolve, 800));
                setBriefSummary(activeSession.id, DEMO_SUMMARIES[demoType]);
                setIsGenerating(false);
                return;
            }

            // 2. Prepare API call for real queries
            const validStatutes = Object.values(statutes)
                .filter((s): s is Statute => s !== undefined && !(s instanceof Error))
                .map(s => `[${s.stateCode}] ${s.citation}: ${s.textSnippet?.slice(0, 300) || 'No text'}`)
                .slice(0, 15); // Limit for token efficiency

            // 3. Determine provider/model based on data source
            const isSystemApi = settings.dataSource === 'system-api';
            const effectiveProvider = isSystemApi ? 'openrouter' : settings.activeAiProvider;
            const effectiveModel = isSystemApi
                ? 'openai/gpt-4o-mini'
                : (settings.activeAiProvider === 'openai'
                    ? settings.openaiModel
                    : settings.activeAiProvider === 'gemini'
                        ? settings.geminiModel
                        : settings.openRouterModel);

            const response = await fetch('/api/statute/brief', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-data-source': settings.dataSource,
                },
                body: JSON.stringify({
                    query: briefData.query,
                    statutes: validStatutes,
                    metadata: {
                        verified: briefData.verifiedCount,
                        unverified: briefData.unverifiedCount,
                        errors: briefData.errorCount,
                        avgConfidence: briefData.avgConfidence,
                    },
                    dataSource: settings.dataSource,
                    provider: effectiveProvider,
                    model: effectiveModel,
                    // For system-api: send override key if user has one set
                    // For other modes: send all keys
                    openaiApiKey: isSystemApi ? undefined : settings.openaiApiKey,
                    geminiApiKey: isSystemApi ? undefined : settings.geminiApiKey,
                    openRouterApiKey: settings.openRouterApiKey, // Always send as potential override
                }),
            });

            const data = await response.json();

            if (data.success) {
                setBriefSummary(activeSession.id, data.summary);
            } else {
                setError(data.error || 'Failed to generate summary');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Network error');
        } finally {
            setIsGenerating(false);
        }
    };

    // Auto-generate summary when survey completes and no summary exists
    const canGenerateSummary = activeSession?.status === 'completed';

    React.useEffect(() => {
        if (canGenerateSummary && !storedSummary && !isGenerating && briefData) {
            generateSummary();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeSession?.status, activeSession?.id, storedSummary]);

    // Export brief logic
    const handleExport = async (format: 'pdf' | 'docx' | 'markdown') => {
        if (!briefData) return;
        const filename = `lawvics-brief-${briefData.query.toLowerCase().replace(/\s+/g, '-').slice(0, 30)}-${new Date().toISOString().split('T')[0]}`;

        if (format === 'markdown') {
            const lines: string[] = [];
            lines.push(`# 50-State Survey Brief`);
            lines.push(``);
            lines.push(`**Research Topic:** ${briefData.query}`);
            lines.push(`**Date:** ${briefData.date}`);
            lines.push(``);
            lines.push(`## Survey Metrics`);
            lines.push(``);
            lines.push(`| Metric | Value |`);
            lines.push(`|--------|-------|`);
            lines.push(`| Verified | ${briefData.verifiedCount} |`);
            lines.push(`| Unverified | ${briefData.unverifiedCount} |`);
            lines.push(`| Errors | ${briefData.errorCount} |`);
            lines.push(`| Pending | ${briefData.pendingCount} |`);
            lines.push(`| Average Confidence | ${briefData.avgConfidence}% |`);
            lines.push(``);

            if (storedSummary) {
                lines.push(`## Executive Summary`);
                lines.push(``);
                lines.push(storedSummary);
                lines.push(``);
            }

            lines.push(`## Regional Coverage`);
            lines.push(``);
            lines.push(`| Region | Coverage |`);
            lines.push(`|--------|----------|`);
            briefData.regionBreakdown.forEach(({ region, count, total }) => {
                lines.push(`| ${region} | ${count}/${total} |`);
            });
            lines.push(``);

            lines.push(`## State-by-State Results`);
            lines.push(``);
            lines.push(`| State | Status | Citation | Snippet |`);
            lines.push(`|-------|--------|----------|---------|`);
            briefData.stateDetails.forEach((state) => {
                const citation = state.citation || '—';
                const snippet = state.snippet?.replace(/\|/g, '\\|').replace(/\n/g, ' ') || '—';
                lines.push(`| ${state.name} | ${state.status} | ${citation} | ${snippet} |`);
            });
            lines.push(``);
            lines.push(`---`);
            lines.push(`*Generated by Lawvics • ${new Date().toLocaleString()}*`);

            const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
            saveAs(blob, `${filename}.md`);
        }
        else if (format === 'pdf') {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;
            const margin = 20;

            // Title
            doc.setFontSize(22);
            doc.text('50-State Survey Brief', margin, 20);

            doc.setFontSize(12);
            doc.text(`Topic: ${briefData.query}`, margin, 30);
            doc.text(`Date: ${briefData.date}`, margin, 36);

            // Metrics Box
            doc.setDrawColor(220);
            doc.setFillColor(250, 250, 250);
            doc.rect(margin, 45, pageWidth - (margin * 2), 25, 'FD');

            doc.setFontSize(10);
            const metricY = 55;
            const colWidth = (pageWidth - (margin * 2)) / 5;

            ['Verified', 'Unverified', 'Errors', 'Pending', 'Confidence'].forEach((label, i) => {
                doc.text(label, margin + (colWidth * i) + 5, metricY);
                const val = i === 0 ? briefData.verifiedCount :
                    i === 1 ? briefData.unverifiedCount :
                        i === 2 ? briefData.errorCount :
                            i === 3 ? briefData.pendingCount :
                                `${briefData.avgConfidence}%`;
                doc.setFont('helvetica', 'bold');
                doc.text(String(val), margin + (colWidth * i) + 5, metricY + 6);
                doc.setFont('helvetica', 'normal');
            });

            let y = 80;

            // Summary
            if (storedSummary) {
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('Executive Summary', margin, y);
                y += 8;

                doc.setFontSize(11);
                doc.setFont('helvetica', 'normal');

                // Simple markdown cleanup
                const cleanSummary = storedSummary
                    .replace(/## /g, '')
                    .replace(/\*\*/g, '')
                    .replace(/•/g, '-');

                const summaryLines = doc.splitTextToSize(cleanSummary, pageWidth - (margin * 2));
                doc.text(summaryLines, margin, y);
                y += (summaryLines.length * 5) + 15;
            }

            // Results Table Header
            if (y > 250) { doc.addPage(); y = 20; }

            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('State Results', margin, y);
            y += 10;

            doc.setFontSize(10);
            briefData.stateDetails.forEach((state) => {
                if (y > 270) { doc.addPage(); y = 20; }

                doc.setFont('helvetica', 'bold');
                doc.text(state.name, margin, y);

                const statusColor = state.status === 'verified' ? [34, 197, 94] :
                    state.status === 'error' ? [239, 68, 68] : [234, 179, 8];
                doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
                doc.text(state.status.toUpperCase(), margin + 40, y);
                doc.setTextColor(0);

                doc.setFont('helvetica', 'normal');
                if (state.citation) {
                    doc.text(state.citation, margin + 80, y);
                }

                y += 5;
                if (state.snippet) {
                    doc.setFontSize(9);
                    doc.setTextColor(100);
                    const snippet = state.snippet.replace(/\n/g, ' ').slice(0, 160) + '...';
                    const lines = doc.splitTextToSize(snippet, pageWidth - (margin * 2) - 10);
                    doc.text(lines, margin + 5, y);
                    doc.setTextColor(0);
                    doc.setFontSize(10);
                    y += (lines.length * 4) + 6;
                } else {
                    y += 6;
                }
            });

            doc.save(`${filename}.pdf`);
        }
        else if (format === 'docx') {
            const children: (Paragraph | Table)[] = [
                new Paragraph({
                    text: "50-State Survey Brief",
                    heading: HeadingLevel.TITLE,
                    spacing: { after: 200 }
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "Research Topic: ", bold: true }),
                        new TextRun(briefData.query),
                    ]
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "Date: ", bold: true }),
                        new TextRun(briefData.date),
                    ],
                    spacing: { after: 300 }
                }),
            ];

            // Metrics Table
            const metricParams = {
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                    top: { style: BorderStyle.SINGLE, size: 1 },
                    bottom: { style: BorderStyle.SINGLE, size: 1 },
                    left: { style: BorderStyle.NONE, size: 0 },
                    right: { style: BorderStyle.NONE, size: 0 },
                    insideVertical: { style: BorderStyle.NONE, size: 0 },
                    insideHorizontal: { style: BorderStyle.NONE, size: 0 },
                }
            };

            children.push(new Table({
                ...metricParams,
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph("Verified")] }),
                            new TableCell({ children: [new Paragraph("Unverified")] }),
                            new TableCell({ children: [new Paragraph("Errors")] }),
                            new TableCell({ children: [new Paragraph("Pending")] }),
                            new TableCell({ children: [new Paragraph("Confidence")] }),
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(briefData.verifiedCount), bold: true })] })] }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(briefData.unverifiedCount), bold: true })] })] }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(briefData.errorCount), bold: true })] })] }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(briefData.pendingCount), bold: true })] })] }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${briefData.avgConfidence}%`, bold: true })] })] }),
                        ]
                    })
                ]
            }));

            children.push(new Paragraph({ text: "", spacing: { after: 300 } }));

            // Executive Summary
            if (storedSummary) {
                children.push(new Paragraph({
                    text: "Executive Summary",
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 200, after: 100 }
                }));

                const summaryLines = storedSummary.split('\n');
                summaryLines.forEach(line => {
                    if (line.trim()) {
                        const cleanLine = line.replace(/\*\*/g, '').replace(/## /g, '');
                        children.push(new Paragraph({
                            text: cleanLine,
                            spacing: { after: 100 }
                        }));
                    }
                });
            }

            // State Results
            children.push(new Paragraph({
                text: "State-by-State Results",
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 400, after: 200 }
            }));

            // Results Table
            const resultRows = briefData.stateDetails.map(state =>
                new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: state.name, bold: true })] })] }),
                        new TableCell({ children: [new Paragraph(state.status.toUpperCase())] }),
                        new TableCell({ children: [new Paragraph(state.citation || "")] }),
                        new TableCell({ children: [new Paragraph(state.snippet || "")] }),
                    ]
                })
            );

            children.push(new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    new TableRow({
                        tableHeader: true,
                        children: [
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "State", bold: true })] })] }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Status", bold: true })] })] }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Citation", bold: true })] })] }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Snippet", bold: true })] })] }),
                        ]
                    }),
                    ...resultRows
                ]
            }));

            const doc = new Document({
                sections: [{ children: children }]
            });

            const blob = await Packer.toBlob(doc);
            saveAs(blob, `${filename}.docx`);
        }
    };

    const [isExportOpen, setIsExportOpen] = useState(false);
    const exportRef = React.useRef<HTMLDivElement>(null);

    // Close export dropdown on click outside
    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
                setIsExportOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Empty state
    if (!activeSession || !briefData) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                <FileText className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <h2 className="text-lg font-semibold text-foreground mb-2">No Active Survey</h2>
                <p className="text-sm text-muted-foreground max-w-md">
                    Run a 50-state survey to generate a comprehensive legal brief.
                    Start by entering a search query on the Geospatial view.
                </p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col p-6 overflow-auto">
            {/* Header */}
            <div className="flex-shrink-0 mb-6 flex items-start justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">50-State Survey Brief</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Research Topic: <span className="font-medium text-foreground">{briefData.query}</span>
                    </p>
                </div>
                <div className="flex items-center gap-2" ref={exportRef}>
                    <div className="relative">
                        <button
                            onClick={() => setIsExportOpen(!isExportOpen)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                "bg-muted text-foreground hover:bg-muted/80 border border-border"
                            )}
                        >
                            <Download className="w-4 h-4" />
                            Export
                            <ChevronDown className={cn("w-3 h-3 transition-transform", isExportOpen && "rotate-180")} />
                        </button>

                        {isExportOpen && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                                <button
                                    onClick={() => { handleExport('pdf'); setIsExportOpen(false); }}
                                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-muted transition-colors text-left"
                                >
                                    <FileText className="w-4 h-4 text-red-500" />
                                    <span>Export as PDF</span>
                                </button>
                                <button
                                    onClick={() => { handleExport('docx'); setIsExportOpen(false); }}
                                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-muted transition-colors text-left"
                                >
                                    <FileText className="w-4 h-4 text-blue-600" />
                                    <span>Export as Word</span>
                                </button>
                                <button
                                    onClick={() => { handleExport('markdown'); setIsExportOpen(false); }}
                                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-muted transition-colors text-left"
                                >
                                    <FileJson className="w-4 h-4 text-foreground" />
                                    <span>Export as Markdown</span>
                                </button>
                            </div>
                        )}
                    </div>
                    {/* Only show generate button if survey is completed, no summary exists, and not generating */}
                    {canGenerateSummary && !storedSummary && (
                        <button
                            onClick={generateSummary}
                            disabled={isGenerating}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                "bg-primary text-primary-foreground hover:bg-primary/90",
                                "disabled:opacity-50 disabled:cursor-not-allowed"
                            )}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="w-4 h-4" />
                                    Generate AI Summary
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Metadata Bar */}
            <div className="flex-shrink-0 grid grid-cols-5 gap-3 mb-6">
                <MetricCard
                    icon={CheckCircle}
                    label="Verified"
                    value={briefData.verifiedCount}
                    color="text-green-500"
                />
                <MetricCard
                    icon={AlertTriangle}
                    label="Unverified"
                    value={briefData.unverifiedCount}
                    color="text-risk"
                />
                <MetricCard
                    icon={XCircle}
                    label="Errors"
                    value={briefData.errorCount}
                    color="text-error"
                />
                <MetricCard
                    icon={Clock}
                    label="Pending"
                    value={briefData.pendingCount}
                    color="text-muted-foreground"
                />
                <div className="p-3 rounded-lg bg-card border border-border">
                    <div className="text-xs text-muted-foreground mb-1">Avg Confidence</div>
                    <div className="text-xl font-bold text-primary">{briefData.avgConfidence}%</div>
                </div>
            </div>

            {/* AI Summary Section */}
            {(storedSummary || error || isGenerating) && (
                <div className="flex-shrink-0 mb-6 p-4 rounded-lg bg-card border border-border">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Executive Summary
                    </h3>
                    {isGenerating ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Generating executive summary...
                        </div>
                    ) : error ? (
                        <div className="flex items-center gap-3">
                            <p className="text-sm text-error flex-1">{error}</p>
                            <button
                                onClick={generateSummary}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium bg-error/10 text-error hover:bg-error/20 transition-colors"
                            >
                                <RefreshCw className="w-3 h-3" />
                                Retry
                            </button>
                        </div>
                    ) : (
                        <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed max-h-[500px] overflow-y-auto">
                            <ReactMarkdown
                                remarkPlugins={[remarkBreaks]}
                                components={{
                                    h2: ({ children }) => <h2 className="text-lg font-semibold text-foreground mt-4 mb-2 first:mt-0">{children}</h2>,
                                    h3: ({ children }) => <h3 className="text-base font-semibold text-foreground mt-3 mb-1">{children}</h3>,
                                    strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                                    em: ({ children }) => <em className="italic text-muted-foreground">{children}</em>,
                                    ul: ({ children }) => <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>,
                                    li: ({ children }) => <li className="text-muted-foreground">{children}</li>,
                                    p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                                }}
                            >
                                {storedSummary || ''}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>
            )}

            {/* Regional Coverage */}
            <div className="flex-shrink-0 mb-6 p-4 rounded-lg bg-card border border-border">
                <h3 className="text-sm font-semibold mb-3">Regional Coverage</h3>
                <div className="grid grid-cols-5 gap-3">
                    {briefData.regionBreakdown.map(({ region, count, total }) => (
                        <div key={region} className="text-center">
                            <div className="text-lg font-bold">{count}/{total}</div>
                            <div className="text-xs text-muted-foreground">{region}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* State-by-State Table */}
            <div className="flex-1 min-h-[300px] p-4 rounded-lg bg-card border border-border overflow-auto">
                <h3 className="text-sm font-semibold mb-3">State-by-State Results</h3>
                <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-card">
                        <tr className="border-b border-border">
                            <th className="text-left py-2 px-2 font-medium text-muted-foreground">State</th>
                            <th className="text-left py-2 px-2 font-medium text-muted-foreground">Status</th>
                            <th className="text-left py-2 px-2 font-medium text-muted-foreground">Citation</th>
                            <th className="text-left py-2 px-2 font-medium text-muted-foreground">Snippet</th>
                        </tr>
                    </thead>
                    <tbody>
                        {briefData.stateDetails.map((state) => (
                            <tr key={state.code} className="border-b border-border/50 hover:bg-muted/30">
                                <td className="py-2 px-2 font-medium">{state.name}</td>
                                <td className="py-2 px-2">
                                    <StatusBadge status={state.status} />
                                </td>
                                <td className="py-2 px-2 text-muted-foreground font-mono text-xs">
                                    {state.citation || '—'}
                                </td>
                                <td className="py-2 px-2 text-muted-foreground text-xs max-w-xs truncate">
                                    {state.snippet || '—'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 mt-4 text-xs text-muted-foreground text-center">
                Survey completed: {briefData.date} • Data subject to verification
            </div>
        </div>
    );
}

function MetricCard({ icon: Icon, label, value, color }: {
    icon: React.ElementType;
    label: string;
    value: number;
    color: string;
}) {
    return (
        <div className="p-3 rounded-lg bg-card border border-border">
            <div className={cn("flex items-center gap-1.5 text-xs mb-1", color)}>
                <Icon className="w-3.5 h-3.5" />
                <span className="text-muted-foreground">{label}</span>
            </div>
            <div className={cn("text-xl font-bold", color)}>{value}</div>
        </div>
    );
}

function StatusBadge({ status }: { status: 'verified' | 'unverified' | 'error' | 'pending' }) {
    const config = {
        verified: { label: 'Verified', class: 'bg-green-500/10 text-green-500 border-green-500/20' },
        unverified: { label: 'Unverified', class: 'bg-risk/10 text-risk border-risk/20' },
        error: { label: 'Error', class: 'bg-error/10 text-error border-error/20' },
        pending: { label: 'Pending', class: 'bg-muted text-muted-foreground border-border' },
    };
    const { label, class: cls } = config[status];
    return (
        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium border", cls)}>
            {label}
        </span>
    );
}
