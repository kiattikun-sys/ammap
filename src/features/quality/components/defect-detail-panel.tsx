"use client";

import { useEffect, useState } from "react";
import { X, Plus, ChevronRight } from "lucide-react";
import type { Defect, DefectStatus } from "@/domains/quality/model/defect";
import type { CorrectiveAction } from "@/domains/quality/model/corrective-action";
import { updateDefectStatus } from "@/domains/quality/actions/update-defect-status";
import { updateCorrectiveAction } from "@/domains/quality/actions/update-corrective-action";
import { listCorrectiveActions } from "@/domains/quality/queries/list-corrective-actions";
import { CreateCorrectiveActionForm } from "./create-corrective-action-form";

interface DefectDetailPanelProps {
  defect: Defect;
  onClose: () => void;
  onUpdated: () => void;
}

const SEVERITY_STYLES: Record<string, string> = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

const STATUS_STYLES: Record<DefectStatus, string> = {
  open: "bg-red-50 text-red-700 border-red-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  pending_reinspection: "bg-purple-50 text-purple-700 border-purple-200",
  resolved: "bg-green-50 text-green-700 border-green-200",
  closed: "bg-slate-50 text-slate-500 border-slate-200",
};

const STATUS_LABELS: Record<DefectStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  pending_reinspection: "Pending Reinspection",
  resolved: "Resolved",
  closed: "Closed",
};

const CA_STATUS_STYLES: Record<string, string> = {
  open: "bg-slate-100 text-slate-600",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-500",
};

function getNextTransitions(status: DefectStatus): { label: string; next: DefectStatus; color: string }[] {
  switch (status) {
    case "open":
      return [{ label: "Start Work", next: "in_progress", color: "bg-blue-600 hover:bg-blue-700" }];
    case "in_progress":
      return [
        { label: "Request Reinspection", next: "pending_reinspection", color: "bg-purple-600 hover:bg-purple-700" },
      ];
    case "pending_reinspection":
      return [
        { label: "Close Defect", next: "closed", color: "bg-green-600 hover:bg-green-700" },
        { label: "Reopen (fail)", next: "in_progress", color: "bg-orange-500 hover:bg-orange-600" },
      ];
    case "resolved":
      return [{ label: "Close Defect", next: "closed", color: "bg-green-600 hover:bg-green-700" }];
    default:
      return [];
  }
}

