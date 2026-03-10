"use client";

import { useEffect, useState } from "react";
import { listEvidence } from "@/domains/evidence/queries/list-evidence";
import type { Evidence, EvidenceType } from "@/domains/evidence/model/evidence";

interface EvidenceGalleryProps {
  projectId: string;
  filterSpatialNodeId?: string | null;
  filterDefectId?: string | null;
  filterWorkItemId?: string | null;
  refreshKey?: number;
}

const TYPE_ICONS: Record<EvidenceType, string> = {
  photo: "🖼️",
  video: "🎬",
  document: "📄",
};

const TYPE_LABELS: Record<EvidenceType, string> = {
  photo: "Photos",
  video: "Videos",
  document: "Documents",
};

export function EvidenceGallery({
  projectId,
  filterSpatialNodeId,
  filterDefectId,
  filterWorkItemId,
  refreshKey,
}: EvidenceGalleryProps) {
  const [items, setItems] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<EvidenceType | "all">("all");
  const [selected, setSelected] = useState<Evidence | null>(null);

  useEffect(() => {
    setLoading(true);
    listEvidence({ projectId })
      .then(setItems)
      .finally(() => setLoading(false));
  }, [projectId, refreshKey]);

  const filtered = items.filter((e) => {
    if (typeFilter !== "all" && e.type !== typeFilter) return false;
    if (filterSpatialNodeId && e.spatialNodeId !== filterSpatialNodeId) return false;
    if (filterDefectId && e.defectId !== filterDefectId) return false;
    if (filterWorkItemId && e.workItemId !== filterWorkItemId) return false;
    return true;
  });

  if (loading) {
    return <div className="py-8 text-center text-sm text-slate-400">Loading evidence…</div>;
  }

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        {(["all", "photo", "video", "document"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              typeFilter === t
                ? "bg-blue-600 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {t === "all" ? `All (${items.length})` : `${TYPE_ICONS[t]} ${TYPE_LABELS[t]}`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-12 text-center">
          <p className="text-sm font-medium text-slate-500">No evidence found</p>
          <p className="mt-1 text-xs text-slate-400">Upload photos, videos, or documents above</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelected(item)}
              className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
            >
              {item.type === "photo" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.fileUrl}
                  alt={item.title}
                  className="h-32 w-full object-cover"
                />
              ) : item.type === "video" ? (
                <div className="flex h-32 flex-col items-center justify-center bg-slate-100">
                  <span className="text-3xl">🎬</span>
                </div>
              ) : (
                <div className="flex h-32 flex-col items-center justify-center bg-slate-50">
                  <span className="text-3xl">📄</span>
                </div>
              )}
              <div className="p-2">
                <p className="truncate text-xs font-medium text-slate-700">{item.title}</p>
                <p className="text-[10px] text-slate-400">
                  {item.createdAt.toLocaleDateString()}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Lightbox / detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelected(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>

            <div className="mb-4">
              {selected.type === "photo" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selected.fileUrl}
                  alt={selected.title}
                  className="max-h-96 w-full rounded-lg object-contain"
                />
              ) : selected.type === "video" ? (
                <video
                  src={selected.fileUrl}
                  controls
                  className="max-h-96 w-full rounded-lg"
                />
              ) : (
                <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-lg bg-slate-50">
                  <span className="text-4xl">📄</span>
                  <a
                    href={selected.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    Open Document
                  </a>
                </div>
              )}
            </div>

            <h3 className="text-base font-semibold text-slate-900">{selected.title}</h3>
            {selected.description && (
              <p className="mt-1 text-sm text-slate-500">{selected.description}</p>
            )}
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
              <span>{TYPE_ICONS[selected.type]} {selected.type}</span>
              {selected.capturedAt && (
                <span>📅 {selected.capturedAt.toLocaleDateString()}</span>
              )}
              {selected.locationLat != null && selected.locationLng != null && (
                <span>📍 {selected.locationLat.toFixed(5)}, {selected.locationLng.toFixed(5)}</span>
              )}
              {selected.capturedBy && <span>👤 {selected.capturedBy}</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
