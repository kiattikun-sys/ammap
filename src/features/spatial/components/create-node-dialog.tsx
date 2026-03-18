"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { createSpatialNode } from "@/domains/spatial/actions/create-spatial-node";
import type { SpatialNode } from "@/domains/spatial/model/spatial-node";
import type { SpatialTreeNode } from "@/domains/spatial/queries/get-spatial-tree";
import {
  SPATIAL_NODE_TYPES,
  VALID_PARENT_TYPES,
  validateSpatialHierarchy,
} from "@/domains/spatial/validation/create-spatial-node-schema";
import type { SpatialNodeType } from "@/domains/spatial/model/spatial-node";
import {
  NODE_TYPE_LABELS,
  NODE_TYPE_COLORS,
  NODE_TYPE_ORDER,
} from "@/domains/spatial/services/spatial-drawing-service";

interface CreateNodeDialogProps {
  projectId: string;
  allNodes: SpatialNode[];
  defaultParent?: SpatialTreeNode | null;
  onCreated: (node: SpatialNode) => void;
  onClose: () => void;
}

export function CreateNodeDialog({
  projectId,
  allNodes,
  defaultParent,
  onCreated,
  onClose,
}: CreateNodeDialogProps) {
  const [name, setName] = useState("");
  const [selectedType, setSelectedType] = useState<SpatialNodeType>(
    defaultParent
      ? getDefaultChildType(defaultParent.type as SpatialNodeType)
      : "site"
  );
  const [parentId, setParentId] = useState<string>(defaultParent?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validParentTypes = VALID_PARENT_TYPES[selectedType];
  const parentOptions = allNodes.filter((n) =>
    validParentTypes.includes(n.type as SpatialNodeType)
  );

  const selectedParent = allNodes.find((n) => n.id === parentId) ?? null;
  const hierarchyCheck = validateSpatialHierarchy(
    selectedType,
    selectedParent ? (selectedParent.type as SpatialNodeType) : null
  );

  function handleTypeChange(type: SpatialNodeType) {
    setSelectedType(type);
    setParentId("");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    if (!hierarchyCheck.valid) {
      setError(hierarchyCheck.reason ?? "Invalid hierarchy");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const node = await createSpatialNode(projectId, {
        name: trimmed,
        type: selectedType,
        parentId: parentId || null,
      });
      onCreated(node);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create node");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-bold text-slate-900">เพิ่มพื้นที่</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Node type selector */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-600 uppercase tracking-wide">
              ประเภทพื้นที่
            </label>
            <div className="flex flex-wrap gap-1.5">
              {NODE_TYPE_ORDER.map((t) => {
                const colorClass = NODE_TYPE_COLORS[t];
                const isSelected = t === selectedType;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleTypeChange(t)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold border transition-all ${
                      isSelected
                        ? `${colorClass} border-transparent ring-2 ring-offset-1 ring-blue-400`
                        : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {NODE_TYPE_LABELS[t]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name */}
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
              placeholder={getPlaceholder(selectedType)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Parent selector */}
          {validParentTypes.length > 0 && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                สังกัด (อยู่ใน){" "}
                {selectedType !== "building" && (
                  <span className="text-red-500">*</span>
                )}
              </label>
              {parentOptions.length === 0 ? (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  ยังไม่มี{" "}
                  {validParentTypes.map((t) => NODE_TYPE_LABELS[t]).join(" หรือ ")}{" "}
                  ในระบบ
                  {selectedType === "building" && " (สร้างได้โดยไม่ต้องมี parent)"}
                </p>
              ) : (
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400"
                >
                  <option value="">
                    {selectedType === "building" ? "None (root building)" : "Select parent…"}
                  </option>
                  {parentOptions.map((n) => (
                    <option key={n.id} value={n.id}>
                      {NODE_TYPE_LABELS[n.type as SpatialNodeType]} · {n.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Hierarchy validation feedback */}
          {!hierarchyCheck.valid && parentId && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
              {hierarchyCheck.reason}
            </p>
          )}

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saving || !name.trim() || !hierarchyCheck.valid}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
            >
              {saving ? "กำลังสร้าง…" : "สร้างพื้นที่"}
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

function getDefaultChildType(parentType: SpatialNodeType): SpatialNodeType {
  const map: Record<SpatialNodeType, SpatialNodeType> = {
    site: "building",
    building: "floor",
    floor: "zone",
    level: "zone",
    zone: "area",
    area: "area",
  };
  return map[parentType] ?? "site";
}

function getPlaceholder(type: SpatialNodeType): string {
  const map: Record<SpatialNodeType, string> = {
    site: "e.g. Main Construction Site",
    building: "e.g. Tower A",
    floor: "e.g. Ground Floor",
    level: "e.g. Level B1",
    zone: "e.g. North Wing",
    area: "e.g. Unit 101",
  };
  return map[type] ?? "Node name";
}
