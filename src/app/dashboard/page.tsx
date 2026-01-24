'use client';

import USMap from '@/components/map/USMap';
import SearchPanel from '@/components/ui/SearchPanel';

export default function Dashboard() {
    return (
        <div className="h-full flex flex-col p-4 overflow-hidden">
            <SearchPanel />
            <div className="flex-1 mt-4 overflow-hidden">
                <USMap />
            </div>
        </div>
    );
}
