'use client';

import { useState, useRef, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DoubleConfirmDeleteProps {
    onConfirm: () => void;
    className?: string;
    title?: string;
}

export function DoubleConfirmDelete({ onConfirm, className, title = "Delete" }: DoubleConfirmDeleteProps) {
    const [isConfirming, setIsConfirming] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout>(null);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent row clicks

        if (isConfirming) {
            // Second tap - Confirm delete
            onConfirm();
            setIsConfirming(false);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        } else {
            // First tap - Start confirmation
            setIsConfirming(true);

            // Set timeout to reset
            timeoutRef.current = setTimeout(() => {
                setIsConfirming(false);
            }, 3000); // 3 seconds
        }
    };

    const handleMouseLeave = () => {
        if (isConfirming) {
            setIsConfirming(false);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        }
    };

    // Cleanup
    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    return (
        <div className="relative inline-block">
            {isConfirming && (
                <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-destructive text-destructive-foreground text-[10px] uppercase font-bold rounded shadow-lg whitespace-nowrap animate-in fade-in slide-in-from-right-1">
                    Tap again to confirm
                </div>
            )}
            <button
                onClick={handleClick}
                onMouseLeave={handleMouseLeave}
                className={cn(
                    "p-2 transition-all duration-200 rounded-md",
                    isConfirming
                        ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 animate-pulse"
                        : "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
                    className
                )}
                title={isConfirming ? "Click again to delete" : title}
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
    );
}
