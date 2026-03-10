"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getProjectById } from "@/domains/project/queries";
import type { Project } from "@/domains/project/model";

export default function ProjectWorkspacePage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProjectById(projectId)
      .then(setProject)
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-400">
        Loading project…
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-600">Project not found.</p>
        <Link href="/projects" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
          ← Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mb-6">
        <Link href="/projects" className="text-xs text-slate-400 hover:text-slate-600">
          ← Projects
        </Link>
        <h1 className="mt-1 text-xl font-bold text-slate-900">{project.name}</h1>
        {project.description && (
          <p className="mt-0.5 text-sm text-slate-500">{project.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href={`/${projectId}/map`}
          className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
        >
          <span className="text-2xl">🗺️</span>
          <span className="font-semibold text-slate-800">Map Workspace</span>
          <span className="text-xs text-slate-400">View spatial nodes, tasks, and defects on map</span>
        </Link>

        <Link
          href={`/${projectId}/overview`}
          className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
        >
          <span className="text-2xl">📊</span>
          <span className="font-semibold text-slate-800">Overview</span>
          <span className="text-xs text-slate-400">Project health and progress summary</span>
        </Link>

        <Link
          href={`/${projectId}/work`}
          className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
        >
          <span className="text-2xl">✅</span>
          <span className="font-semibold text-slate-800">Work Items</span>
          <span className="text-xs text-slate-400">Tasks and work orders</span>
        </Link>

        <Link
          href={`/${projectId}/defects`}
          className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
        >
          <span className="text-2xl">⚠️</span>
          <span className="font-semibold text-slate-800">Defects</span>
          <span className="text-xs text-slate-400">Quality issues and inspections</span>
        </Link>

        <Link
          href={`/projects/${projectId}/evidence`}
          className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
        >
          <span className="text-2xl">📷</span>
          <span className="font-semibold text-slate-800">Evidence</span>
          <span className="text-xs text-slate-400">Photos, videos, and documents</span>
        </Link>

        <Link
          href={`/${projectId}/reports`}
          className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
        >
          <span className="text-2xl">📋</span>
          <span className="font-semibold text-slate-800">Reports</span>
          <span className="text-xs text-slate-400">Generate and export reports</span>
        </Link>
      </div>
    </div>
  );
}
