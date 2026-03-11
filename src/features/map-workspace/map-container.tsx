"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef, useState } from "react";
import { useMapContext } from "@/lib/map";
import { cn } from "@/lib/cn";
import { MAP_ACCESS_TOKEN } from "@/lib/map/map-config";

interface MapContainerProps {
  className?: string;
}

export function MapContainer({ className }: MapContainerProps) {
  const { containerRef, isLoaded } = useMapContext();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [debugInfo, setDebugInfo] = useState<string>("checking…");

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const update = () => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const token = MAP_ACCESS_TOKEN ? MAP_ACCESS_TOKEN.slice(0, 15) + "…" : "EMPTY ❌";
      setDebugInfo(`container: ${w}×${h} | token: ${token} | loaded: ${isLoaded}`);
    };
    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    return () => obs.disconnect();
  }, [isLoaded]);

  return (
    <div
      ref={wrapperRef}
      className={cn("relative overflow-hidden", className)}
      style={{ flex: 1, minHeight: 0, height: "100%" }}
    >
      <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />
      {!isLoaded && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-100">
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500" />
            <p className="text-xs">Loading map…</p>
            <p className="mt-2 rounded bg-black/70 px-2 py-1 text-[10px] text-white font-mono">{debugInfo}</p>
          </div>
        </div>
      )}
    </div>
  );
}