export function DefectDetailPanel({ defect, onClose, onUpdated }: DefectDetailPanelProps) {
  const [actions, setActions] = useState<CorrectiveAction[]>([]);
  const [loadingCA, setLoadingCA] = useState(true);
  const [showCAForm, setShowCAForm] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [updatingCAId, setUpdatingCAId] = useState<string | null>(null);

  function loadActions() {
    setLoadingCA(true);
    listCorrectiveActions(defect.id)
      .then(setActions)
      .finally(() => setLoadingCA(false));
  }

  useEffect(() => {
    loadActions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defect.id]);

  async function handleTransition(next: DefectStatus) {
    setTransitioning(true);
    try {
      await updateDefectStatus(defect.id, next);
      onUpdated();
    } finally {
      setTransitioning(false);
    }
  }

  async function handleCAStatusUpdate(caId: string, status: CorrectiveAction["status"]) {
    setUpdatingCAId(caId);
    try {
      await updateCorrectiveAction(caId, { status });
      loadActions();
    } finally {
      setUpdatingCAId(null);
    }
  }

  const transitions = getNextTransitions(defect.status);
  const isOverdue = defect.dueDate && defect.status !== "closed" && new Date() > defect.dueDate;

  return (
    <div className="flex h-full w-80 shrink-0 flex-col border-l border-slate-200 bg-white">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-100 px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[defect.status]}`}>
              {STATUS_LABELS[defect.status]}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${SEVERITY_STYLES[defect.severity]}`}>
              {defect.severity}
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-800 leading-snug">{defect.title}</p>
        </div>
        <button
          onClick={onClose}
          className="ml-2 shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Description */}
        {defect.description && (
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-xs text-slate-500">{defect.description}</p>
          </div>
        )}

        {/* Meta */}
        <div className="border-b border-slate-100 px-4 py-3 space-y-1">
          {defect.dueDate && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Due</span>
              <span className={isOverdue ? "font-medium text-red-500" : "text-slate-600"}>
                {isOverdue ? "Overdue · " : ""}
                {defect.dueDate.toLocaleDateString()}
              </span>
            </div>
          )}
          {defect.assignedTo && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Assigned</span>
              <span className="text-slate-600 truncate max-w-[140px]">{defect.assignedTo}</span>
            </div>
          )}
          {defect.closedAt && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Closed</span>
              <span className="text-slate-600">{defect.closedAt.toLocaleDateString()}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Created</span>
            <span className="text-slate-600">{defect.createdAt.toLocaleDateString()}</span>
          </div>
        </div>

        {/* Lifecycle transitions */}
        {transitions.length > 0 && (
          <div className="border-b border-slate-100 px-4 py-3 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Actions</p>
            {transitions.map((t) => (
              <button
                key={t.next}
                onClick={() => handleTransition(t.next)}
                disabled={transitioning}
                className={`w-full rounded-lg py-2 text-sm font-semibold text-white transition-colors disabled:opacity-50 ${t.color}`}
              >
                {transitioning ? "Updating…" : t.label}
              </button>
            ))}
          </div>
        )}

        {/* Corrective Actions */}
        <div className="px-4 py-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              Corrective Actions ({actions.length})
            </p>
            {defect.status !== "closed" && (
              <button
                onClick={() => setShowCAForm((v) => !v)}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-blue-600 hover:bg-blue-50"
              >
                <Plus size={10} /> Add
              </button>
            )}
          </div>

          {showCAForm && (
            <div className="mb-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
              <CreateCorrectiveActionForm
                projectId={defect.projectId}
                defectId={defect.id}
                spatialNodeId={defect.spatialNodeId}
                onCreated={() => {
                  setShowCAForm(false);
                  loadActions();
                  onUpdated();
                }}
                onCancel={() => setShowCAForm(false)}
              />
            </div>
          )}

          {loadingCA ? (
            <div className="py-4 text-center text-xs text-slate-400">Loading…</div>
          ) : actions.length === 0 ? (
            <div className="py-4 text-center text-xs text-slate-400">No corrective actions yet</div>
          ) : (
            <div className="space-y-2">
              {actions.map((ca) => (
                <div key={ca.id} className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                  <div className="mb-1.5 flex items-start justify-between gap-2">
                    <p className="text-xs text-slate-700 leading-snug flex-1">{ca.actionText}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${CA_STATUS_STYLES[ca.status]}`}>
                      {ca.status.replace("_", " ")}
                    </span>
                  </div>
                  {ca.assignedToUserId && (
                    <p className="mb-1.5 text-[10px] text-slate-400 truncate">👤 {ca.assignedToUserId}</p>
                  )}
                  {ca.dueDate && (
                    <p className="mb-1.5 text-[10px] text-slate-400">
                      📅 {ca.dueDate.toLocaleDateString()}
                    </p>
                  )}
                  {ca.status !== "completed" && ca.status !== "cancelled" && (
                    <div className="flex gap-1.5 mt-2">
                      {ca.status === "open" && (
                        <button
                          disabled={updatingCAId === ca.id}
                          onClick={() => handleCAStatusUpdate(ca.id, "in_progress")}
                          className="rounded-md bg-blue-50 px-2 py-1 text-[10px] font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                        >
                          Start
                        </button>
                      )}
                      {ca.status === "in_progress" && (
                        <button
                          disabled={updatingCAId === ca.id}
                          onClick={() => handleCAStatusUpdate(ca.id, "completed")}
                          className="rounded-md bg-green-50 px-2 py-1 text-[10px] font-medium text-green-700 hover:bg-green-100 disabled:opacity-50"
                        >
                          Complete
                        </button>
                      )}
                      <button
                        disabled={updatingCAId === ca.id}
                        onClick={() => handleCAStatusUpdate(ca.id, "cancelled")}
                        className="rounded-md bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      {updatingCAId === ca.id && (
                        <span className="text-[10px] text-slate-400 self-center ml-1">Saving…</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Inspect link hint */}
      {defect.inspectionId && (
        <div className="border-t border-slate-100 px-4 py-2">
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <ChevronRight size={10} />
            <span>From inspection {defect.inspectionId.slice(0, 8)}…</span>
          </div>
        </div>
      )}
    </div>
  );
}
