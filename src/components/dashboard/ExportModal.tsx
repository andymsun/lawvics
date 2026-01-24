'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, File as FileIcon, X, Check, ArrowUpFromLine, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: any[]; // The data to export
    type: 'history' | 'saved';
}

export function ExportModal({ isOpen, onClose, data, type }: ExportModalProps) {
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

    const handleExport = async (format: 'pdf' | 'docx' | 'gdoc') => {
        if (selectedIds.length === 0) return;
        setIsGenerating(true);

        const selectedItems = data.filter(item => selectedIds.includes(item.id || item.citation));
        const timestamp = new Date().toLocaleDateString().replace(/\//g, '-');
        const filename = `lawvics_export_${timestamp}`;

        // Mock AI Summary Text (In a real app, this would be fetched from an API)
        const summaryText = includeSummary
            ? `AI OVERVIEW SUMMARY\n\nGenerated for ${selectedIds.length} items. This overview synthesizes the key legal principles found in the selected statutes. Each statute provides specific regulations concerning their respective jurisdictions, effectively establishing a framework for legal compliance and enforcement.\n\n---\n\n`
            : "";

        try {
            if (format === 'pdf') {
                const doc = new jsPDF();
                doc.setFontSize(20);
                doc.text('Lawvics Statute Export', 20, 20);

                let y = 40;

                // Add Summary if included
                if (includeSummary) {
                    doc.setFontSize(14);
                    doc.setFont('helvetica', 'bold');
                    doc.text("AI Overview Summary", 20, y);
                    y += 10;
                    doc.setFontSize(12);
                    doc.setFont('helvetica', 'italic');
                    const splitSummary = doc.splitTextToSize(summaryText.replace("AI OVERVIEW SUMMARY\n\n", "").replace("\n\n---\n\n", ""), 170);
                    doc.text(splitSummary, 20, y);
                    y += (splitSummary.length * 7) + 20;
                }

                doc.setFontSize(12);
                selectedItems.forEach((item, index) => {
                    if (y > 270) {
                        doc.addPage();
                        y = 20;
                    }
                    const title = item.query || item.citation || `Item ${index + 1}`;
                    const content = item.statute_text || item.textSnippet || 'No content';

                    doc.setFont('helvetica', 'bold');
                    doc.text(title, 20, y);
                    y += 10;

                    doc.setFont('helvetica', 'normal');
                    const splitText = doc.splitTextToSize(content, 170);
                    doc.text(splitText, 20, y);
                    y += (splitText.length * 7) + 10;
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

                if (includeSummary) {
                    children.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "AI Overview Summary",
                                    bold: true,
                                    size: 28,
                                }),
                            ],
                            spacing: { before: 400, after: 200 },
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: summaryText.replace("AI OVERVIEW SUMMARY\n\n", "").replace("\n\n---\n\n", ""),
                                    italics: true,
                                }),
                            ],
                        })
                    );
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
                                text: item.statute_text || item.textSnippet || "No content",
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
                    `${item.query || item.citation}\n\n${item.statute_text || item.textSnippet}`
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
                                                {includeSummary && <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
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
                                            const id = item.id || item.citation;
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
