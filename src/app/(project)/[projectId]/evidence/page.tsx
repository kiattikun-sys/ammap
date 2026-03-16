import { listEvidenceServer } from "@/domains/evidence/queries/list-evidence-server";
import type { ListEvidenceFilter } from "@/domains/evidence/queries/list-evidence";
import { EvidencePageClient } from "@/features/evidence/components/evidence-page-client";

interface Props {
  params: { projectId: string };
  searchParams: { type?: string };
}

export default async function ProjectEvidencePage({ params, searchParams }: Props) {
  const { projectId } = params;

  const items = await listEvidenceServer({
    projectId,
    type: searchParams.type as ListEvidenceFilter["type"] | undefined,
  });

  return (
    <EvidencePageClient
      projectId={projectId}
      items={items}
      activeType={searchParams.type}
    />
  );
}
