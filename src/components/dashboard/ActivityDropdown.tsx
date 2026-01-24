'use client';

import { useState } from 'react';
import { Bell, CheckCircle, AlertCircle, Info, FileSearch, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotificationStore, Activity } from '@/lib/store';

function getActivityIcon(iconType: Activity['icon']) {
    switch (iconType) {
        case 'survey':
            return <FileSearch className="h-4 w-4" />;
        case 'error':
            return <AlertCircle className="h-4 w-4" />;
        case 'success':
            return <CheckCircle className="h-4 w-4" />;
        case 'info':
        default:
            return <Info className="h-4 w-4" />;
    }
}

function getIconColor(iconType: Activity['icon']) {
    switch (iconType) {
        case 'error':
            return 'text-red-500';
        case 'success':
            return 'text-green-500';
        case 'survey':
            return 'text-blue-500';
        default:
            return 'text-muted-foreground';
    }
}

export function ActivityDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const notifications = useNotificationStore((state) => state.notifications);
    const clearNotifications = useNotificationStore((state) => state.clearNotifications);

    const hasNotifications = notifications.length > 0;

    return (
        <div className="relative">
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    'relative p-2 rounded-lg transition-colors',
                    'hover:bg-muted',
                    isOpen && 'bg-muted'
                )}
            >
                <Bell className="h-5 w-5 text-muted-foreground" />
                {hasNotifications && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Content */}
                    <div
                        className={cn(
                            'absolute right-0 top-12 z-50 w-80 rounded-2xl shadow-2xl overflow-hidden',
                            'bg-card border border-border',
                            'shadow-xl shadow-black/10 dark:shadow-black/50'
                        )}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-border">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                                    <Bell className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-foreground">
                                        {hasNotifications ? `${notifications.length} Activities` : 'No Activities'}
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        Recent system events
                                    </p>
                                </div>
                            </div>
                            {hasNotifications && (
                                <button
                                    onClick={clearNotifications}
                                    className="text-xs text-primary hover:underline"
                                >
                                    Clear all
                                </button>
                            )}
                        </div>

                        {/* Activity List */}
                        <div className="max-h-80 overflow-auto">
                            {hasNotifications ? (
                                <div className="p-2 space-y-1">
                                    {notifications.map((activity, index) => (
                                        <div
                                            key={activity.id}
                                            className={cn(
                                                'flex items-start gap-3 rounded-xl p-3',
                                                'transition-all duration-300',
                                                'hover:bg-muted'
                                            )}
                                            style={{
                                                animationDelay: `${index * 50}ms`,
                                            }}
                                        >
                                            <div className={cn(
                                                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted',
                                                getIconColor(activity.icon)
                                            )}>
                                                {getActivityIcon(activity.icon)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-medium text-foreground">
                                                    {activity.title}
                                                </h4>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {activity.description}
                                                </p>
                                            </div>
                                            <span className="text-xs text-muted-foreground shrink-0">
                                                {activity.time}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-muted-foreground">
                                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No recent activities</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default ActivityDropdown;
