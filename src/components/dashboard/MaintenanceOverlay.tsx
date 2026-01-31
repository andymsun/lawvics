import { AlertTriangle, Wrench } from 'lucide-react';
import React from 'react';

export const MaintenanceOverlay = () => {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm p-4 text-center animate-in fade-in duration-300">
            <div className="w-full max-w-md space-y-8">
                {/* Icon */}
                <div className="relative mx-auto w-24 h-24 flex items-center justify-center bg-amber-500/10 rounded-full mb-6 ring-4 ring-amber-500/5">
                    <Wrench className="w-10 h-10 text-amber-500 animate-pulse" />
                    <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-2 border border-border shadow-sm">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                    </div>
                </div>

                {/* Text */}
                <div className="space-y-4">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        System Under Maintenance
                    </h1>
                    <p className="text-muted-foreground text-lg leading-relaxed">
                        We're currently performing scheduled upgrades to the Lawvics engine. Access is temporarily restricted.
                    </p>
                </div>

                {/* Status Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-sm font-medium border border-amber-500/20">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                    Maintenance Mode Active
                </div>

                <p className="text-xs text-muted-foreground pt-8">
                    Contact your administrator for more information.
                </p>
            </div>
        </div>
    );
};
