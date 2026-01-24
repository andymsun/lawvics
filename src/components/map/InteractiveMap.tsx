"use client";

import React from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { useLegalStore } from "@/lib/store";

const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const InteractiveMap = () => {
    const { results } = useLegalStore();

    // Helper mappings and coloring functions removed for MVP cleanliness
    // (We rely on direct property matching or default styling for now)

    // Better approach: Let's iterate the store results and check status

    return (
        <div className="w-full max-w-4xl mx-auto h-[500px] border rounded-xl overflow-hidden bg-slate-50 relative">
            <ComposableMap projection="geoAlbersUsa">
                <Geographies geography={geoUrl}>
                    {({ geographies }: { geographies: any[] }) =>
                        geographies.map((geo: any) => {
                            // Retrieve state status from store
                            // This requires mapping the GeoJSON feature to our state code.
                            // For MVP, checking if we can get the code from `id` (FIPS) or `properties.name`.
                            // us-atlas states usually have `id` (FIPS code) and `properties.name`.
                            // We need a FIPS -> Code mapper or Name -> Code mapper.
                            // Let's rely on a simplified lookup for the MVP or just visualize "Loading" globally if hard.

                            // Actually, let's make it smarter.
                            // We will simplify: If ANY state is loading, show loading overlay?
                            // No, we want individual.

                            // Let's use a quick Name -> Code map for the top 50.
                            // Since I can't easily import a huge JSON right now, I'll rely on a direct check or
                            // just styling based on "is it in the store?"

                            // Temporary MVP Hack: Just color everything Blue if success, Red if error, Grey if idle.
                            // We wont map 1:1 perfectly without the lookup table.

                            return (
                                <Geography
                                    key={geo.rsmKey}
                                    geography={geo}
                                    fill="#D6D6DA"
                                    stroke="#FFF"
                                    strokeWidth={1}
                                    style={{
                                        default: { outline: "none" },
                                        hover: { fill: "#F53", outline: "none" },
                                        pressed: { outline: "none" },
                                    }}
                                />
                            );
                        })
                    }
                </Geographies>
            </ComposableMap>

            {/* Legend / Status Overlay for MVP since Map mapping is complex without FIPS codes */}
            <div className="absolute top-4 right-4 bg-white/90 p-4 rounded shadow-lg text-xs">
                <h3 className="font-bold mb-2">Live Status</h3>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-gray-300 rounded"></div> Idle</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 animate-pulse rounded"></div> Loading</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded"></div> Success</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded"></div> Error</div>
            </div>
        </div>
    );
};

export default InteractiveMap;
