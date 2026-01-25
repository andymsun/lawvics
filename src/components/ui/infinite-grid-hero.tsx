'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useMotionTemplate, useAnimationFrame } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface GridPatternProps {
    offsetX: ReturnType<typeof useMotionValue<number>>;
    offsetY: ReturnType<typeof useMotionValue<number>>;
    size: number;
    isDark: boolean;
}

const GridPattern = ({ offsetX, offsetY, size, isDark }: GridPatternProps) => {
    return (
        <svg className="w-full h-full">
            <defs>
                <motion.pattern
                    id="grid-pattern-hero"
                    width={size}
                    height={size}
                    patternUnits="userSpaceOnUse"
                    x={offsetX}
                    y={offsetY}
                >
                    <path
                        d={`M ${size} 0 L 0 0 0 ${size}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                        className={isDark ? 'text-slate-600' : 'text-slate-400'}
                    />
                </motion.pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern-hero)" />
        </svg>
    );
};

interface InfiniteGridHeroProps {
    children: React.ReactNode;
    className?: string;
}

export function InfiniteGridHero({ children, className }: InfiniteGridHeroProps) {
    const [gridSize, setGridSize] = useState(40);

    const containerRef = useRef<HTMLDivElement>(null);

    // Use next-themes for theme management (synced with ThemeProvider)
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    const isDark = mounted ? resolvedTheme === 'dark' : false;

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const gridOffsetX = useMotionValue(0);
    const gridOffsetY = useMotionValue(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const { left, top } = e.currentTarget.getBoundingClientRect();
        mouseX.set(e.clientX - left);
        mouseY.set(e.clientY - top);
    };

    useAnimationFrame(() => {
        gridOffsetX.set((gridOffsetX.get() + 0.625) % gridSize);
        gridOffsetY.set((gridOffsetY.get() + 0.625) % gridSize);
    });

    // Sharper spotlight gradient
    const maskImage = useMotionTemplate`radial-gradient(350px circle at ${mouseX}px ${mouseY}px, black 0%, black 40%, transparent 100%)`;

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            className={cn(
                'relative w-full h-screen flex flex-col items-center justify-center overflow-hidden transition-colors duration-500',
                isDark ? 'bg-slate-900' : 'bg-slate-50',
                className
            )}
        >
            {/* Background grid - increased opacity for visibility */}
            <div className={cn(
                'absolute inset-0 z-0',
                isDark ? 'opacity-[0.15]' : 'opacity-[0.1]'
            )}>
                <GridPattern offsetX={gridOffsetX} offsetY={gridOffsetY} size={gridSize} isDark={isDark} />
            </div>

            {/* Mouse-following spotlight grid (flashlight effect) - sharper */}
            <motion.div
                className="absolute inset-0 z-0 opacity-50"
                style={{ maskImage, WebkitMaskImage: maskImage }}
            >
                <GridPattern offsetX={gridOffsetX} offsetY={gridOffsetY} size={gridSize} isDark={isDark} />
            </motion.div>

            {/* Gradient glows - Minimalist white/gray tones only */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className={cn(
                    'absolute right-[-20%] top-[-20%] w-[50%] h-[50%] rounded-full blur-[150px]',
                    isDark ? 'bg-slate-500/10' : 'bg-slate-300/30'
                )} />
                <div className={cn(
                    'absolute left-[-10%] bottom-[-10%] w-[40%] h-[40%] rounded-full blur-[120px]',
                    isDark ? 'bg-gray-500/8' : 'bg-gray-300/25'
                )} />
            </div>



            {/* Theme Toggle (Top Right) */}
            <button
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className={cn(
                    'absolute top-6 right-6 z-20 p-2 rounded-lg transition-colors',
                    isDark
                        ? 'bg-slate-800 text-yellow-400 hover:text-yellow-300'
                        : 'bg-white/80 text-slate-600 hover:text-slate-800 shadow-sm'
                )}
            >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Content Container */}
            <div className="relative z-10 w-full max-w-4xl mx-auto px-6 pointer-events-auto text-center">
                {children}
            </div>
        </div>
    );
}

export default InfiniteGridHero;
