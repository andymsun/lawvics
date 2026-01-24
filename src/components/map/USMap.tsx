'use client';

import React, { useCallback, useState, useRef, useEffect, useMemo } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { X } from 'lucide-react';
import { useSurveyHistoryStore, useShallow, StatuteEntry } from '@/lib/store';
import { StateCode } from '@/types/statute';

// TopoJSON CDN URL for US states
const GEO_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

// FIPS code to State Code mapping
const FIPS_TO_STATE: Record<string, StateCode> = {
    '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA',
    '08': 'CO', '09': 'CT', '10': 'DE', '12': 'FL', '13': 'GA',
    '15': 'HI', '16': 'ID', '17': 'IL', '18': 'IN', '19': 'IA',
    '20': 'KS', '21': 'KY', '22': 'LA', '23': 'ME', '24': 'MD',
    '25': 'MA', '26': 'MI', '27': 'MN', '28': 'MS', '29': 'MO',
    '30': 'MT', '31': 'NE', '32': 'NV', '33': 'NH', '34': 'NJ',
    '35': 'NM', '36': 'NY', '37': 'NC', '38': 'ND', '39': 'OH',
    '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI', '45': 'SC',
    '46': 'SD', '47': 'TN', '48': 'TX', '49': 'UT', '50': 'VT',
    '51': 'VA', '53': 'WA', '54': 'WV', '55': 'WI', '56': 'WY',
};

interface USMapProps {
    onStateClick?: (stateCode: StateCode) => void;
}

/**
 * Hook to get theme-aware map colors
 */
function useMapColors() {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        // Check initial state
        const checkDark = () => {
            setIsDark(document.documentElement.classList.contains('dark'));
        };
        checkDark();

        // Watch for changes
        const observer = new MutationObserver(checkDark);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });

        return () => observer.disconnect();
    }, []);

    return {
        idle: isDark ? '#374151' : '#E5E7EB',      // neutral-700 / neutral-200
        loading: isDark ? '#4B5563' : '#D1D5DB',   // neutral-600 / neutral-300
        success: '#22c55e',                         // green-500 (Vibrant Verified)
        suspicious: '#ef4444',                      // red-500 (Vibrant Risk)
        error: '#94a3b8',                           // slate-400 (Distinct Gray Error)
        hover: '#6366F1',                           // indigo-500
        stroke: isDark ? '#1F2937' : '#F9FAFB',    // neutral-800 / neutral-50
    };
}

// ============================================================
// Legend Component
// ============================================================

function MapLegend({ colors }: { colors: ReturnType<typeof useMapColors> }) {
    return (
        <div className="flex items-center gap-4 text-xs text-muted-foreground bg-card/50 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-border/50 shadow-sm">
            <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: colors.idle }} />
                <span>Pending</span>
            </div>
            <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm animate-pulse" style={{ background: colors.loading }} />
                <span>Loading</span>
            </div>
            <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: colors.success }} />
                <span>Verified</span>
            </div>
            <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: colors.suspicious }} />
                <span>Risk</span>
            </div>
            <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: colors.error }} />
                <span>Error</span>
            </div>
        </div>
    );
}

