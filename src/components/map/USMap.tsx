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
        suspicious: 'var(--risk)',                  // Risk (Yellow)
        error: 'var(--error)',                      // Error (Red)
        hover: '#6366F1',                           // indigo-500
        stroke: isDark ? '#1F2937' : '#F9FAFB',    // neutral-800 / neutral-50
    };
}

// ============================================================
// Legend Component
// ============================================================

interface MapLegendProps {
    colors: ReturnType<typeof useMapColors>;
    counts: {
        pending: number;
        loading: number;
        verified: number;
        risk: number;
        error: number;
    };
}

function MapLegend({ colors, counts }: MapLegendProps) {
    return (
        <div className="absolute bottom-4 right-4 flex flex-col items-start gap-2.5 px-3 py-3 rounded-xl bg-background/30 backdrop-blur-md border border-white/10 shadow-2xl z-30">
            <h3 className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-0.5 select-none">Status</h3>
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: colors.idle }} />
                <span className="text-[10px] font-medium text-white/80">Pending ({counts.pending})</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: colors.loading }} />
                <span className="text-[10px] font-medium text-white/80">Loading ({counts.loading})</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: colors.success }} />
                <span className="text-[10px] font-medium text-white/80">Verified ({counts.verified})</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: colors.suspicious }} />
                <span className="text-[10px] font-medium text-white/80">Risk ({counts.risk})</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: colors.error }} />
                <span className="text-[10px] font-medium text-white/80">Error ({counts.error})</span>
            </div>
        </div>
    );
}

export default function USMap({ onStateClick }: USMapProps) {
    // Use atomic primitive selector for activeSessionId (stable)
    const activeSurveyId = useSurveyHistoryStore((state) => state.activeSurveyId);

    // Use direct selector for active session to ensure updates trigger re-renders
    // When statutes map updates, the session object reference changes, triggering a re-render
    const activeSession = useSurveyHistoryStore((state) =>
        state.surveys.find((s) => s.id === state.activeSurveyId)
    );

    // Derived state directly from activeSession (no useMemo needed if we trust the re-render)
    // or keep useMemo for expensive calculations
    const statutes = useMemo<Partial<Record<StateCode, StatuteEntry>>>(() =>
        activeSession?.statutes ?? {},
        [activeSession]
    );

    // Calculate counts for legend
    const counts = useMemo(() => {
        const counts = {
            pending: 0,
            loading: 0,
            verified: 0,
            risk: 0,
            error: 0
        };

        const totalAnalyzed = Object.keys(statutes).length;
        const totalStates = 50;
        const isRunning = activeSession?.status === 'running';

        // Count analyzed states
        Object.values(statutes).forEach(entry => {
            if (entry instanceof Error) {
                counts.error++;
            } else if (entry.trustLevel === 'suspicious' || entry.trustLevel === 'unverified' || entry.confidenceScore < 70) {
                counts.risk++;
            } else {
                counts.verified++;
            }
        });

        // Remaining states logic
        const remaining = totalStates - totalAnalyzed;
        if (isRunning) {
            // If running, we can assume one is actively "loading" (the next one)
            // But visually "pending" states are those not yet started
            // Ideally we'd know exactly which state is currently processing.
            // For now, let's treat all remaining as Pending, but if running, 
            // maybe show 1 as Loading? Or just keep it simple: Pending = Remaining
            counts.pending = remaining;
            // The "Loading" state in the map is visual for missing data but active survey
            // The legend count for Loading might be better as 0 unless we track concurrent requests
            // If survey is running, at least one state is technically loading. 
            // Let's assume remaining > 0 involved. 
            // Actually, "Loading" in map is handled by `activeSession?.status === 'running' && !entry`.
            // So visually, all remaining gray states pulse if running.
            if (remaining > 0) {
                counts.loading = remaining; // Actually they are all candidates for loading
                counts.pending = 0; // If running, they are all "waiting/loading"
            }
        } else {
            counts.pending = remaining;
        }

        return counts;
    }, [statutes, activeSession?.status]);

    const analyzedCount = Object.keys(statutes).length;
    const percentComplete = Math.round((analyzedCount / 50) * 100);

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

            {/* Map Container - fills remaining space */}
            <div
                ref={containerRef}
                className="relative flex-1 bg-card border border-border rounded-lg m-2 overflow-hidden cursor-grab active:cursor-grabbing select-none"
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {/* Floating Controls Bar */}
                <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between px-4 py-1.5 rounded-xl bg-background/20 backdrop-blur-md border border-white/10 shadow-2xl">
                    <div className="flex items-center gap-4">
                        <div className="text-xs font-medium text-muted-foreground/80 tracking-wide select-none">
                            PROGRESS <span className="text-white font-bold ml-1">{analyzedCount}/50 ({percentComplete}%)</span>
                        </div>
                        {activeSession?.status === 'running' && (
                            <button
                                onClick={() => activeSession && useSurveyHistoryStore.getState().cancelSurvey(activeSession.id)}
                                className="flex items-center gap-1 px-2 py-0.5 bg-error/10 hover:bg-error/20 text-error text-[10px] font-semibold rounded-full border border-error/30 transition-colors"
                            >
                                <X className="w-3 h-3" />
                                CANCEL
                            </button>
                        )}
                    </div>

                    {/* Current Query Display */}
                    {activeSession?.query && (
                        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 px-3 py-1 bg-background/40 backdrop-blur-md rounded-full border border-white/10 shadow-sm text-xs font-medium text-white max-w-sm lg:max-w-md truncate items-baseline gap-2">
                            <span className="text-white/60 uppercase text-[10px] tracking-wider font-bold">Query</span>
                            <span className="truncate">&ldquo;{activeSession.query}&rdquo;</span>
                        </div>
                    )}

                    {/* Zoom Controls */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setZoom((z) => Math.min(4, z + 0.25))}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white text-base font-medium transition-all backdrop-blur-sm border border-white/5"
                            title="Zoom In"
                        >
                            +
                        </button>
                        <span className="text-[10px] text-white/60 min-w-[2.5rem] text-center font-mono">
                            {Math.round(zoom * 100)}%
                        </span>
                        <button
                            onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white text-base font-medium transition-all backdrop-blur-sm border border-white/5"
                            title="Zoom Out"
                        >
                            −
                        </button>

                        <div className="w-px h-4 bg-white/10 mx-1" /> {/* Vertical divider */}

                        <button
                            onClick={handleReset}
                            className="px-2 py-1 text-[10px] font-medium text-white/50 hover:text-white hover:bg-white/10 rounded-md transition-all uppercase tracking-wider"
                            title="Reset View"
                        >
                            RESET
                        </button>
                        <button
                            onClick={() => useSurveyHistoryStore.getState().setActiveSurvey(null)}
                            className="px-2 py-1 text-[10px] font-bold text-primary hover:text-primary-foreground hover:bg-primary rounded-md transition-all uppercase tracking-wider ml-1"
                            title="Start New Survey"
                        >
                            NEW
                        </button>
                    </div>
                </div>

                {/* Floating Legend Overlay */}
                <MapLegend colors={colors} counts={counts} />
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
