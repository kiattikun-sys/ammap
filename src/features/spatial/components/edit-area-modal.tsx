"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { updateSpatialNode } from "@/domains/spatial/actions/update-spatial-node";
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

interface EditAreaModalProps {
  node: SpatialNode;
  onSaved: (updated: SpatialNode) => void;
  onClose: () => void;
}

export function EditAreaModal({ node, onSaved, onClose }: EditAreaModalProps) {
  const [name, setName] = useState(node.name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const typeKey = node.type as SpatialNodeType;
  const label = AREA_TYPE_LABELS[typeKey] ?? node.type;
  const colorClass = NODE_TYPE_COLORS[typeKey] ?? "bg-slate-100 text-slate-600";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed === node.name) { onClose(); return; }
    setSaving(true);
    setError(null);
    try {
      const updated = await updateSpatialNode(node.id, { name: trimmed });
      onSaved(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกล้มเหลว");
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-bold text-slate-900">แก้ไขข้อมูลพื้นที่</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Current type badge */}
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">ประเภทพื้นที่</p>
            <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${colorClass}`}>
              {label}
            </span>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600 uppercase tracking-wide">
              ชื่อพื้นที่ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
            >
              {saving ? "กำลังบันทึก…" : "บันทึก"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              ยกเลิก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
