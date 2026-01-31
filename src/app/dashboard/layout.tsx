'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSurveyHistoryStore, useShallow, StatuteEntry } from '@/lib/store';
import { StateCode } from '@/types/statute';
import { Map, Table2, BarChart3, FileText, Settings } from 'lucide-react';
import ActivityDropdown from '@/components/dashboard/ActivityDropdown';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import SurveyHistory from '@/components/dashboard/SurveyHistory';
import StatuteDetailPanel from '@/components/dashboard/StatuteDetailPanel';
import ReportModal from '@/components/dashboard/ReportModal';
import { cn } from '@/lib/utils';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { MaintenanceOverlay } from '@/components/dashboard/MaintenanceOverlay';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [isMaintenance, setIsMaintenance] = useState(false);

    // Check Maintenance Mode
    useEffect(() => {
        fetch('/api/admin/config')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.data?.maintenance_mode) {
                    setIsMaintenance(true);
                }
            })
            .catch(err => console.error('Failed to check maintenance mode', err));
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


    const tabs = [
        { id: 'geospatial', label: 'Geospatial', icon: Map, href: '/dashboard' },
        { id: 'matrix', label: 'Matrix View', icon: Table2, href: '/dashboard/matrix' },
        { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '/dashboard/analytics' },
        { id: 'brief', label: 'Brief', icon: FileText, href: '/dashboard/brief' },
    ];

    // Helper to determine if a tab is active
    const isTabActive = (href: string) => {
        if (href === '/dashboard' && pathname === '/dashboard') return true;
        if (href !== '/dashboard' && pathname?.startsWith(href)) return true;
        return false;
    };

    return (
        <div className="h-screen w-full flex flex-col bg-background text-foreground font-sans overflow-hidden relative">
            {isMaintenance && !pathname?.startsWith('/dashboard/admin') && <MaintenanceOverlay />}
            <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} />
            <StatuteDetailPanel />

            {/* Global Header */}
            <header className="flex-shrink-0 border-b border-border bg-card/80 backdrop-blur-sm z-40">
                <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2">
                            <BrandLogo height={32} />
                            <span className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-muted-foreground border border-border">v1.0</span>
                        </Link>

                        {/* View Tabs */}
                        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
                            {tabs.map((tab) => {
                                const active = isTabActive(tab.href);
                                return (
                                    <Link
                                        key={tab.id}
                                        href={tab.href}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                                            active
                                                ? "bg-background text-foreground shadow-sm"
                                                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                                        )}
                                    >
                                        <tab.icon className="w-4 h-4" />
                                        {tab.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <span>Progress:</span>
                            <span className="font-semibold text-primary">{percentComplete}%</span>
                        </div>

                        <div className="h-4 w-px bg-border" />

                        <ActivityDropdown />

                        {/* Settings Link */}
                        <Link
                            href="/dashboard/settings"
                            className={cn(
                                "p-2 rounded-lg transition-colors",
                                pathname === '/dashboard/settings'
                                    ? "text-primary bg-primary/10"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            )}
                        >
                            <Settings className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Layout Body */}
            <div className="flex-1 flex overflow-hidden">
                <DashboardSidebar
                    activeTab={
                        pathname?.startsWith('/dashboard/history') ? 'history' :
                            pathname?.startsWith('/dashboard/settings') ? 'settings' :
                                pathname?.startsWith('/dashboard/saved') ? 'saved' :
                                    'workspace'
                    }
                />

                <main className="flex-1 flex flex-col overflow-hidden relative">
                    {/* Content */}
                    {children}
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
