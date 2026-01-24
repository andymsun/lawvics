'use client';

import { useState, useEffect } from 'react';
import { useSavedStatuteStore, ALL_STATE_CODES } from '@/lib/store';
import { StateCode, Statute } from '@/types/statute';
import { cn } from '@/lib/utils';
import {
    Bookmark,
    ChevronDown,
    ChevronRight,
    ExternalLink,
    Trash2,
} from 'lucide-react';
import { ExportButton } from '../ExportButton';

const STATE_NAMES: Record<StateCode, string> = {
    AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
    CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
    HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
    KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
    MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
    MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
    NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
    OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
    SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
    VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
};

type GroupBy = 'state' | 'topic';

export function SavedView() {
    const [groupBy, setGroupBy] = useState<GroupBy>('state');
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    const savedStatutes = useSavedStatuteStore((state) => state.savedStatutes);
    const removeStatute = useSavedStatuteStore((state) => state.removeStatute);
    const getStatutesByState = useSavedStatuteStore((state) => state.getStatutesByState);
    const getStatutesByTopic = useSavedStatuteStore((state) => state.getStatutesByTopic);
    const getSavedStateCodes = useSavedStatuteStore((state) => state.getSavedStateCodes);
    const getSavedTopics = useSavedStatuteStore((state) => state.getSavedTopics);

    // Get groups based on selection
    const groups = groupBy === 'state' ? getSavedStateCodes() : getSavedTopics();

    const toggleGroup = (id: string) => {
        setExpandedGroups((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleRemove = (citation: string) => {
        removeStatute(citation);
    };

    return (
        <div className="p-6 space-y-4 overflow-auto h-full">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Bookmark className="w-5 h-5 text-primary" />
                        <h1 className="text-xl font-semibold">Saved Statutes</h1>
                    </div>
                    <ExportButton data={Object.values(savedStatutes)} type="saved" />
                </div>

                {/* Group By Toggle */}
                <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
                    <button
                        onClick={() => setGroupBy('state')}
                        className={cn(
                            "px-3 py-1 rounded-md text-sm font-medium transition-all",
                            groupBy === 'state' ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        State
                    </button>
                    <button
                        onClick={() => setGroupBy('topic')}
                        className={cn(
                            "px-3 py-1 rounded-md text-sm font-medium transition-all",
                            groupBy === 'topic' ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Topic
                    </button>
                </div>
            </div>

            {groups.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border-2 border-dashed rounded-lg">
                    <Bookmark className="w-16 h-16 mb-4 opacity-30" />
                    <p className="text-lg font-medium">No saved statutes</p>
                    <p className="text-sm mt-1">
                        When you save a statute, it will appear here.
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {groups.map((groupId) => {
                        // Type guard for groupId since it can be StateCode or string
                        const statutes = groupBy === 'state'
                            ? getStatutesByState(groupId as StateCode)
                            : getStatutesByTopic(groupId);

                        const isExpanded = expandedGroups.has(groupId);
                        const label = groupBy === 'state'
                            ? `${STATE_NAMES[groupId as StateCode]} (${groupId})`
                            : groupId;

                        return (
                            <div
                                key={groupId}
                                className="border border-border rounded-lg overflow-hidden"
                            >
                                {/* Group Header */}
                                <button
                                    onClick={() => toggleGroup(groupId)}
                                    className="w-full flex items-center justify-between px-4 py-3 bg-card/50 hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        {isExpanded ? (
                                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                        ) : (
                                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                        )}
                                        <span className="font-medium">
                                            {label}
                                        </span>
                                    </div>
                                    <span className="text-sm text-muted-foreground">
                                        {statutes.length} saved
                                    </span>
                                </button>

                                {/* Statutes List */}
                                {isExpanded && (
                                    <div className="divide-y divide-border">
                                        {statutes.map((statute) => (
                                            <div
                                                key={statute.citation}
                                                className="px-4 py-3 bg-background"
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={cn(
                                                                "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border",
                                                                "bg-muted text-muted-foreground border-border"
                                                            )}>
                                                                {statute.stateCode}
                                                            </span>
                                                            {groupBy === 'state' && (
                                                                <span className="text-[10px] font-medium text-muted-foreground px-1.5 py-0.5 bg-blue-500/5 text-blue-600 rounded">
                                                                    {statute.topic}
                                                                </span>
                                                            )}
                                                            <p className="font-medium text-sm truncate">
                                                                {statute.citation}
                                                            </p>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                            {statute.textSnippet}
                                                        </p>
                                                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                                            <span>Effective: {statute.effectiveDate}</span>
                                                            {statute.sourceUrl && (
                                                                <a
                                                                    href={statute.sourceUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-1 text-primary hover:underline"
                                                                >
                                                                    <ExternalLink className="w-3 h-3" />
                                                                    Source
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemove(statute.citation)}
                                                        className="p-2 text-muted-foreground hover:text-red-500 transition-colors"
                                                        title="Remove from saved"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default SavedView;
