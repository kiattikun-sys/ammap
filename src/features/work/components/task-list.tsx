"use client";

import { useState } from "react";
import type { WorkItem, WorkStatus } from "@/domains/work/model/work-item";
import { updateWorkProgress } from "@/domains/work/actions/update-work-progress";
import { updateWorkItem } from "@/domains/work/actions/update-work-item";
import { useOrgProfiles } from "@/domains/profiles/hooks/use-org-profiles";

interface TaskListProps {
  tasks: WorkItem[];
  onUpdated?: () => void;
}

const STATUS_STYLES: Record<WorkStatus, string> = {
  planned: "bg-slate-100 text-slate-600",
  in_progress: "bg-blue-100 text-blue-700",
  blocked: "bg-red-100 text-red-700",
  completed: "bg-green-100 text-green-700",
};

const STATUS_LABELS: Record<WorkStatus, string> = {
  planned: "Planned",
  in_progress: "In Progress",
  blocked: "Blocked",
  completed: "Completed",
};

const PRIORITY_DOT: Record<string, string> = {
  low: "bg-slate-400",
  medium: "bg-blue-500",
  high: "bg-orange-500",
  critical: "bg-red-600",
};

const STATUS_ORDER: WorkStatus[] = ["planned", "in_progress", "blocked", "completed"];

const STATUS_SEGMENT: Record<WorkStatus, string> = {
  planned: "text-slate-500 hover:bg-slate-100",
  in_progress: "text-blue-600 hover:bg-blue-50",
  blocked: "text-red-500 hover:bg-red-50",
  completed: "text-green-600 hover:bg-green-50",
};

const STATUS_SEGMENT_ACTIVE: Record<WorkStatus, string> = {
  planned: "bg-slate-100 text-slate-700 font-semibold",
  in_progress: "bg-blue-100 text-blue-700 font-semibold",
  blocked: "bg-red-100 text-red-700 font-semibold",
  completed: "bg-green-100 text-green-700 font-semibold",
};

function TaskCard({
  task,
  onUpdated,
  resolveAssignee,
}: {
  task: WorkItem;
  onUpdated?: () => void;
  resolveAssignee: (id: string | null) => string;
}) {
  const [status, setStatus] = useState<WorkStatus>(task.status);
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [progress, setProgress] = useState(task.progressPercent);
  const [progressSaving, setProgressSaving] = useState(false);
  const [progressDirty, setProgressDirty] = useState(false);

  const isOverdue =
    task.dueDate && status !== "completed" && new Date() > task.dueDate;

  async function handleStatusChange(next: WorkStatus) {
    if (next === status || statusSaving) return;
    const prev = status;
    setStatus(next);
    setStatusSaving(true);
    setStatusError(null);
    try {
      await updateWorkItem(task.id, { status: next });
      onUpdated?.();
    } catch (err) {
      setStatus(prev);
      setStatusError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setStatusSaving(false);
    }
  }

  async function handleProgressSave() {
    setProgressSaving(true);
    try {
      const updated = await updateWorkProgress(task.id, progress);
      setStatus(updated.status);
      setProgressDirty(false);
      onUpdated?.();
    } finally {
      setProgressSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-start gap-2 min-w-0">
        <span
          className={`mt-1 h-2 w-2 shrink-0 rounded-full ${PRIORITY_DOT[task.priority] ?? "bg-slate-400"}`}
          title={task.priority}
        />
        <p className="flex-1 text-sm font-medium text-slate-800 leading-snug">{task.title}</p>
      </div>

      {task.description && (
        <p className="mb-2 text-xs text-slate-500 line-clamp-2">{task.description}</p>
      )}

      {/* Status segmented control */}
      <div className="mb-2 flex rounded-lg border border-slate-200 overflow-hidden">
        {STATUS_ORDER.map((s) => (
          <button
            key={s}
            type="button"
            disabled={statusSaving}
            onClick={() => handleStatusChange(s)}
            className={`flex-1 py-1 text-[10px] transition-colors disabled:opacity-60 ${
              status === s ? STATUS_SEGMENT_ACTIVE[s] : STATUS_SEGMENT[s]
            }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {statusError && (
        <p className="mb-1 text-[10px] text-red-500">{statusError}</p>
      )}

      {/* Progress */}
      <div className="mb-2">
        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
          <span>Progress</span>
          <span className="font-medium text-slate-600">{progress}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={progress}
          onChange={(e) => {
            setProgress(Number(e.target.value));
            setProgressDirty(true);
          }}
          className="w-full accent-blue-600"
        />
        {progressDirty && (
          <div className="mt-1 flex justify-end">
            <button
              onClick={handleProgressSave}
              disabled={progressSaving}
              className="rounded bg-blue-600 px-3 py-0.5 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {progressSaving ? "…" : "Save"}
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 text-[10px] text-slate-400">
        {task.dueDate && (
          <span className={isOverdue ? "text-red-500 font-medium" : ""}>
            📅 {isOverdue ? "Overdue · " : ""}
            {task.dueDate.toLocaleDateString()}
          </span>
        )}
        <span className="truncate">👤 {resolveAssignee(task.assignedTo)}</span>
      </div>
    </div>
  );
}

export function TaskList({ tasks, onUpdated }: TaskListProps) {
  const { resolveAssignee } = useOrgProfiles();

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-sm text-slate-500">No tasks yet</p>
        <p className="text-xs text-slate-400">Create a task to get started</p>
      </div>
    );
  }

  const grouped = tasks.reduce<Record<string, WorkItem[]>>((acc, t) => {
    const key = t.spatialNodeId ?? "__none__";
    (acc[key] ??= []).push(t);
    return acc;
  }, {});

  const hasMultipleZones = Object.keys(grouped).length > 1;

  if (!hasMultipleZones) {
    return (
      <div className="space-y-2">
        {tasks.map((t) => (
          <TaskCard key={t.id} task={t} onUpdated={onUpdated} resolveAssignee={resolveAssignee} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([zoneId, zoneTasks]) => (
        <div key={zoneId}>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            {zoneId === "__none__" ? "Unassigned" : `Zone ${zoneId.slice(0, 8)}…`}
          </p>
          <div className="space-y-2">
            {zoneTasks.map((t) => (
              <TaskCard key={t.id} task={t} onUpdated={onUpdated} resolveAssignee={resolveAssignee} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
