"use client";

import Link from "next/link";
import type { Route } from "next";
import type { Evidence, EvidenceType } from "@/domains/evidence/model/evidence";
import { cn } from "@/lib/cn";

interface EvidencePageClientProps {
  projectId: string;
  items: Evidence[];
  activeType?: string;
}

const TYPE_TABS: { value: EvidenceType | undefined; label: string }[] = [
  { value: undefined, label: "All" },
  { value: "photo", label: "Photos" },
  { value: "video", label: "Videos" },
  { value: "document", label: "Documents" },
];

const TYPE_ICONS: Record<EvidenceType, string> = {
  photo: "📷",
  video: "🎥",
  document: "📄",
};

const TYPE_COLORS: Record<EvidenceType, string> = {
  photo: "bg-blue-50 text-blue-700 border-blue-200",
  video: "bg-purple-50 text-purple-700 border-purple-200",
  document: "bg-slate-50 text-slate-700 border-slate-200",
};

function linkedEntity(item: Evidence): string {
  if (item.defectId) return `Defect: ${item.defectId.slice(0, 8)}…`;
  if (item.workItemId) return `Work: ${item.workItemId.slice(0, 8)}…`;
  if (item.spatialNodeId) return `Zone: ${item.spatialNodeId.slice(0, 8)}…`;
  return "—";
}

export function EvidencePageClient({
  projectId,
  items,
  activeType,
}: EvidencePageClientProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-xl font-semibold text-slate-800">Evidence</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          {items.length} file{items.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="flex gap-1 border-b border-slate-200 bg-white px-6">
        {TYPE_TABS.map((tab) => {
          const isActive = activeType === tab.value;
          const href = (tab.value
            ? `/${projectId}/evidence?type=${tab.value}`
            : `/${projectId}/evidence`) as Route;
          return (
            <Link
              key={tab.value ?? "all"}
              href={href}
              className={cn(
                "border-b-2 px-3 py-2.5 text-sm transition-colors",
                isActive
                  ? "border-blue-600 font-medium text-blue-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {items.length === 0 ? (
          <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-slate-200 text-sm text-slate-400">
            No evidence files found. Use the Map workspace to capture evidence.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-slate-200 bg-white p-4 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-slate-800 text-sm leading-snug">{item.title}</p>
                  <span
                    className={cn(
                      "shrink-0 rounded border px-1.5 py-0.5 text-xs",
                      TYPE_COLORS[item.type]
                    )}
                  >
                    {TYPE_ICONS[item.type]} {item.type}
                  </span>
                </div>

                {item.description && (
                  <p className="mt-1 text-xs text-slate-400 line-clamp-2">{item.description}</p>
                )}

                <div className="mt-3 space-y-1 text-xs text-slate-500">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Linked to</span>
                    <span>{linkedEntity(item)}</span>
                  </div>
                  {item.capturedAt && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Captured</span>
                      <span>{new Date(item.capturedAt).toLocaleDateString("en-CA")}</span>
                    </div>
                  )}
                </div>

                {item.fileUrl && (
                  <a
                    href={item.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 block rounded bg-slate-50 px-3 py-1.5 text-center text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    View File
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
