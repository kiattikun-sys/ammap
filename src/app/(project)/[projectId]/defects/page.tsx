import { listDefectsServer } from "@/domains/quality/queries/list-defects-server";
import type { ListDefectsFilter } from "@/domains/quality/queries/list-defects";
import { listOrgProfilesServer } from "@/domains/profiles/queries/list-org-profiles-server";
import { DefectsPageClient } from "@/features/quality/components/defects-page-client";

interface Props {
  params: { projectId: string };
  searchParams: { status?: string; severity?: string };
}

export default async function ProjectDefectsPage({ params, searchParams }: Props) {
  const { projectId } = params;

  const [defects, profiles] = await Promise.all([
    listDefectsServer({
      projectId,
      status: searchParams.status as ListDefectsFilter["status"] | undefined,
      severity: searchParams.severity as ListDefectsFilter["severity"] | undefined,
    }),
    listOrgProfilesServer(),
  ]);

  return (
    <DefectsPageClient
      projectId={projectId}
      defects={defects}
      profiles={profiles}
      activeStatus={searchParams.status}
      activeSeverity={searchParams.severity}
    />
  );
}
