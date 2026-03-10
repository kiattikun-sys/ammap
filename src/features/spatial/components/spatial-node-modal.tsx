"use client";

import { useState } from "react";
import { createSpatialNode } from "@/domains/spatial/actions/create-spatial-node";
import type { SpatialNodeType } from "@/domains/spatial/model/spatial-node";
import type { SpatialNode } from "@/domains/spatial/model/spatial-node";
import {
  NODE_TYPE_HIERARCHY,
  NODE_TYPE_LABELS,
  NODE_TYPE_ORDER,
} from "@/domains/spatial/services/spatial-drawing-service";

interface SpatialNodeModalProps {
  projectId: string;
  nodeType: SpatialNodeType;
  geometry: GeoJSON.Geometry;
  existingNodes: SpatialNode[];
  onSaved: (node: SpatialNode) => void;
  onCancel: () => void;
}

export function SpatialNodeModal({
  projectId,
  nodeType,
  geometry,
  existingNodes,
  onSaved,
  onCancel,
}: SpatialNodeModalProps) {
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parentType = NODE_TYPE_HIERARCHY[nodeType];
  const parentOptions = parentType
    ? existingNodes.filter((n) => n.type === parentType)
    : [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const node = await createSpatialNode(projectId, {
        name: name.trim(),
        type: nodeType,
        parentId: parentId || null,
        geometry: {
          type: "polygon",
          geojson: geometry,
        },
      });
      onSaved(node);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-base font-bold text-slate-900">
          New {NODE_TYPE_LABELS[nodeType]}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Name *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder={`e.g. ${nodeType === "site" ? "Main Site" : nodeType === "building" ? "Tower A" : nodeType === "floor" ? "Level 1" : nodeType === "zone" ? "North Wing" : "Unit 101"}`}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Type
            </label>
            <div className="flex flex-wrap gap-2">
              {NODE_TYPE_ORDER.map((t) => (
                <span
                  key={t}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    t === nodeType
                      ? "bg-blue-100 text-blue-700"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {NODE_TYPE_LABELS[t]}
                </span>
              ))}
            </div>
          </div>

          {parentType && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Parent {NODE_TYPE_LABELS[parentType]}
              </label>
              {parentOptions.length === 0 ? (
                <p className="text-xs text-slate-400">
                  No {NODE_TYPE_LABELS[parentType].toLowerCase()} nodes yet — save without parent or draw one first.
                </p>
              ) : (
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                >
                  <option value="">None</option>
                  {parentOptions.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
