"use client";

import { useState } from "react";
import { createCorrectiveAction } from "@/domains/quality/actions/create-corrective-action";

interface CreateCorrectiveActionFormProps {
  projectId: string;
  defectId: string;
  spatialNodeId?: string | null;
  onCreated?: () => void;
  onCancel?: () => void;
}

export function CreateCorrectiveActionForm({
  projectId,
  defectId,
  spatialNodeId,
  onCreated,
  onCancel,
}: CreateCorrectiveActionFormProps) {
  const [actionText, setActionText] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!actionText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await createCorrectiveAction(projectId, {
        defectId,
        spatialNodeId: spatialNodeId ?? undefined,
        actionText: actionText.trim(),
        assignedToUserId: assignedTo.trim() || undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      });
      onCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create corrective action");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-700">
          Action <span className="text-red-500">*</span>
        </label>
        <textarea
          rows={3}
          required
          autoFocus
          value={actionText}
          onChange={(e) => setActionText(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          placeholder="Describe the corrective action to take…"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-700">
          Assign To <span className="text-slate-400">(user ID or name)</span>
        </label>
        <input
          type="text"
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          placeholder="User ID or name…"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-700">
          Due Date <span className="text-slate-400">(optional)</span>
        </label>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
          disabled={loading || !actionText.trim()}
          className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Saving…" : "Add Action"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
