import { Layers, ChevronRight } from "lucide-react";

interface Zone {
  id: string;
  name: string;
  type: string;
  childCount: number;
}

const placeholderZones: Zone[] = [
  { id: "z1", name: "Zone A - North Wing", type: "Building", childCount: 4 },
  { id: "z2", name: "Zone B - South Wing", type: "Building", childCount: 3 },
  { id: "z3", name: "Level 1", type: "Floor", childCount: 12 },
  { id: "z4", name: "Level 2", type: "Floor", childCount: 10 },
];

export function SpatialSelectionPanel() {
  return (
    <div className="flex w-64 shrink-0 flex-col border-l border-slate-200 bg-white">
      <div className="flex h-10 items-center gap-2 border-b border-slate-100 px-3">
        <Layers size={14} className="text-slate-400" />
        <span className="text-xs font-semibold text-slate-600">Spatial Selection</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="p-3">
          <input
            type="search"
            placeholder="Search zones..."
            className="w-full rounded border border-slate-200 px-2 py-1.5 text-xs text-slate-700 placeholder-slate-400 outline-none focus:border-blue-400"
          />
        </div>
        <div>
          {placeholderZones.map((zone) => (
            <button
              key={zone.id}
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-slate-50"
            >
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-blue-50 text-[10px] font-bold text-blue-600">
                {zone.type[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-xs font-medium text-slate-800">{zone.name}</p>
                <p className="text-[10px] text-slate-400">
                  {zone.type} · {zone.childCount} items
                </p>
              </div>
              <ChevronRight size={12} className="shrink-0 text-slate-300" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
