'use client';

import { useState, useMemo, useEffect } from 'react';
// import { useTheme } from 'next-themes';
import USMap from '@/components/map/USMap';
import SearchPanel from '@/components/ui/SearchPanel';
import SettingsModal from '@/components/ui/SettingsModal';
import ReportModal from '@/components/dashboard/ReportModal';
import ActivityDropdown from '@/components/dashboard/ActivityDropdown';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import SurveyHistory from '@/components/dashboard/SurveyHistory';
import MatrixView from '@/components/dashboard/views/MatrixView';
import AnalyticsView from '@/components/dashboard/views/AnalyticsView';
import StatuteDetailPanel from '@/components/dashboard/StatuteDetailPanel';
import { useSurveyHistoryStore, useShallow, StatuteEntry } from '@/lib/store';
import { StateCode } from '@/types/statute';
import { Settings, Sun, Moon, FileText, Map, Table2, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type ViewType = 'geospatial' | 'matrix' | 'analytics';

export default function Dashboard() {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [activeView, setActiveView] = useState<ViewType>('geospatial');
    const [mounted, setMounted] = useState(false);
    // const { theme, setTheme, resolvedTheme } = useTheme();

    // Prevent hydration mismatch by waiting for mount
    useEffect(() => {
        setMounted(true);
    }, []);

    // Get statutes from the ACTIVE SESSION for progress bar
    const activeSession = useSurveyHistoryStore(
        useShallow((state) => state.surveys.find((s) => s.id === state.activeSurveyId))
    );

    const statutes = useMemo<Partial<Record<StateCode, StatuteEntry>>>(() =>
        activeSession?.statutes ?? {},
        [activeSession?.statutes]
    );

    const percentComplete = useMemo(() =>
        Math.round((Object.keys(statutes).length / 50) * 100),
        [statutes]
    );

    const toggleTheme = () => {
        // setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    };

    const viewTabs = [
        { id: 'geospatial', label: 'Geospatial', icon: Map },
        { id: 'matrix', label: 'Matrix View', icon: Table2 },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    ] as const;

    return (
        <div className="h-screen w-full flex flex-col bg-background text-foreground font-sans overflow-hidden">
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
            <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} />
            <StatuteDetailPanel />

            <header className="flex-shrink-0 border-b border-border bg-card/80 backdrop-blur-sm z-30">
                <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="flex items-center gap-2">
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-700 to-slate-500 dark:from-slate-200 dark:to-slate-400">
                                Lawvics
                            </span>
                        </Link>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="text-sm text-muted-foreground mr-2">
                            Progress: <span className="font-semibold text-primary">{percentComplete}%</span>
                        </div>
                        <ActivityDropdown />
                        <button onClick={toggleTheme}>Toggle Theme</button>
                        <button onClick={() => setIsSettingsOpen(true)}>Settings</button>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                <DashboardSidebar activeTab="workspace" />
                <main className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-shrink-0 px-4 py-2 border-b border-border bg-card/50">
                        {/* Tabs */}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        {activeView === 'geospatial' && (
                            <div className="h-full flex flex-col p-4 overflow-hidden">
                                <SearchPanel />
                                <div className="flex-1 mt-4 overflow-hidden">
                                    <USMap />
                                </div>
                            </div>
                        )}
                        {activeView === 'matrix' && <MatrixView />}
                        {activeView === 'analytics' && <AnalyticsView />}
                    </div>
                </main>
                <aside className="w-72 flex-shrink-0 border-l border-border bg-card/50 overflow-auto">
                    <div className="p-4">
                        <SurveyHistory />
                    </div>
                </aside>
            </div>
        </div>
    );
}
