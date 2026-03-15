"use client";

import Link from "next/link";
import type { Route } from "next";
import { useTransition } from "react";
import type { Defect, DefectStatus, DefectSeverity } from "@/domains/quality/model/defect";
import type { OrgProfile } from "@/domains/profiles/queries/list-org-profiles";
import { updateDefectStatus } from "@/domains/quality/actions/update-defect-status";
import { cn } from "@/lib/cn";

interface DefectsPageClientProps {
  projectId: string;
  defects: Defect[];
  profiles: OrgProfile[];
  activeStatus?: string;
  activeSeverity?: string;
}

const SEVERITY_COLORS: Record<DefectSeverity, string> = {
  critical: "bg-red-100 text-red-800 border-red-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low: "bg-slate-100 text-slate-700 border-slate-200",
};

const STATUS_COLORS: Record<DefectStatus, string> = {
  open: "bg-red-50 text-red-700",
  in_progress: "bg-blue-50 text-blue-700",
  pending_reinspection: "bg-purple-50 text-purple-700",
  resolved: "bg-teal-50 text-teal-700",
  closed: "bg-green-50 text-green-700",
};

const NEXT_TRANSITIONS: Record<DefectStatus, DefectStatus | null> = {
  open: "in_progress",
  in_progress: "pending_reinspection",
  pending_reinspection: "closed",
  resolved: "closed",
  closed: null,
};

const TRANSITION_LABELS: Record<DefectStatus, string> = {
  open: "Start",
  in_progress: "Request Reinspection",
  pending_reinspection: "Close",
  resolved: "Close",
  closed: "",
};

function resolveAssignee(profiles: OrgProfile[], id: string | null): string {
  if (!id) return "—";
  return profiles.find((p) => p.id === id)?.displayName ?? id.slice(0, 8);
}

function DefectRow({
  defect,
  profiles,
}: {
  defect: Defect;
  profiles: OrgProfile[];
}) {
  const [isPending, startTransition] = useTransition();
  const nextStatus = NEXT_TRANSITIONS[defect.status];

  function handleTransition() {
    if (!nextStatus) return;
    startTransition(async () => {
      await updateDefectStatus(defect.id, nextStatus);
    });
  }

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-4 py-3">
        <p className="font-medium text-slate-800">{defect.title}</p>
        {defect.description && (
          <p className="mt-0.5 truncate text-xs text-slate-400 max-w-xs">{defect.description}</p>
        )}
      </td>
      <td className="px-4 py-3">
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 text-xs font-semibold",
            SEVERITY_COLORS[defect.severity]
          )}
        >
          {defect.severity}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_COLORS[defect.status])}>
          {defect.status.replace(/_/g, " ")}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-slate-500">
        {resolveAssignee(profiles, defect.assignedTo)}
      </td>
      <td className="px-4 py-3 text-xs text-slate-500">
        {defect.dueDate ? new Date(defect.dueDate).toLocaleDateString() : "—"}
      </td>
      <td className="px-4 py-3">
        {nextStatus ? (
          <button
            onClick={handleTransition}
            disabled={isPending}
            className="rounded bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50 transition-colors"
          >
            {isPending ? "…" : TRANSITION_LABELS[defect.status]}
          </button>
        ) : (
          <span className="text-xs text-slate-300">Closed</span>
        )}
      </td>
    </tr>
  );
}

const STATUS_TABS = [
  { value: undefined, label: "All" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "pending_reinspection", label: "Reinspection" },
  { value: "closed", label: "Closed" },
];

const SEVERITY_FILTERS = [
  { value: undefined, label: "All Severity" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export function DefectsPageClient({
  projectId,
  defects,
  profiles,
  activeStatus,
  activeSeverity,
}: DefectsPageClientProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-xl font-semibold text-slate-800">Defects</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          {defects.length} defect{defects.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6">
        <div className="flex gap-1">
          {STATUS_TABS.map((tab) => {
            const isActive = activeStatus === tab.value;
            const href = (tab.value
              ? `/projects/${projectId}/defects?status=${tab.value}${activeSeverity ? `&severity=${activeSeverity}` : ""}`
              : `/projects/${projectId}/defects${activeSeverity ? `?severity=${activeSeverity}` : ""}`) as Route;
            return (
              <Link
                key={tab.value ?? "all"}
                href={href}
                className={cn(
                  "border-b-2 px-3 py-2.5 text-sm transition-colors",
                  isActive
                    ? "border-blue-600 font-medium text-blue-700"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
        <div className="flex gap-2">
          {SEVERITY_FILTERS.map((f) => {
            const isActive = activeSeverity === f.value;
            const href = (f.value
              ? `/projects/${projectId}/defects?severity=${f.value}${activeStatus ? `&status=${activeStatus}` : ""}`
              : `/projects/${projectId}/defects${activeStatus ? `?status=${activeStatus}` : ""}`) as Route;
            return (
              <Link
                key={f.value ?? "all-sev"}
                href={href}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs transition-colors",
                  isActive
                    ? "border-blue-300 bg-blue-50 text-blue-700 font-medium"
                    : "border-slate-200 text-slate-500 hover:border-slate-300"
                )}
              >
                {f.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {defects.length === 0 ? (
          <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-slate-200 text-sm text-slate-400">
            No defects found.
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Title</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Severity</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Assigned To</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Due Date</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {defects.map((defect) => (
                  <DefectRow key={defect.id} defect={defect} profiles={profiles} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
