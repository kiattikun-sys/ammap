"use client";

import Link from "next/link";
import type { Route } from "next";
import { useTransition } from "react";
import type { Inspection, InspectionStatus } from "@/domains/quality/model/inspection";
import type { OrgProfile } from "@/domains/profiles/queries/list-org-profiles";
import { updateInspection } from "@/domains/quality/actions/update-inspection";
import { cn } from "@/lib/cn";

interface QualityPageClientProps {
  projectId: string;
  inspections: Inspection[];
  profiles: OrgProfile[];
  activeStatus?: string;
}

const STATUS_COLORS: Record<InspectionStatus, string> = {
  scheduled: "bg-slate-100 text-slate-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
};

const RESULT_COLORS: Record<string, string> = {
  pass: "text-green-600 font-semibold",
  fail: "text-red-600 font-semibold",
  conditional_pass: "text-yellow-600 font-semibold",
};

const NEXT_TRANSITIONS: Record<InspectionStatus, InspectionStatus | null> = {
  scheduled: "in_progress",
  in_progress: "completed",
  completed: null,
};

const TRANSITION_LABELS: Record<InspectionStatus, string> = {
  scheduled: "Start",
  in_progress: "Complete",
  completed: "",
};

function resolveAssignee(profiles: OrgProfile[], id: string | null): string {
  if (!id) return "—";
  return profiles.find((p) => p.id === id)?.displayName ?? id.slice(0, 8);
}

function InspectionRow({
  inspection,
  profiles,
}: {
  inspection: Inspection;
  profiles: OrgProfile[];
}) {
  const [isPending, startTransition] = useTransition();
  const nextStatus = NEXT_TRANSITIONS[inspection.status];

  function handleTransition() {
    if (!nextStatus) return;
    startTransition(async () => {
      await updateInspection(inspection.id, {
        status: nextStatus,
        ...(nextStatus === "completed" ? { completedDate: new Date() } : {}),
        ...(nextStatus === "in_progress" ? { inspectedDate: new Date() } : {}),
      });
    });
  }

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-4 py-3">
        <p className="font-medium text-slate-800">{inspection.title}</p>
        <p className="mt-0.5 text-xs text-slate-400">{inspection.inspectionType}</p>
      </td>
      <td className="px-4 py-3">
        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_COLORS[inspection.status])}>
          {inspection.status.replace("_", " ")}
        </span>
      </td>
      <td className="px-4 py-3">
        {inspection.result ? (
          <span className={cn("text-xs", RESULT_COLORS[inspection.result] ?? "text-slate-600")}>
            {inspection.result.replace("_", " ")}
          </span>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-xs text-slate-500">
        {resolveAssignee(profiles, inspection.assignedTo)}
      </td>
      <td className="px-4 py-3 text-xs text-slate-500">
        {inspection.scheduledDate
          ? new Date(inspection.scheduledDate).toLocaleDateString()
          : "—"}
      </td>
      <td className="px-4 py-3 text-xs text-slate-500">
        {inspection.completedDate
          ? new Date(inspection.completedDate).toLocaleDateString()
          : "—"}
      </td>
      <td className="px-4 py-3">
        {nextStatus ? (
          <button
            onClick={handleTransition}
            disabled={isPending}
            className="rounded bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50 transition-colors"
          >
            {isPending ? "…" : TRANSITION_LABELS[inspection.status]}
          </button>
        ) : (
          <span className="text-xs text-slate-300">Done</span>
        )}
      </td>
    </tr>
  );
}

const STATUS_TABS = [
  { value: undefined, label: "All" },
  { value: "scheduled", label: "Scheduled" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

export function QualityPageClient({
  projectId,
  inspections,
  profiles,
  activeStatus,
}: QualityPageClientProps) {
  const counts = STATUS_TABS.reduce<Record<string, number>>((acc, tab) => {
    acc[tab.value ?? "all"] = tab.value
      ? inspections.filter((i) => i.status === tab.value).length
      : inspections.length;
    return acc;
  }, {});

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-xl font-semibold text-slate-800">Inspections</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          {inspections.length} inspection{inspections.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="flex gap-1 border-b border-slate-200 bg-white px-6">
        {STATUS_TABS.map((tab) => {
          const isActive = activeStatus === tab.value;
          const href = (tab.value
            ? `/${projectId}/quality?status=${tab.value}`
            : `/${projectId}/quality`) as Route;
          return (
            <Link
              key={tab.value ?? "all"}
              href={href}
              className={cn(
                "flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm transition-colors",
                isActive
                  ? "border-blue-600 font-medium text-blue-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-xs",
                  isActive ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
                )}
              >
                {counts[tab.value ?? "all"] ?? 0}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {inspections.length === 0 ? (
          <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-slate-200 text-sm text-slate-400">
            No inspections{activeStatus ? ` with status "${activeStatus}"` : ""}.
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Title</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Result</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Inspector</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Scheduled</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Completed</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inspections.map((inspection) => (
                  <InspectionRow key={inspection.id} inspection={inspection} profiles={profiles} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
