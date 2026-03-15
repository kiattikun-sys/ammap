import { listInspections } from "@/domains/quality/queries/list-inspections";
import { listOrgProfiles } from "@/domains/profiles/queries/list-org-profiles";
import { QualityPageClient } from "@/features/quality/components/quality-page-client";

interface Props {
  params: { projectId: string };
  searchParams: { status?: string };
}

export default async function ProjectQualityPage({ params, searchParams }: Props) {
  const { projectId } = params;

  const [inspections, profiles] = await Promise.all([
    listInspections({
      projectId,
      status: searchParams.status as Parameters<typeof listInspections>[0]["status"] | undefined,
    }),
    listOrgProfiles(),
  ]);

  return (
    <QualityPageClient
      projectId={projectId}
      inspections={inspections}
      profiles={profiles}
      activeStatus={searchParams.status}
    />
  );
}
