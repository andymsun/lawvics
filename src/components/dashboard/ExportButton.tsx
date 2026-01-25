'use client';

import * as React from 'react';
import { ArrowUpFromLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExportModal } from './ExportModal';

export interface ExportItem {
    id?: string | number;
    citation?: string;
    query?: string;
    statute_text?: string;
    textSnippet?: string;
    // For SurveyRecord - nested statutes
    statutes?: Record<string, { textSnippet?: string; citation?: string } | Error>;
}

interface ExportButtonProps {
    data: ExportItem[];
    type: 'history' | 'saved';
}

export function ExportButton({ data, type }: ExportButtonProps) {
    const [isModalOpen, setIsModalOpen] = React.useState(false);

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className={cn(
                    "w-9 h-9 flex items-center justify-center rounded-lg border transition-all",
                    "hover:bg-muted active:scale-95",
                    "bg-background border-border shadow-sm",
                    "text-muted-foreground hover:text-foreground"
                )}
                title="Export Statutes"
            >
                <ArrowUpFromLine className="w-4 h-4" />
            </button>

            <ExportModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                data={data}
                type={type}
            />
        </>
    );
}
