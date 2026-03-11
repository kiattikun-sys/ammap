"use client";

import { useState } from "react";
import { createDefect } from "@/domains/quality/actions/create-defect";
import type { DefectSeverity } from "@/domains/quality/model/defect";

interface CreateDefectFormProps {
  projectId: string;
  spatialNodeId?: string | null;
  inspectionId?: string | null;
  onCreated?: () => void;
  onCancel?: () => void;
}

const SEVERITY_OPTIONS: { value: DefectSeverity; label: string; color: string }[] = [
  { value: "low", label: "Low", color: "bg-slate-100 text-slate-600" },
  { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-700" },
  { value: "high", label: "High", color: "bg-orange-100 text-orange-700" },
  { value: "critical", label: "Critical", color: "bg-red-100 text-red-700" },
];

export function CreateDefectForm({
  projectId,
  spatialNodeId,
  inspectionId,
  onCreated,
  onCancel,
}: CreateDefectFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<DefectSeverity>("medium");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await createDefect(projectId, {
        title: title.trim(),
        description: description.trim() || undefined,
        severity,
        spatialNodeId: spatialNodeId ?? undefined,
        inspectionId: inspectionId ?? undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      });
      onCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create defect");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-700">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          placeholder="e.g. Honeycomb in column C2"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-700">
          Description <span className="text-slate-400">(optional)</span>
        </label>
        <textarea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          placeholder="Describe the defect…"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-700">Severity</label>
        <div className="flex flex-wrap gap-2">
          {SEVERITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSeverity(opt.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                severity === opt.value
                  ? opt.color + " ring-2 ring-offset-1 ring-blue-400"
                  : "bg-slate-50 text-slate-500 hover:bg-slate-100"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
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
          disabled={loading || !title.trim()}
          className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? "Creating…" : "Create Defect"}
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
