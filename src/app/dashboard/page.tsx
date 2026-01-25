'use client';

import USMap from '@/components/map/USMap';
import SearchPanel from '@/components/ui/SearchPanel';
import { Suspense } from 'react';

export default function Dashboard() {
    return (
        <div className="h-full flex flex-col p-4 overflow-hidden">
            <Suspense fallback={<div className="w-full h-24 animate-pulse bg-slate-100 dark:bg-slate-800 rounded-xl" />}>
                <SearchPanel />
            </Suspense>
            <div className="flex-1 mt-4 overflow-hidden">
                <USMap />
            </div>
        </div>
    );
}
