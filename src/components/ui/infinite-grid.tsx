'use client';

import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useMotionTemplate, useAnimationFrame } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface GridPatternProps {
    offsetX: ReturnType<typeof useMotionValue<number>>;
    offsetY: ReturnType<typeof useMotionValue<number>>;
    size: number;
}

const GridPattern = ({ offsetX, offsetY, size }: GridPatternProps) => {
    return (
        <svg className="w-full h-full">
            <defs>
                <motion.pattern
                    id="grid-pattern"
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
                        className="text-slate-300"
                    />
                </motion.pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        </svg>
    );
};

interface InfiniteGridProps {
    children: React.ReactNode;
    className?: string;
}

export const InfiniteGrid = ({ children, className }: InfiniteGridProps) => {
    const [gridSize] = useState(40);
    const containerRef = useRef<HTMLDivElement>(null);
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
        gridOffsetX.set((gridOffsetX.get() + 0.5) % gridSize);
        gridOffsetY.set((gridOffsetY.get() + 0.5) % gridSize);
    });

    const maskImage = useMotionTemplate`radial-gradient(300px circle at ${mouseX}px ${mouseY}px, black, transparent)`;

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            className={cn(
                'relative w-full min-h-screen flex flex-col items-center overflow-hidden bg-slate-50',
                className
            )}
        >
            {/* Background grid (subtle) */}
            <div className="absolute inset-0 z-0 opacity-[0.05]">
                <GridPattern offsetX={gridOffsetX} offsetY={gridOffsetY} size={gridSize} />
            </div>

            {/* Mouse-following spotlight grid */}
            <motion.div
                className="absolute inset-0 z-0 opacity-40"
                style={{ maskImage, WebkitMaskImage: maskImage }}
            >
                <GridPattern offsetX={gridOffsetX} offsetY={gridOffsetY} size={gridSize} />
            </motion.div>

            {/* Gradient glow */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute right-[-20%] top-[-20%] w-[40%] h-[40%] rounded-full bg-blue-500/20 blur-[120px]" />
                <div className="absolute left-[-10%] bottom-[-10%] w-[30%] h-[30%] rounded-full bg-indigo-500/15 blur-[100px]" />
            </div>

            {/* Content Container */}
            <div className="relative z-10 w-full pointer-events-auto">{children}</div>
        </div>
    );
};

export default InfiniteGrid;
