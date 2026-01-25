'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, File as FileIcon, X, Check, ArrowUpFromLine, Download, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/lib/store';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';

import { ExportItem } from './ExportButton';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: ExportItem[]; // The data to export
    type: 'history' | 'saved';
}

export function ExportModal({ isOpen, onClose, data }: ExportModalProps) {
    const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
    const [includeSummary, setIncludeSummary] = React.useState(true);
    const [isGenerating, setIsGenerating] = React.useState(false);

    // Reset selection when modal opens
    React.useEffect(() => {
        if (isOpen) {
            setSelectedIds([]);
            setIncludeSummary(true);
        }
    }, [isOpen]);

    const toggleSelection = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    };

    // Helper function to extract export content from an item
    // Handles both direct statutes and nested SurveyRecord statutes
    const getExportContent = (item: ExportItem): string => {
        // Direct content
        if (item.statute_text) return item.statute_text;
        if (item.textSnippet) return item.textSnippet;

        // Nested statutes from SurveyRecord
        if (item.statutes) {
            const snippets: string[] = [];
            Object.entries(item.statutes).forEach(([stateCode, entry]) => {
                if (entry && !(entry instanceof Error)) {
                    const text = entry.textSnippet || entry.citation || '';
                    if (text) {
                        snippets.push(`[${stateCode}] ${text}`);
                    }
                }
            });
            if (snippets.length > 0) {
                return snippets.join('\n\n');
            }
        }

        return 'No content available';
    };

    const generateSummary = async (items: ExportItem[]): Promise<string> => {
        try {
            const settings = useSettingsStore.getState();
            const statutesText = items.map(item => getExportContent(item)).filter(t => t.length > 0);

            // Use system-api mode if enabled
            const isSystemApi = settings.dataSource === 'system-api';

            const response = await fetch('/api/statute/summary', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-data-source': settings.dataSource,
                },
                body: JSON.stringify({
                    statutes: statutesText,
                    dataSource: settings.dataSource,
                    provider: isSystemApi ? 'openrouter' : settings.activeAiProvider,
                    model: isSystemApi ? 'openai/gpt-4o-mini' : (
                        settings.activeAiProvider === 'openai' ? settings.openaiModel :
                            settings.activeAiProvider === 'gemini' ? settings.geminiModel :
                                settings.openRouterModel
                    ),
                    openaiApiKey: isSystemApi ? undefined : settings.openaiApiKey,
                    geminiApiKey: isSystemApi ? undefined : settings.geminiApiKey,
                    openRouterApiKey: settings.openRouterApiKey, // Always send as potential override
                }),
            });

            const data = await response.json();
            if (data.success) {
                return data.summary;
            } else {
                console.error("Summary generation failed:", data.error);
                return `(Summary generation failed: ${data.error})`;
            }
        } catch (error) {
            console.error("Summary generation error:", error);
            return `(Summary generation failed)`;
        }
    };

    // Helper to render markdown-formatted text to PDF
    const renderMarkdownToPdf = (doc: jsPDF, text: string, startY: number, maxWidth: number): number => {
        let y = startY;
        const lineHeight = 7;
        const pageHeight = 280;

        // Split by lines
        const lines = text.split('\n');

        for (const line of lines) {
            // Check for page break
            if (y > pageHeight) {
                doc.addPage();
                y = 20;
            }

            // ## Heading
            if (line.startsWith('## ')) {
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                const heading = line.replace('## ', '');
                doc.text(heading, 20, y);
                y += lineHeight + 4;
                doc.setFontSize(12);
                continue;
            }

            // **Bold section header** at start of line
            if (line.startsWith('**') && line.includes('**')) {
                const match = line.match(/^\*\*(.+?)\*\*(.*)/);
                if (match) {
                    doc.setFont('helvetica', 'bold');
                    doc.text(match[1], 20, y);
                    if (match[2]) {
                        doc.setFont('helvetica', 'normal');
                        const restText = doc.splitTextToSize(match[2], maxWidth - 20);
                        const boldWidth = doc.getTextWidth(match[1]);
                        doc.text(restText[0] || '', 20 + boldWidth, y);
                        y += lineHeight;
                        for (let i = 1; i < restText.length; i++) {
                            if (y > pageHeight) { doc.addPage(); y = 20; }
                            doc.text(restText[i], 20, y);
                            y += lineHeight;
                        }
                    } else {
                        y += lineHeight;
                    }
                    continue;
                }
            }

            // Bullet points: • **Label**: Content
            if (line.startsWith('• ') || line.startsWith('- ')) {
                const bulletContent = line.replace(/^[•\-] /, '');
                const boldMatch = bulletContent.match(/^\*\*(.+?)\*\*:?\s*(.*)/);

                if (boldMatch) {
                    // Bullet with bold label
                    doc.setFont('helvetica', 'normal');
                    doc.text('•', 20, y);
                    doc.setFont('helvetica', 'bold');
                    doc.text(boldMatch[1] + ':', 28, y);
                    doc.setFont('helvetica', 'normal');
                    const labelWidth = doc.getTextWidth(boldMatch[1] + ': ');
                    const restContent = doc.splitTextToSize(boldMatch[2], maxWidth - 28 - labelWidth);
                    doc.text(restContent[0] || '', 28 + labelWidth, y);
                    y += lineHeight;
                    for (let i = 1; i < restContent.length; i++) {
                        if (y > pageHeight) { doc.addPage(); y = 20; }
                        doc.text(restContent[i], 35, y);
                        y += lineHeight;
                    }
                } else {
                    // Plain bullet
                    doc.setFont('helvetica', 'normal');
                    doc.text('•', 20, y);
                    const bulletText = doc.splitTextToSize(bulletContent, maxWidth - 15);
                    doc.text(bulletText[0] || '', 28, y);
                    y += lineHeight;
                    for (let i = 1; i < bulletText.length; i++) {
                        if (y > pageHeight) { doc.addPage(); y = 20; }
                        doc.text(bulletText[i], 28, y);
                        y += lineHeight;
                    }
                }
                continue;
            }

            // Empty line
            if (line.trim() === '') {
                y += lineHeight / 2;
                continue;
            }

            // Regular paragraph with inline bold
            doc.setFont('helvetica', 'normal');
            const parts = line.split(/(\*\*[^*]+\*\*)/);
            let xPos = 20;
            for (const part of parts) {
                if (part.startsWith('**') && part.endsWith('**')) {
                    doc.setFont('helvetica', 'bold');
                    const boldText = part.slice(2, -2);
                    doc.text(boldText, xPos, y);
                    xPos += doc.getTextWidth(boldText);
                    doc.setFont('helvetica', 'normal');
                } else if (part) {
                    const wrapped = doc.splitTextToSize(part, maxWidth - (xPos - 20));
                    doc.text(wrapped[0] || '', xPos, y);
                    if (wrapped.length > 1) {
                        y += lineHeight;
                        for (let i = 1; i < wrapped.length; i++) {
                            if (y > pageHeight) { doc.addPage(); y = 20; }
                            doc.text(wrapped[i], 20, y);
                            y += lineHeight;
                        }
                        xPos = 20;
                    } else {
                        xPos += doc.getTextWidth(wrapped[0] || '');
                    }
                }
            }
            if (xPos > 20) y += lineHeight;
        }

        return y;
    };

    const handleExport = async (format: 'pdf' | 'docx' | 'gdoc') => {
        if (selectedIds.length === 0) return;
        setIsGenerating(true);

        const selectedItems = data.filter(item => {
            const itemId = String(item.id ?? item.citation ?? '');
            return selectedIds.includes(itemId);
        });
        const timestamp = new Date().toLocaleDateString().replace(/\//g, '-');
        const filename = `lawvics_export_${timestamp}`;

        let summaryText = "";
        if (includeSummary) {
            summaryText = await generateSummary(selectedItems);
        }

        try {
            if (format === 'pdf') {
                const doc = new jsPDF();
                doc.setFontSize(20);
                doc.text('Lawvics Statute Export', 20, 20);

                let y = 40;

                // Add Summary if included (with markdown rendering)
                if (includeSummary && summaryText) {
                    y = renderMarkdownToPdf(doc, summaryText, y, 170);
                    y += 15; // Space after summary
                }

                doc.setFontSize(12);
                const pageHeight = 280; // Safe content height
                const lineHeight = 7;

                selectedItems.forEach((item, index) => {
                    // Check if we need a new page before adding title
                    if (y > pageHeight - 20) {
                        doc.addPage();
                        y = 20;
                    }

                    const title = item.query || item.citation || `Item ${index + 1}`;
                    const content = getExportContent(item);

                    doc.setFont('helvetica', 'bold');
                    doc.text(title, 20, y);
                    y += 10;

                    doc.setFont('helvetica', 'normal');
                    const splitText = doc.splitTextToSize(content, 170);

                    // Write each line individually, checking for page overflow
                    splitText.forEach((line: string) => {
                        if (y > pageHeight) {
                            doc.addPage();
                            y = 20;
                        }
                        doc.text(line, 20, y);
                        y += lineHeight;
                    });

                    y += 10; // Space between items
                });

                doc.save(`${filename}.pdf`);
            } else if (format === 'docx') {
                const children = [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "Lawvics Statute Export",
                                bold: true,
                                size: 32,
                            }),
                        ],
                    }),
                ];

                if (includeSummary && summaryText) {
                    // Parse markdown into DOCX paragraphs
                    const summaryLines = summaryText.split('\n');
                    for (const line of summaryLines) {
                        if (line.trim() === '') continue;

                        // ## Heading
                        if (line.startsWith('## ')) {
                            children.push(new Paragraph({
                                children: [new TextRun({ text: line.replace('## ', ''), bold: true, size: 28 })],
                                spacing: { before: 300, after: 100 },
                            }));
                        }
                        // **Bold section header**
                        else if (line.startsWith('**') && line.includes('**')) {
                            const match = line.match(/^\*\*(.+?)\*\*(.*)/);
                            if (match) {
                                children.push(new Paragraph({
                                    children: [
                                        new TextRun({ text: match[1], bold: true }),
                                        new TextRun({ text: match[2] || '' }),
                                    ],
                                    spacing: { before: 200, after: 100 },
                                }));
                            }
                        }
                        // Bullet points
                        else if (line.startsWith('• ') || line.startsWith('- ')) {
                            const bulletContent = line.replace(/^[•\-] /, '');
                            const boldMatch = bulletContent.match(/^\*\*(.+?)\*\*:?\s*(.*)/);
                            if (boldMatch) {
                                children.push(new Paragraph({
                                    bullet: { level: 0 },
                                    children: [
                                        new TextRun({ text: boldMatch[1] + ': ', bold: true }),
                                        new TextRun({ text: boldMatch[2] || '' }),
                                    ],
                                }));
                            } else {
                                children.push(new Paragraph({
                                    bullet: { level: 0 },
                                    children: [new TextRun({ text: bulletContent })],
                                }));
                            }
                        }
                        // Regular paragraph
                        else {
                            children.push(new Paragraph({
                                children: [new TextRun({ text: line })],
                            }));
                        }
                    }

                    // Separator after summary
                    children.push(new Paragraph({ children: [], spacing: { before: 300 } }));
                }

                children.push(...selectedItems.flatMap(item => [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: item.query || item.citation || "Statute",
                                bold: true,
                                size: 24,
                            }),
                        ],
                        spacing: { before: 400 },
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: getExportContent(item),
                            }),
                        ],
                    }),
                ]));

                const doc = new Document({
                    sections: [{
                        properties: {},
                        children: children,
                    }],
                });

                const blob = await Packer.toBlob(doc);
                saveAs(blob, `${filename}.docx`);
            } else if (format === 'gdoc') {
                const textParts = [];
                if (includeSummary) {
                    textParts.push(summaryText);
                }
                textParts.push(...selectedItems.map(item =>
                    `${item.query || item.citation}\n\n${getExportContent(item)}`
                ));

                const text = textParts.join('\n\n---\n\n');

                await navigator.clipboard.writeText(text);
                alert("Content copied to clipboard! You can paste this into a Google Doc.");
            }
        } catch (error) {
            console.error("Export failed:", error);
        } finally {
            setIsGenerating(false);
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 dark:bg-black/60 backdrop-blur-[2px]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
                    >
                        <div className="w-full max-w-2xl bg-background border border-border rounded-xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col max-h-[80vh]">
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                                <div>
                                    <h2 className="text-xl font-semibold">Export Selection</h2>
                                    <p className="text-sm text-muted-foreground">
                                        Select items to generate a summary and export.
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-full hover:bg-muted transition-colors"
                                >
                                    <X className="w-5 h-5 text-muted-foreground" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {/* AI Summary Section */}
                                <div
                                    onClick={() => setIncludeSummary(!includeSummary)}
                                    className={cn(
                                        "p-4 rounded-lg border cursor-pointer transition-all",
                                        includeSummary
                                            ? "bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30"
                                            : "bg-muted/30 border-border opacity-70 hover:opacity-100"
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h3 className={cn(
                                                "text-sm font-semibold mb-2 flex items-center gap-2",
                                                includeSummary ? "text-blue-700 dark:text-blue-400" : "text-muted-foreground"
                                            )}>
                                                {includeSummary && !isGenerating && <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
                                                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin text-blue-500" /> : null}
                                                AI Summary Overview
                                            </h3>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                {selectedIds.length > 0
                                                    ? `Generate ${includeSummary ? 'and include' : '(excluded)'} overview for ${selectedIds.length} selected items.`
                                                    : "Select items below to enable summary generation."
                                                }
                                            </p>
                                        </div>
                                        <div className={cn(
                                            "w-5 h-5 rounded border flex items-center justify-center transition-colors mt-0.5",
                                            includeSummary
                                                ? "bg-blue-500 border-blue-500 text-white"
                                                : "border-muted-foreground/30 bg-background"
                                        )}>
                                            {includeSummary && <Check className="w-3 h-3" />}
                                        </div>
                                    </div>
                                </div>

                                {/* Selection List */}
                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                        Available Items
                                    </h3>
                                    <div className="space-y-1">
                                        {data.map((item) => {
                                            const id = String(item.id ?? item.citation ?? '');
                                            const isSelected = selectedIds.includes(id);
                                            return (
                                                <div
                                                    key={id}
                                                    onClick={() => toggleSelection(id)}
                                                    className={cn(
                                                        "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                                                        isSelected
                                                            ? "bg-primary/5 border-primary/50"
                                                            : "bg-card border-border hover:border-primary/30"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
                                                        isSelected
                                                            ? "bg-blue-500 border-blue-500 text-white"
                                                            : "border-muted-foreground/30 bg-background"
                                                    )}>
                                                        {isSelected && <Check className="w-3 h-3" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-sm truncate">
                                                            {item.query || item.citation || "Unknown Item"}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            {item.statute_text || item.textSnippet || "No preview available"}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t border-border bg-muted/30">
                                <div className="grid grid-cols-3 gap-3">
                                    <button
                                        onClick={() => handleExport('gdoc')}
                                        disabled={selectedIds.length === 0 || isGenerating}
                                        className="flex flex-col items-center gap-2 p-3 rounded-lg border border-border bg-card hover:bg-muted disabled:opacity-50 transition-colors"
                                    >
                                        <FileText className="w-6 h-6 text-blue-500" />
                                        <span className="text-xs font-medium">Google Doc</span>
                                    </button>
                                    <button
                                        onClick={() => handleExport('docx')}
                                        disabled={selectedIds.length === 0 || isGenerating}
                                        className="flex flex-col items-center gap-2 p-3 rounded-lg border border-border bg-card hover:bg-muted disabled:opacity-50 transition-colors"
                                    >
                                        <FileIcon className="w-6 h-6 text-blue-700" />
                                        <span className="text-xs font-medium">Word .docx</span>
                                    </button>
                                    <button
                                        onClick={() => handleExport('pdf')}
                                        disabled={selectedIds.length === 0 || isGenerating}
                                        className="flex flex-col items-center gap-2 p-3 rounded-lg border border-border bg-card hover:bg-muted disabled:opacity-50 transition-colors"
                                    >
                                        <Download className="w-6 h-6 text-red-500" />
                                        <span className="text-xs font-medium">PDF</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
