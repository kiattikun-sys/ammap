"use client";

import { useEffect, useState } from "react";
import { getUserOrganization, listProjectsByOrganization, type OrgProject } from "@/domains/auth/queries/list-projects-by-organization";
import { getCurrentUser } from "@/domains/auth/services/auth-service";

export function OrgProjectsPanel() {
  const [projects, setProjects] = useState<OrgProject[]>([]);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const user = await getCurrentUser();
        if (!user) return;
        const membership = await getUserOrganization(user.id);
        if (!membership) return;
        const org = membership.organizations as { id: string; name: string } | null;
        if (!org) return;
        setOrgName(org.name);
        const list = await listProjectsByOrganization(org.id);
        setProjects(list);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="text-sm text-slate-400">Loading projects…</div>;
  }

  if (!orgName) {
    return null;
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-slate-700">{orgName} — Projects</h2>
      {projects.length === 0 ? (
        <p className="text-sm text-slate-400">No projects yet in this organization.</p>
      ) : (
        <ul className="space-y-2">
          {projects.map((p) => (
            <li key={p.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm hover:bg-slate-50">
              <span className="font-medium text-slate-800">{p.name}</span>
              {p.description && (
                <span className="ml-2 truncate text-xs text-slate-400">{p.description}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
