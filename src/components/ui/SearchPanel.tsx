"use client";

import { useState } from "react";
import { searchAllStates, MaxConcurrentSurveysError } from "@/lib/agents/orchestrator";
import { useSurveyHistoryStore, useSettingsStore, getRunningCount, MAX_CONCURRENT_SURVEYS } from "@/lib/store";
import { Search, AlertCircle } from "lucide-react";

export default function SearchPanel() {
    const [query, setQuery] = useState("");
    const [error, setError] = useState<string | null>(null);
    const runningCount = useSurveyHistoryStore(getRunningCount);
    const startSurvey = useSurveyHistoryStore((state) => state.startSurvey);
    const enableMockMode = useSettingsStore((state) => state.enableMockMode);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        setError(null);

        // Check concurrency limit
        if (runningCount >= MAX_CONCURRENT_SURVEYS) {
            setError(`Max ${MAX_CONCURRENT_SURVEYS} concurrent surveys. Please wait for one to complete.`);
            return;
        }

        // Create the session first (returns ID)
        const surveyId = startSurvey(query);

        // Fire and forget - results stream into the session
        // Pass enableMockMode from settings store
        searchAllStates(query, surveyId, enableMockMode).catch((err) => {
            if (err instanceof MaxConcurrentSurveysError) {
                setError(err.message);
            } else {
                console.error('Survey failed:', err);
            }
        });

        // Clear query for next search
        setQuery("");
    };

    return (
        <div className="flex flex-col items-center justify-center p-6 w-full max-w-2xl mx-auto">
            <form onSubmit={handleSearch} className="relative w-full">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g. Statute of limitations for fraud"
                    className="w-full px-6 py-4 text-lg border-2 border-border bg-background text-foreground rounded-full shadow-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all pr-14"
                />
                <button
                    type="submit"
                    disabled={runningCount >= MAX_CONCURRENT_SURVEYS}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                    <Search size={24} />
                </button>
            </form>

            {/* Running count indicator */}
            {runningCount > 0 && (
                <div className="mt-2 text-sm text-muted-foreground">
                    {runningCount} survey{runningCount > 1 ? 's' : ''} running
                    {runningCount >= MAX_CONCURRENT_SURVEYS && ' (max reached)'}
                </div>
            )}

            {/* Error toast */}
            {error && (
                <div className="mt-3 flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            {!error && runningCount === 0 && (
                <div className="mt-2 text-sm text-muted-foreground">
                    Try &quot;Adverse Possession time limits&quot; or &quot;Grand Theft Auto felony threshold&quot;
                </div>
            )}
        </div>
    );
}

