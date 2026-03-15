import { listEvidence } from "@/domains/evidence/queries/list-evidence";
import { EvidencePageClient } from "@/features/evidence/components/evidence-page-client";

interface Props {
  params: { projectId: string };
  searchParams: { type?: string };
}

export default async function ProjectEvidencePage({ params, searchParams }: Props) {
  const { projectId } = params;

  const items = await listEvidence({
    projectId,
    type: searchParams.type as Parameters<typeof listEvidence>[0]["type"] | undefined,
  });

  return (
    <EvidencePageClient
      projectId={projectId}
      items={items}
      activeType={searchParams.type}
    />
  );
}
