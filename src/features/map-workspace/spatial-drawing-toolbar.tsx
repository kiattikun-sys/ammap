"use client";

import { PenTool, X } from "lucide-react";
import type { SpatialNodeType } from "@/domains/spatial/model/spatial-node";
import { NODE_TYPE_LABELS, NODE_TYPE_ORDER } from "@/domains/spatial/services/spatial-drawing-service";
import { TYPE_COLORS } from "@/domains/spatial/utils/spatial-to-geojson";

interface SpatialDrawingToolbarProps {
  activeType: SpatialNodeType | null;
  onStartDrawing: (type: SpatialNodeType) => void;
  onCancelDrawing: () => void;
}

export function SpatialDrawingToolbar({
  activeType,
  onStartDrawing,
  onCancelDrawing,
}: SpatialDrawingToolbarProps) {
  return (
    <div className="absolute left-3 top-3 z-10 flex flex-col gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
      <p className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
        Draw
      </p>
      {NODE_TYPE_ORDER.map((type) => {
        const isActive = activeType === type;
        const color = TYPE_COLORS[type];
        return (
          <button
            key={type}
            onClick={() => (isActive ? onCancelDrawing() : onStartDrawing(type))}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              isActive
                ? "text-white"
                : "text-slate-700 hover:bg-slate-50"
            }`}
            style={isActive ? { backgroundColor: color } : {}}
            title={isActive ? `Cancel drawing ${NODE_TYPE_LABELS[type]}` : `Draw ${NODE_TYPE_LABELS[type]}`}
          >
            <PenTool size={12} style={{ color: isActive ? "white" : color }} />
            {NODE_TYPE_LABELS[type]}
          </button>
        );
      })}

      {activeType && (
        <button
          onClick={onCancelDrawing}
          className="mt-1 flex items-center gap-2 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50"
        >
          <X size={12} />
          Cancel
        </button>
      )}
    </div>
  );
}
