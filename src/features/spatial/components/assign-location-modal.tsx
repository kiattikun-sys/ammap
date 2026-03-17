"use client";

import { useState } from "react";
import { MapPin, X } from "lucide-react";
import { updateSpatialNodeGeometry } from "@/domains/spatial/actions/update-spatial-node-geometry";
import type { SpatialNode } from "@/domains/spatial/model/spatial-node";
import { NODE_TYPE_COLORS } from "@/domains/spatial/services/spatial-drawing-service";
import type { SpatialNodeType } from "@/domains/spatial/model/spatial-node";

const AREA_TYPE_LABELS: Record<SpatialNodeType, string> = {
  site: "Site",
  building: "Building",
  floor: "Floor",
  level: "Level",
  zone: "Zone",
  area: "Area",
};

interface AssignLocationModalProps {
  node: SpatialNode;
  geometry: GeoJSON.Geometry;
  onSaved: (updated: SpatialNode) => void;
  onCancel: () => void;
}

export function AssignLocationModal({
  node,
  geometry,
  onSaved,
  onCancel,
}: AssignLocationModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const typeKey = node.type as SpatialNodeType;
  const label = AREA_TYPE_LABELS[typeKey] ?? node.type;
  const colorClass = NODE_TYPE_COLORS[typeKey] ?? "bg-slate-100 text-slate-600";

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateSpatialNodeGeometry(node.id, geometry);
      onSaved(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกล้มเหลว");
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-blue-500" />
            <h2 className="text-sm font-bold text-slate-900">กำหนดตำแหน่งบนแผนที่</h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          {/* Target node info */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              พื้นที่เป้าหมาย
            </p>
            <div className="flex items-center gap-2">
              <span className={`rounded px-2 py-0.5 text-xs font-bold ${colorClass}`}>
                {label}
              </span>
              <span className="text-sm font-semibold text-slate-800">{node.name}</span>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            ตำแหน่งที่วาดบนแผนที่จะถูกบันทึกเป็นตำแหน่งของพื้นที่นี้
            ไม่มีการสร้างพื้นที่ใหม่
          </p>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "กำลังบันทึก…" : "บันทึกตำแหน่ง"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
