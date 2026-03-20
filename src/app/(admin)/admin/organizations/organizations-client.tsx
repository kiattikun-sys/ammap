"use client";

import React, { useState, useMemo } from "react";
import { Search, Building2, ChevronDown, ChevronRight, Users, FolderOpen, Archive } from "lucide-react";
import type { PlatformOrganization } from "@/domains/platform/queries/list-platform-organizations";

// ── Helpers ──────────────────────────────────────────────────────

function formatDateShort(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const ROLE_COLORS: Record<string, string> = {
  owner:   "bg-amber-50 text-amber-700 border-amber-200",
  admin:   "bg-blue-50 text-blue-700 border-blue-200",
  member:  "bg-slate-50 text-slate-600 border-slate-200",
  viewer:  "bg-slate-50 text-slate-400 border-slate-200",
};

function roleBadge(role: string) {
  const cls = ROLE_COLORS[role] ?? "bg-slate-50 text-slate-500 border-slate-200";
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}>
      {role}
    </span>
  );
}

// ── Component ────────────────────────────────────────────────────

export function OrganizationsClient({ orgs }: { orgs: PlatformOrganization[] }) {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orgs;
    return orgs.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        o.ownerEmail.toLowerCase().includes(q) ||
        (o.ownerDisplayName ?? "").toLowerCase().includes(q)
    );
  }, [orgs, search]);

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="flex-1 overflow-y-auto p-8">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Organizations</h1>
        <p className="mt-1 text-sm text-slate-500">
          Platform-wide organization inspection. {orgs.length} organization{orgs.length !== 1 ? "s" : ""}.
        </p>
      </div>

      {/* Toolbar */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or owner…"
            className="h-9 rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 w-72"
          />
        </div>
      </div>

      {/* Result count */}
      <p className="mb-3 text-xs text-slate-400">
        {filtered.length} of {orgs.length} organization{orgs.length !== 1 ? "s" : ""}
        {search ? ` matching "${search}"` : ""}
      </p>

      {/* Table or empty state */}
      {filtered.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white text-slate-400">
          <Building2 size={28} className="mb-2 text-slate-300" />
          <p className="text-sm font-medium">
            {search ? "No organizations match your search" : "No organizations found"}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 w-8"></th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Organization</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Owner</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Members</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Projects</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((org) => (
                <React.Fragment key={org.id}>
                  {/* Main row */}
                  <tr
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => toggleExpand(org.id)}
                  >
                    {/* Expand toggle */}
                    <td className="px-4 py-3 text-slate-400">
                      {expandedId === org.id
                        ? <ChevronDown size={14} />
                        : <ChevronRight size={14} />}
                    </td>

                    {/* Org name */}
                    <td className="px-4 py-3 min-w-[200px]">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-xs font-bold text-slate-500 select-none flex-shrink-0">
                          {org.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{org.name}</p>
                          <p className="text-xs text-slate-400 font-mono">{org.id.slice(0, 8)}…</p>
                        </div>
                      </div>
                    </td>

                    {/* Owner */}
                    <td className="px-4 py-3 min-w-[180px]">
                      <p className="text-sm font-medium text-slate-800">
                        {org.ownerDisplayName ?? <span className="text-slate-400 italic">No display name</span>}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{org.ownerEmail || "—"}</p>
                    </td>

                    {/* Member count */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-sm text-slate-700">
                        <Users size={13} className="text-slate-400" />
                        {org.memberCount}
                      </div>
                    </td>

                    {/* Project count */}
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-sm text-slate-700">
                          <FolderOpen size={13} className="text-slate-400" />
                          {org.projectCount} active
                        </div>
                        {org.archivedProjectCount > 0 && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Archive size={11} className="text-slate-300" />
                            {org.archivedProjectCount} archived
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Created */}
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                      {formatDateShort(org.createdAt)}
                    </td>
                  </tr>

                  {/* Expanded member detail row */}
                  {expandedId === org.id && (
                    <tr key={`${org.id}-detail`} className="bg-slate-50">
                      <td colSpan={6} className="px-6 py-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
                          Members ({org.memberCount})
                        </p>
                        {org.members.length === 0 ? (
                          <p className="text-xs text-slate-400">No members found.</p>
                        ) : (
                          <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                            <table className="w-full text-xs">
                              <thead className="border-b border-slate-100 bg-slate-50">
                                <tr>
                                  <th className="px-3 py-2 text-left font-semibold uppercase tracking-wide text-slate-400">Name</th>
                                  <th className="px-3 py-2 text-left font-semibold uppercase tracking-wide text-slate-400">Email</th>
                                  <th className="px-3 py-2 text-left font-semibold uppercase tracking-wide text-slate-400">Role</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {org.members.map((m) => (
                                  <tr key={m.userId} className="hover:bg-slate-50">
                                    <td className="px-3 py-2 font-medium text-slate-800">
                                      {m.displayName ?? <span className="text-slate-400 italic">No display name</span>}
                                    </td>
                                    <td className="px-3 py-2 text-slate-500">{m.email || "—"}</td>
                                    <td className="px-3 py-2">{roleBadge(m.role)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
