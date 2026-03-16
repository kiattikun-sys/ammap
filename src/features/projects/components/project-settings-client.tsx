"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Project } from "@/domains/project/model";
import { ArchiveProjectDialog } from "./archive-project-dialog";

interface Props {
  project: Project;
}

export function ProjectSettingsClient({ project }: Props) {
  const router = useRouter();
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);

  function handleArchived() {
    setShowArchiveDialog(false);
    router.push("/projects");
    router.refresh();
  }

  const isArchived = project.status === "archived";

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Project Settings</h1>
        <p className="mt-1 text-sm text-slate-500">{project.name}</p>
      </div>

      <div className="space-y-4 max-w-2xl">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Project Information</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex items-start justify-between gap-4">
              <dt className="text-slate-500">Name</dt>
              <dd className="font-medium text-slate-900 text-right">{project.name}</dd>
            </div>
            {project.description && (
              <div className="flex items-start justify-between gap-4">
                <dt className="text-slate-500">Description</dt>
                <dd className="text-slate-800 text-right max-w-xs">{project.description}</dd>
              </div>
            )}
            <div className="flex items-start justify-between gap-4">
              <dt className="text-slate-500">Status</dt>
              <dd>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  isArchived
                    ? "bg-slate-100 text-slate-500"
                    : "bg-green-100 text-green-700"
                }`}>
                  {project.status}
                </span>
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-slate-500">Project ID</dt>
              <dd className="font-mono text-xs text-slate-400">{project.id}</dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-slate-500">Created</dt>
              <dd className="text-slate-700">{project.createdAt.toLocaleDateString()}</dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-slate-500">Last updated</dt>
              <dd className="text-slate-700">{project.updatedAt.toLocaleDateString()}</dd>
            </div>
            {isArchived && project.archivedAt && (
              <div className="flex items-start justify-between gap-4">
                <dt className="text-slate-500">Archived</dt>
                <dd className="text-amber-600">{project.archivedAt.toLocaleDateString()}</dd>
              </div>
            )}
          </dl>
        </div>

        {!isArchived && (
          <div className="rounded-xl border border-red-100 bg-white p-6">
            <h2 className="mb-1 text-sm font-semibold text-red-700">Danger Zone</h2>
            <p className="mb-4 text-xs text-slate-500">
              Actions here are destructive or irreversible. Requires owner or admin permission.
            </p>
            <div className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50 p-4">
              <div>
                <p className="text-sm font-medium text-slate-800">Archive this project</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Hides the project from all lists. Data is preserved and not deleted.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowArchiveDialog(true)}
                className="ml-4 shrink-0 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Archive
              </button>
            </div>
          </div>
        )}

        {isArchived && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            This project is archived. Contact your organization administrator to restore it.
          </div>
        )}
      </div>

      {showArchiveDialog && (
        <ArchiveProjectDialog
          projectId={project.id}
          projectName={project.name}
          onArchived={handleArchived}
          onCancel={() => setShowArchiveDialog(false)}
        />
      )}
    </div>
  );
}
