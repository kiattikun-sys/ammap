"use client";

import { useState } from "react";
import { Layers, Eye, EyeOff, Map, Satellite, Sun, Moon, PenTool, X } from "lucide-react";
import { useMap } from "@/lib/map";
import { MAP_STYLES, type MapStyleId } from "@/lib/map/map-styles";
import { cn } from "@/lib/cn";
import type { DrawState } from "./spatial-drawing-controller";
import { NODE_TYPE_LABELS, NODE_TYPE_ORDER } from "@/domains/spatial/services/spatial-drawing-service";
import { TYPE_COLORS } from "@/domains/spatial/utils/spatial-to-geojson";

interface LayerState {
  id: string;
  label: string;
  visible: boolean;
}

const STYLE_ICONS: Record<MapStyleId, React.ReactNode> = {
  streets: <Map size={12} />,
  satellite: <Satellite size={12} />,
  light: <Sun size={12} />,
  dark: <Moon size={12} />,
};

interface LayerToolbarProps {
  drawState?: DrawState | null;
}

export function LayerToolbar({ drawState }: LayerToolbarProps) {
  const { setStyle, currentStyle, isLoaded } = useMap();

  const [layers, setLayers] = useState<LayerState[]>([
    { id: "zones", label: "Zones", visible: true },
    { id: "work-items", label: "Work Items", visible: true },
    { id: "defects", label: "Defects", visible: false },
    { id: "evidence", label: "Evidence", visible: false },
  ]);

  function toggleLayer(id: string) {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l))
    );
  }

  return (
    <div className="flex w-52 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-10 items-center gap-2 border-b border-slate-100 px-3">
        <Layers size={14} className="text-slate-400" />
        <span className="text-xs font-semibold text-slate-600">Layers</span>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {layers.map((layer) => (
          <div
            key={layer.id}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50"
          >
            <button
              type="button"
              onClick={() => toggleLayer(layer.id)}
              className="text-slate-400 hover:text-slate-700"
              aria-label={layer.visible ? "Hide layer" : "Show layer"}
            >
              {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
            <span
              className={cn(
                "flex-1 text-xs",
                layer.visible ? "text-slate-700" : "text-slate-400"
              )}
            >
              {layer.label}
            </span>
          </div>
        ))}
      </div>

      {drawState && (
        <div className="border-t border-slate-100 p-2">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Draw
          </p>
          <div className="flex flex-col gap-0.5">
            {NODE_TYPE_ORDER.map((type) => {
              const isActive = drawState.activeType === type;
              const color = TYPE_COLORS[type];
              return (
                <button
                  key={type}
                  onClick={() =>
                    isActive
                      ? drawState.onCancelDrawing()
                      : drawState.onStartDrawing(type)
                  }
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors",
                    isActive ? "text-white" : "text-slate-700 hover:bg-slate-50"
                  )}
                  style={isActive ? { backgroundColor: color } : {}}
                >
                  <PenTool size={11} style={{ color: isActive ? "white" : color }} />
                  {NODE_TYPE_LABELS[type]}
                </button>
              );
            })}
            {drawState.activeType && (
              <button
                onClick={drawState.onCancelDrawing}
                className="mt-0.5 flex items-center gap-2 rounded-lg border border-red-200 px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50"
              >
                <X size={11} />
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      <div className="border-t border-slate-100 p-2">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          Base Map
        </p>
        <div className="grid grid-cols-2 gap-1">
          {MAP_STYLES.map((style) => (
            <button
              key={style.id}
              type="button"
              disabled={!isLoaded}
              onClick={() => setStyle(style.id)}
              className={cn(
                "flex items-center gap-1.5 rounded border px-2 py-1.5 text-xs transition-colors",
                currentStyle === style.id
                  ? "border-blue-500 bg-blue-50 font-medium text-blue-700"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              )}
            >
              {STYLE_ICONS[style.id]}
              {style.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
