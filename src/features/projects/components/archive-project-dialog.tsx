"use client";

import { useState } from "react";
import { archiveProject } from "@/domains/project/actions";

interface ArchiveProjectDialogProps {
  projectId: string;
  projectName: string;
  onArchived: () => void;
  onCancel: () => void;
}

export function ArchiveProjectDialog({
  projectId,
  projectName,
  onArchived,
  onCancel,
}: ArchiveProjectDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      await archiveProject(projectId);
      onArchived();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to archive project");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
            <svg
              className="h-5 w-5 text-amber-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8l1 12a2 2 0 002 2h8a2 2 0 002-2L19 8"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Archive Project</h2>
            <p className="mt-1 text-sm text-slate-500">
              This action requires owner or admin permission.
            </p>
          </div>
        </div>

        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <p className="font-medium">&ldquo;{projectName}&rdquo; will be archived.</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-amber-700">
            <li>The project will be hidden from all project lists</li>
            <li>All project data is preserved — nothing is permanently deleted</li>
            <li>Only organization owners and admins can perform this action</li>
            <li>Contact your administrator to restore an archived project</li>
          </ul>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {loading ? "Archiving…" : "Archive Project"}
          </button>
        </div>
      </div>
    </div>
  );
}
