"use client";

import Link from "next/link";
import type { Project } from "@/domains/project/model";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{project.name}</h3>
          {project.description && (
            <p className="mt-0.5 text-sm text-slate-500 line-clamp-2">{project.description}</p>
          )}
        </div>
        <span className="ml-2 shrink-0 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
          {project.status}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">
          Created {project.createdAt.toLocaleDateString()}
        </span>
        <div className="flex gap-2">
          <Link
            href={`/${project.id}/map`}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            Map
          </Link>
          <Link
            href={`/${project.id}/overview`}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
          >
            Open →
          </Link>
        </div>
      </div>
    </div>
  );
}
