import { getProjectByIdServer } from "@/domains/project/queries/get-project-server";
import { listEvidenceServer } from "@/domains/evidence/queries/list-evidence-server";
import { notFound } from "next/navigation";
import Link from "next/link";

interface Props {
  params: { projectId: string };
}

const TYPE_LABELS: Record<string, string> = {
  photo: "Photos",
  video: "Videos",
  document: "Documents",
  report: "Reports",
  other: "Other",
};

export default async function ProjectDocumentsPage({ params }: Props) {
  const { projectId } = params;
  const project = await getProjectByIdServer(projectId);
  if (!project) notFound();

  const items = await listEvidenceServer({ projectId, limit: 100 });

  const grouped = items.reduce<Record<string, typeof items>>((acc, item) => {
    const key = item.type ?? "other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Documents & Evidence</h1>
          <p className="mt-1 text-sm text-slate-500">{project.name}</p>
        </div>
        <Link
          href={`/projects/${projectId}/evidence`}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Upload Evidence
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16 text-center">
          <p className="text-sm font-medium text-slate-600">No documents uploaded yet</p>
          <p className="mt-1 text-xs text-slate-400">
            Upload evidence from the Evidence page to see files here
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([type, typeItems]) => (
            <div key={type}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                {TYPE_LABELS[type] ?? type} ({typeItems.length})
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {typeItems.map((item) => (
                  <a
                    key={item.id}
                    href={item.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 hover:border-blue-200 hover:shadow-sm transition-all"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800 group-hover:text-blue-700">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {item.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
