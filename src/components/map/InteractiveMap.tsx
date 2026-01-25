"use client";

import React, { useState, useCallback, memo } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useSurveyHistoryStore, useShallow, StatuteEntry, getActiveSessionStatutes } from "@/lib/store";
import { getStateCodeFromGeo } from "@/lib/constants/stateMapping";
import { StateCode, Statute } from "@/types/statute";
import StatuteCard from "@/components/ui/StatuteCard";

const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

// ============================================================
// Color Logic
// ============================================================

type StateStatus = 'idle' | 'loading' | 'success' | 'suspicious' | 'error';

const STATUS_COLORS: Record<StateStatus, string> = {
    idle: '#D6D6DA',      // Grey
    loading: '#3B82F6',   // Blue
    success: '#22C55E',   // Green
    suspicious: '#EAB308', // Yellow
    error: '#EF4444',     // Red
};

/**
 * Determine the display status for a state based on its data
 */
function getStateStatus(entry: StatuteEntry | undefined): StateStatus {
    if (!entry) return 'idle';

    if (entry instanceof Error) return 'error';

    // Check trustLevel first (includes domain verification status)
    if (entry.trustLevel === 'suspicious' || entry.trustLevel === 'unverified') {
        return 'suspicious';
    }

    // Fallback: check confidence for trust level approximation
    if (entry.confidenceScore < 70) return 'suspicious';

    return 'success';
}

// ============================================================
// Memoized State Path Component
// ============================================================

interface GeoObject {
    rsmKey: string;
    id?: string;
    properties?: {
        name?: string;
        [key: string]: unknown;
    };
    [key: string]: unknown;
}

const StatePath = memo(function StatePath({ geo, stateCode, status, onClick }: { geo: GeoObject; stateCode: StateCode | null; status: StateStatus; onClick: (stateCode: StateCode) => void }) {
    const fill = STATUS_COLORS[status];
    const isLoading = status === 'loading';

    const handleClick = useCallback(() => {
        if (stateCode && status !== 'idle' && status !== 'loading') {
            onClick(stateCode);
        }
    }, [stateCode, status, onClick]);

    return (
        <Geography
            key={geo.rsmKey}
            geography={geo}
            fill={fill}
            stroke="#FFF"
            strokeWidth={0.5}
            className={isLoading ? 'animate-pulse' : ''}
            style={{
                default: {
                    outline: "none",
                    cursor: status !== 'idle' && status !== 'loading' ? 'pointer' : 'default',
                },
                hover: {
                    fill: status !== 'idle' ? '#94A3B8' : fill,
                    outline: "none",
                },
                pressed: { outline: "none" },
            }}
            onClick={handleClick}
        />
    );
});

// ============================================================
// Details Panel (Slide-over)
// ============================================================

interface DetailsPanelProps {
    statute: Statute;
    onClose: () => void;
}

function DetailsPanel({ statute, onClose }: DetailsPanelProps) {
    return (
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-background border-l border-border shadow-2xl z-50 overflow-auto"
        >
            {/* Close button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted transition-colors z-10"
            >
                <X className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* Statute Card */}
            <div className="p-6 pt-16">
                <StatuteCard statute={statute} />
            </div>
        </motion.div>
    );
}

// ============================================================
// Legend Component
// ============================================================

function MapLegend() {
    return (
        <div className="absolute bottom-6 right-6 flex flex-col items-start gap-3 px-4 py-4 rounded-xl bg-card/80 backdrop-blur-md border border-border/50 shadow-2xl z-30">
            <h3 className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1 select-none">Status</h3>
            <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                <span className="text-[11px] font-medium text-muted-foreground">Pending</span>
            </div>
            <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[11px] font-medium text-muted-foreground">Loading</span>
            </div>
            <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-[11px] font-medium text-muted-foreground">Verified</span>
            </div>
            <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <span className="text-[11px] font-medium text-muted-foreground">Risk</span>
            </div>
            <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-[11px] font-medium text-muted-foreground">Error</span>
            </div>
        </div>
    );
}

// ============================================================
// Main Interactive Map Component
// ============================================================

const InteractiveMap = () => {
    const [selectedStateCode, setSelectedStateCode] = useState<StateCode | null>(null);

    // Use useShallow to prevent re-renders when unrelated store state changes
    const activeStatutes = useSurveyHistoryStore(useShallow(getActiveSessionStatutes));
    const activeSurvey = useSurveyHistoryStore((state) =>
        state.surveys.find(s => s.id === state.activeSurveyId)
    );

    // Determine if we're in a loading state (survey running)
    const isLoading = activeSurvey?.status === 'running';

    // Get the selected statute if available
    const selectedStatute = selectedStateCode && activeStatutes[selectedStateCode];
    const selectedStatuteData = selectedStatute instanceof Error ? null : selectedStatute;

    const handleStateClick = useCallback((stateCode: StateCode) => {
        setSelectedStateCode(stateCode);
    }, []);

    const handleClosePanel = useCallback(() => {
        setSelectedStateCode(null);
    }, []);

    return (
        <div className="w-full h-full min-h-[500px] relative bg-muted/30 rounded-xl overflow-hidden">
            <ComposableMap
                projection="geoAlbersUsa"
                className="w-full h-full"
            >
                <Geographies geography={geoUrl}>
                    {({ geographies }: { geographies: GeoObject[] }) =>
                        geographies.map((geo: GeoObject) => {
                            const stateCode = getStateCodeFromGeo(geo);

                            // Determine status for this state
                            let status: StateStatus = 'idle';

                            if (stateCode) {
                                const entry = activeStatutes[stateCode];

                                if (entry) {
                                    // We have data for this state
                                    status = getStateStatus(entry);
                                } else if (isLoading) {
                                    // Survey is running but we don't have data yet
                                    status = 'loading';
                                }
                            }

                            return (
                                <StatePath
                                    key={geo.rsmKey}
                                    geo={geo}
                                    stateCode={stateCode}
                                    status={status}
                                    onClick={handleStateClick}
                                />
                            );
                        })
                    }
                </Geographies>
            </ComposableMap>

            {/* Legend */}
            <MapLegend />

            {/* Active Survey Indicator */}
            {activeSurvey && (
                <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border border-border text-sm">
                    <div className="flex items-center gap-2">
                        {isLoading && (
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        )}
                        <span className="text-muted-foreground">
                            Survey #{activeSurvey.id}: {isLoading ? 'Running...' : 'Complete'}
                        </span>
                        <span className="text-foreground font-medium">
                            {Object.keys(activeStatutes).length}/50 states
                        </span>
                    </div>
                </div>
            )}

            {/* Details Panel Slide-over */}
            <AnimatePresence>
                {selectedStatuteData && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/20 z-40"
                            onClick={handleClosePanel}
                        />

                        {/* Panel */}
                        <DetailsPanel
                            statute={selectedStatuteData}
                            onClose={handleClosePanel}
                        />
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default InteractiveMap;
