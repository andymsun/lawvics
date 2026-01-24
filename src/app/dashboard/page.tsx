'use client';

import { useState, useMemo, useEffect } from 'react';
import { useTheme } from 'next-themes';
import USMap from '@/components/map/USMap';
import SearchPanel from '@/components/ui/SearchPanel';
import StatuteCard from '@/components/ui/StatuteCard';
import SettingsModal from '@/components/ui/SettingsModal';
import ReportModal from '@/components/dashboard/ReportModal';
import ActivityDropdown from '@/components/dashboard/ActivityDropdown';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import SurveyHistory from '@/components/dashboard/SurveyHistory';
import MatrixView from '@/components/dashboard/views/MatrixView';
import AnalyticsView from '@/components/dashboard/views/AnalyticsView';
import { useSurveyHistoryStore, useShallow, StatuteEntry } from '@/lib/store';
import { StateCode, Statute } from '@/types/statute';
import { Settings, Sun, Moon, FileText, Map, Table2, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type ViewType = 'geospatial' | 'matrix' | 'analytics';

export default function Dashboard() {
    const [selectedState, setSelectedState] = useState<StateCode | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [activeView, setActiveView] = useState<ViewType>('geospatial');
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme, resolvedTheme } = useTheme();

    // Prevent hydration mismatch by waiting for mount
    useEffect(() => {
        setMounted(true);
    }, []);

    // Get statutes from the ACTIVE SESSION (not global store)
    const activeSession = useSurveyHistoryStore(
        useShallow((state) => state.surveys.find((s) => s.id === state.activeSurveyId))
    );
    const activeSurveyId = useSurveyHistoryStore((state) => state.activeSurveyId);

    // Memoize statutes to prevent recalculation
    const statutes = useMemo<Partial<Record<StateCode, StatuteEntry>>>(() =>
        activeSession?.statutes ?? {},
        [activeSession?.statutes]
    );

    const percentComplete = useMemo(() =>
        Math.round((Object.keys(statutes).length / 50) * 100),
        [statutes]
    );

    // Get the selected statute if available from active session
    const selectedStatute: Statute | null = useMemo(() => {
        if (!selectedState) return null;
        const entry = statutes[selectedState];
        if (!entry || entry instanceof Error) return null;
        return entry;
    }, [selectedState, statutes]);

    const handleStateClick = (code: StateCode) => {
        console.log(`[Dashboard] Selected state: ${code}`);
        setSelectedState(code);
    };

    const handleCloseCard = () => {
        setSelectedState(null);
    };

    const toggleTheme = () => {
        setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    };

    const viewTabs = [
        { id: 'geospatial', label: 'Geospatial', icon: Map },
        { id: 'matrix', label: 'Matrix View', icon: Table2 },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    ] as const;

    return (
        <div className="h-screen w-full flex flex-col bg-background text-foreground font-sans overflow-hidden">
            {/* Modals */}
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
            <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} />

            {/* Top Bar */}
            <header className="flex-shrink-0 border-b border-border bg-card/80 backdrop-blur-sm z-30">
                <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="flex items-center gap-2">
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-700 to-slate-500 dark:from-slate-200 dark:to-slate-400">
                                Lawvics
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full font-medium">
                                v1.0
                            </span>
                        </Link>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="text-sm text-muted-foreground mr-2">
                            Progress: <span className="font-semibold text-primary">{percentComplete}%</span>
                        </div>
                        <div className="h-6 w-px bg-border" />
                        <ActivityDropdown />
                        <button
                            onClick={() => setIsReportOpen(true)}
                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                            title="Generate Report"
                        >
                            <FileText className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                        </button>
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                            title={mounted ? (resolvedTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode') : 'Toggle Theme'}
                        >
                            {mounted && resolvedTheme === 'dark' ? (
                                <Sun className="w-5 h-5 text-yellow-400" />
                            ) : (
                                <Moon className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                            )}
                        </button>
                        <button
                            onClick={() => setIsSettingsOpen(true)}
                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                            title="Settings"
                        >
                            <Settings className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Layout: Sidebar + Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar */}
                <DashboardSidebar activeTab="workspace" />

                {/* Center: View Switcher + Content */}
                <main className="flex-1 flex flex-col overflow-hidden">
                    {/* View Switcher Tabs */}
                    <div className="flex-shrink-0 px-4 py-2 border-b border-border bg-card/50">
                        <div className="flex items-center gap-1">
                            {viewTabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveView(tab.id)}
                                    className={cn(
                                        'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                                        activeView === tab.id
                                            ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100'
                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                    )}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* View Content */}
                    <div className="flex-1 overflow-hidden">
                        {activeView === 'geospatial' && (
                            <div className="h-full flex flex-col p-4 overflow-hidden">
                                <SearchPanel />
                                <div className="flex-1 mt-4 overflow-hidden">
                                    <USMap onStateClick={handleStateClick} />
                                </div>
                            </div>
                        )}
                        {activeView === 'matrix' && <MatrixView />}
                        {activeView === 'analytics' && <AnalyticsView />}
                    </div>
                </main>

                {/* Right Panel: State Details or History */}
                <aside className="w-72 flex-shrink-0 border-l border-border bg-card/50 overflow-auto">
                    {selectedState ? (
                        <div className="p-4">
                            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">
                                {selectedState} Details
                            </h2>
                            {selectedStatute ? (
                                <StatuteCard statute={selectedStatute} onClose={handleCloseCard} />
                            ) : (
                                <div className="bg-muted rounded-xl border border-border p-6 text-center">
                                    <p className="text-muted-foreground text-sm">
                                        {statutes[selectedState] instanceof Error
                                            ? `Error: ${(statutes[selectedState] as Error).message}`
                                            : 'No data yet. Run a search to fetch statute data.'}
                                    </p>
                                    <button
                                        onClick={handleCloseCard}
                                        className="mt-4 text-sm text-primary hover:underline"
                                    >
                                        Close
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-4">
                            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">
                                Survey History
                            </h2>
                            <SurveyHistory />
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
}
