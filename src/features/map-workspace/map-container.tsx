"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import { useMapContext } from "@/lib/map";
import { cn } from "@/lib/cn";

interface MapContainerProps {
  className?: string;
}

export function MapContainer({ className }: MapContainerProps) {
  const { containerRef, isLoaded } = useMapContext();

  return (
    <div className={cn("relative flex-1 overflow-hidden", className)}>
      <div ref={containerRef} className="absolute inset-0" />
      {!isLoaded && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-100">
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500" />
            <p className="text-xs">Loading map…</p>
          </div>
        </div>
      )}
    </div>
  );
}
