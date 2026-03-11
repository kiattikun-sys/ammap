"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { listDefectsBySpatialNode } from "@/domains/quality/queries/list-defects-by-spatial-node";
import type { Defect, DefectStatus } from "@/domains/quality/model/defect";
import { CreateDefectForm } from "./create-defect-form";
import { DefectDetailPanel } from "./defect-detail-panel";

interface ZoneDefectPanelProps {
  projectId: string;
  zoneId: string;
  onClose: () => void;
}

const SEVERITY_DOT: Record<string, string> = {
  low: "bg-yellow-400",
  medium: "bg-orange-400",
  high: "bg-red-500",
  critical: "bg-purple-600",
};

const STATUS_BADGE: Record<DefectStatus, string> = {
  open: "bg-red-50 text-red-700",
  in_progress: "bg-blue-50 text-blue-700",
  pending_reinspection: "bg-purple-50 text-purple-700",
  resolved: "bg-green-50 text-green-700",
  closed: "bg-slate-50 text-slate-500",
};

const STATUS_LABEL: Record<DefectStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  pending_reinspection: "Pending",
  resolved: "Resolved",
  closed: "Closed",
};

export function ZoneDefectPanel({ projectId, zoneId, onClose }: ZoneDefectPanelProps) {
  const [defects, setDefects] = useState<Defect[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedDefect, setSelectedDefect] = useState<Defect | null>(null);

  function loadDefects() {
    setLoading(true);
    listDefectsBySpatialNode(zoneId)
      .then(setDefects)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadDefects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoneId]);

  if (selectedDefect) {
    return (
      <DefectDetailPanel
        defect={selectedDefect}
        onClose={() => setSelectedDefect(null)}
        onUpdated={() => {
          loadDefects();
          setSelectedDefect(null);
        }}
      />
    );
  }

  const openCount = defects.filter((d) => d.status === "open" || d.status === "in_progress").length;

  return (
    <div className="flex h-full w-80 shrink-0 flex-col border-l border-slate-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-800">Defects</p>
          <p className="text-[10px] text-slate-400">
            {defects.length} total · {openCount} open
          </p>
        </div>
        <button
          onClick={onClose}
          className="ml-2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X size={14} />
        </button>
      </div>

      {/* Create toggle */}
      <div className="border-b border-slate-100 px-4 py-3">
        {showForm ? (
          <CreateDefectForm
            projectId={projectId}
            spatialNodeId={zoneId}
            onCreated={() => {
              setShowForm(false);
              loadDefects();
            }}
            onCancel={() => setShowForm(false)}
          />
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="w-full rounded-lg bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            + Report Defect
          </button>
        )}
      </div>

      {/* Defect list */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading defects…</div>
        ) : defects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-slate-500">No defects</p>
            <p className="text-xs text-slate-400">Report a defect to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {defects.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setSelectedDefect(d)}
                className="w-full rounded-xl border border-slate-100 bg-white p-3 text-left shadow-sm hover:border-slate-200 hover:shadow-md transition-all"
              >
                <div className="mb-1.5 flex items-center gap-2">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${SEVERITY_DOT[d.severity] ?? "bg-slate-400"}`}
                    title={d.severity}
                  />
                  <p className="flex-1 truncate text-xs font-medium text-slate-800">{d.title}</p>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_BADGE[d.status]}`}>
                    {STATUS_LABEL[d.status]}
                  </span>
                </div>
                {d.description && (
                  <p className="text-[10px] text-slate-400 line-clamp-1">{d.description}</p>
                )}
                {d.dueDate && (
                  <p className={`mt-1 text-[10px] ${
                    d.status !== "closed" && new Date() > d.dueDate ? "text-red-500 font-medium" : "text-slate-400"
                  }`}>
                    📅 {d.dueDate.toLocaleDateString()}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
