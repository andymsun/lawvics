'use client';


import { useSurveyHistoryStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    History,
    Settings,
    TrendingUp,
    CheckCircle,
    AlertCircle,
    BarChart3,
    Bookmark,
} from 'lucide-react';
import Link from 'next/link';

interface DashboardSidebarProps {
    activeTab?: 'workspace' | 'history' | 'saved' | 'settings';
}

export function DashboardSidebar({ activeTab = 'workspace' }: DashboardSidebarProps) {
    const surveys = useSurveyHistoryStore((state) => state.surveys);

    // Calculate metrics
    const totalSurveys = surveys.length;
    const completedSurveys = surveys.filter((s) => s.status === 'completed').length;
    const totalSuccess = surveys.reduce((acc, s) => acc + s.successCount, 0);
    const totalErrors = surveys.reduce((acc, s) => acc + s.errorCount, 0);

    // Calculate Risk (Low confidence or Suspicious)
    const totalRisk = surveys.reduce((acc, survey) => {
        const riskInSurvey = Object.values(survey.statutes || {}).filter(entry => {
            if (!entry || entry instanceof Error) return false;
            return entry.confidenceScore < 85 || entry.trustLevel === 'suspicious';
        }).length;
        return acc + riskInSurvey;
    }, 0);

    const successRate = totalSuccess + totalErrors > 0
        ? Math.round((totalSuccess / (totalSuccess + totalErrors)) * 100)
        : 0;

    const navItems = [
        { id: 'workspace', label: 'Workspace', icon: LayoutDashboard, href: '/dashboard' },
        { id: 'history', label: 'History', icon: History, href: '/dashboard/history' },
        { id: 'saved', label: 'Saved', icon: Bookmark, href: '/dashboard/saved' },
    ];

    return (
        <aside className="w-64 flex-shrink-0 border-r border-border bg-card/50 flex flex-col h-full overflow-hidden">
            {/* Navigation */}
            <nav className="p-4 space-y-1">
                {navItems.map((item) => (
                    <Link
                        key={item.id}
                        href={item.href}
                        className={cn(
                            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                            activeTab === item.id
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                    >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                    </Link>
                ))}
            </nav>

            {/* Divider */}
            <div className="px-4">
                <div className="h-px bg-border" />
            </div>

            {/* Metrics */}
            <div className="p-4 space-y-4 flex-1 overflow-auto">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Metrics
                </h3>

                <div className="space-y-3">
                    {/* Total Surveys */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <BarChart3 className="w-4 h-4" />
                            Total Surveys
                        </div>
                        <span className="text-sm font-semibold">{totalSurveys}</span>
                    </div>

                    {/* Success Rate */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <TrendingUp className="w-4 h-4" />
                            Success Rate
                        </div>
                        <span className={cn(
                            'text-sm font-semibold',
                            successRate >= 80 ? 'text-green-500' : successRate >= 50 ? 'text-risk' : 'text-error'
                        )}>
                            {successRate}%
                        </span>
                    </div>

                    {/* States Verified */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle className="w-4 h-4" />
                            States Verified
                        </div>
                        <span className="text-sm font-semibold text-green-500">{totalSuccess}</span>
                    </div>

                    {/* At Risk */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <AlertCircle className="w-4 h-4" />
                            At Risk
                        </div>
                        <span className="text-sm font-semibold text-risk">{totalRisk}</span>
                    </div>

                    {/* Errors */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <AlertCircle className="w-4 h-4" />
                            Errors
                        </div>
                        <span className="text-sm font-semibold text-error">{totalErrors}</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border mt-auto">
                <div className="text-xs text-muted-foreground text-center">
                    Lawvics v1.0
                </div>
            </div>
        </aside >
    );
}

export default DashboardSidebar;
