import { listInspectionsServer } from "@/domains/quality/queries/list-inspections-server";
import type { ListInspectionsFilter } from "@/domains/quality/queries/list-inspections";
import { listOrgProfilesServer } from "@/domains/profiles/queries/list-org-profiles-server";
import { QualityPageClient } from "@/features/quality/components/quality-page-client";

interface Props {
  params: { projectId: string };
  searchParams: { status?: string };
}

export default async function ProjectQualityPage({ params, searchParams }: Props) {
  const { projectId } = params;

  const [inspections, profiles] = await Promise.all([
    listInspectionsServer({
      projectId,
      status: searchParams.status as ListInspectionsFilter["status"] | undefined,
    }),
    listOrgProfilesServer(),
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
