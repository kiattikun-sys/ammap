"use client";

import { useState } from "react";
import { ProjectList } from "@/features/projects/components/project-list";
import { CreateProjectForm } from "@/features/projects/components/create-project-form";
import { SignOutButton } from "@/features/auth/sign-out-button";

export default function ProjectsPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Projects</h1>
          <p className="text-sm text-slate-500">Manage your organization&apos;s construction projects</p>
        </div>
        <SignOutButton />
      </div>

      <div className="mb-6">
        <CreateProjectForm onCreated={() => setRefreshKey((k) => k + 1)} />
      </div>

      <ProjectList key={refreshKey} />
    </div>
  );
}
