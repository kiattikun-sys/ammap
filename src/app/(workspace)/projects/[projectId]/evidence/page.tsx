"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { EvidenceUpload } from "@/features/evidence/components/evidence-upload";
import { EvidenceGallery } from "@/features/evidence/components/evidence-gallery";

export default function ProjectEvidencePage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mb-6">
        <Link
          href={`/projects/${projectId}`}
          className="text-xs text-slate-400 hover:text-slate-600"
        >
          ← Project
        </Link>
        <h1 className="mt-1 text-xl font-bold text-slate-900">Evidence</h1>
        <p className="text-sm text-slate-500">
          Photos, videos, and documents for this project
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <EvidenceUpload
            projectId={projectId}
            onUploaded={() => setRefreshKey((k) => k + 1)}
          />
        </div>

        <div className="lg:col-span-2">
          <EvidenceGallery
            projectId={projectId}
            refreshKey={refreshKey}
          />
        </div>
      </div>
    </div>
  );
}
