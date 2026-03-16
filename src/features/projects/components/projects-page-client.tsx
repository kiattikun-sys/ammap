"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Project } from "@/domains/project/model";
import { ProjectCard } from "./project-card";
import { CreateProjectForm } from "./create-project-form";
import { SignOutButton } from "@/features/auth/sign-out-button";
import Link from "next/link";

interface Props {
  initialProjects: Project[];
}

export function ProjectsPageClient({ initialProjects }: Props) {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>(initialProjects);

  function handleArchived(projectId: string) {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
  }

  function handleCreated() {
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Projects</h1>
          <p className="text-sm text-slate-500">
            Manage your organization&apos;s construction projects
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Dashboard
          </Link>
          <SignOutButton />
        </div>
      </div>

      <div className="mb-6">
        <CreateProjectForm onCreated={handleCreated} />
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16 text-center">
          <p className="text-sm font-medium text-slate-600">No projects yet</p>
          <p className="mt-1 text-xs text-slate-400">
            Create your first project to get started
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onArchived={handleArchived}
            />
          ))}
        </div>
      )}
    </div>
  );
}