export default function USMap({ onStateClick }: USMapProps) {
    // Use atomic primitive selector for activeSessionId (stable)
    const activeSurveyId = useSurveyHistoryStore((state) => state.activeSurveyId);

    // Use useShallow for object selection to prevent infinite re-renders
    const activeSession = useSurveyHistoryStore(
        useShallow((state) => state.surveys.find((s) => s.id === state.activeSurveyId))
    );

    // Memoize the statutes to avoid recalculating on every render
    const statutes = useMemo<Partial<Record<StateCode, StatuteEntry>>>(() =>
        activeSession?.statutes ?? {},
        [activeSession?.statutes]
    );

    const percentComplete = useMemo(() =>
        Math.round((Object.keys(statutes).length / 50) * 100),
        [statutes]
    );

    const colors = useMapColors();

    // Zoom state - using CSS transform instead of ZoomableGroup for stability
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [hasDragged, setHasDragged] = useState(false); // Track if mouse actually moved
    const containerRef = useRef<HTMLDivElement>(null);

    /**
     * Get the fill color for a state based on its data status
     */
    const getStateFill = useCallback(
        (stateCode: StateCode | undefined): string => {
            if (!stateCode) return colors.idle;

            const entry = statutes[stateCode];

            // If we are running a survey and don't have this state yet, show as loading if active
            const isRunning = activeSession?.status === 'running';
            if (!entry && isRunning) {
                // Optional: Only show some random loading states or all remaining?
                // For now, keep them idle until processed to match linear progress
                return colors.idle;
            }

            if (!entry) return colors.idle;

            // Check if it's an Error
            if (entry instanceof Error) {
                return colors.error;
            }

            // It's a Statute - check trust level
            if (entry.trustLevel === 'suspicious' || entry.trustLevel === 'unverified') {
                return colors.suspicious;
            }

            // Fallback for missing trustLevel based on confidence
            if (entry.confidenceScore < 70) {
                return colors.suspicious;
            }

            return colors.success;
        },
        [statutes, colors, activeSession?.status]
    );

    const setActiveState = useSurveyHistoryStore((state) => state.setActiveState);

    /**
     * Handle click on a state
     */
    const handleStateClick = useCallback(
        (stateCode: StateCode) => {
            // Only block click if user actually dragged (moved mouse more than threshold)
            if (hasDragged) {
                console.log(`[USMap] Click blocked - was a drag`);
                return;
            }
            console.log(`[USMap] Clicked state: ${stateCode}`);
            setActiveState(stateCode); // Set in global store
            onStateClick?.(stateCode); // Also call prop if provided
        },
        [onStateClick, hasDragged, setActiveState]
    );

    /**
     * Handle wheel zoom - CSS transform based
     */
    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom((prev) => Math.min(4, Math.max(0.5, prev + delta)));
    }, []);

    /**
     * Handle mouse down for drag
     */
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button !== 0) return; // Only left click
        setIsDragging(true);
        setHasDragged(false); // Reset drag tracking
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }, [position]);

    /**
     * Handle mouse move for drag
     */
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging) return;
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        // Check if mouse moved more than threshold (5px) - indicates real drag
        const dx = Math.abs(newX - position.x);
        const dy = Math.abs(newY - position.y);
        if (dx > 5 || dy > 5) {
            setHasDragged(true);
        }
        setPosition({ x: newX, y: newY });
    }, [isDragging, dragStart, position]);

    /**
     * Handle mouse up to stop drag
     */
    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        // Reset hasDragged after a short delay to allow click handler to check it
        setTimeout(() => setHasDragged(false), 100);
    }, []);

    /**
     * Reset zoom and position
     */
    const handleReset = useCallback(() => {
        setZoom(1);
        setPosition({ x: 0, y: 0 });
    }, []);

    return (
        <div className="w-full h-full flex flex-col">
            {/* Controls Bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-card/50 backdrop-blur-sm border-b border-border">
                <div className="flex items-center gap-4">
                    <div className="text-sm font-medium text-muted-foreground">
                        Progress: <span className="text-primary font-bold">{percentComplete}%</span>
                    </div>
                    {activeSession?.status === 'running' && (
                        <button
                            onClick={() => activeSession && useSurveyHistoryStore.getState().cancelSurvey(activeSession.id)}
                            className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold rounded-full border border-red-200 dark:border-red-900/50 transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                            Cancel Survey
                        </button>
                    )}
                </div>

                {/* Current Query Display */}
                {activeSession?.query && (
                    <div className="absolute left-1/2 -translate-x-1/2 px-4 py-1.5 bg-background/80 backdrop-blur-md rounded-full border border-border shadow-sm text-sm font-medium text-foreground max-w-md truncate">
                        <span className="text-muted-foreground mr-2">Query:</span>
                        &ldquo;{activeSession.query}&rdquo;
                    </div>
                )}

                <div className="flex items-center gap-4">
                    {/* Legend - Now using the component */}
                    <MapLegend colors={colors} />
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setZoom((z) => Math.min(4, z + 0.25))}
                        className="w-7 h-7 flex items-center justify-center rounded bg-muted hover:bg-accent text-foreground text-sm font-medium transition-colors"
                        title="Zoom In"
                    >
                        +
                    </button>
                    <span className="text-xs text-muted-foreground min-w-[3rem] text-center">
                        {Math.round(zoom * 100)}%
                    </span>
                    <button
                        onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                        className="w-7 h-7 flex items-center justify-center rounded bg-muted hover:bg-accent text-foreground text-sm font-medium transition-colors"
                        title="Zoom Out"
                    >
                        −
                    </button>
                    <button
                        onClick={handleReset}
                        className="ml-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        title="Reset View"
                    >
                        Reset
                    </button>
                </div>
            </div>

            {/* Map Container - fills remaining space */}
            <div
                ref={containerRef}
                className="flex-1 bg-card border border-border rounded-lg m-2 overflow-hidden cursor-grab active:cursor-grabbing select-none"
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <div
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                        transformOrigin: 'center center',
                        transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                        width: '100%',
                        height: '100%',
                    }}
                >
                    <ComposableMap
                        projection="geoAlbersUsa"
                        projectionConfig={{ scale: 1000 }}
                        style={{ width: '100%', height: '100%' }}
                    >
                        <Geographies geography={GEO_URL}>
                            {({ geographies }: { geographies: Array<{ id: string; rsmKey: string;[key: string]: unknown }> }) =>
                                geographies.map((geo) => {
                                    // Get state code from FIPS
                                    const fipsCode = geo.id?.toString().padStart(2, '0');
                                    const stateCode = fipsCode ? FIPS_TO_STATE[fipsCode] : undefined;
                                    const fillColor = getStateFill(stateCode);

                                    return (
                                        <Geography
                                            key={geo.rsmKey}
                                            geography={geo}
                                            fill={fillColor}
                                            stroke={colors.stroke}
                                            strokeWidth={0.5}
                                            onClick={() => stateCode && handleStateClick(stateCode)}
                                            style={{
                                                default: {
                                                    outline: 'none',
                                                    transition: 'fill 0.2s ease-out',
                                                    cursor: 'pointer',
                                                    pointerEvents: 'all',
                                                },
                                                hover: {
                                                    fill: colors.hover,
                                                    outline: 'none',
                                                    cursor: 'pointer',
                                                    pointerEvents: 'all',
                                                },
                                                pressed: {
                                                    fill: colors.hover,
                                                    outline: 'none',
                                                    pointerEvents: 'all',
                                                },
                                            }}
                                        />
                                    );
                                })
                            }
                        </Geographies>
                    </ComposableMap>
                </div>
            </div>
        </div>
    );
}
