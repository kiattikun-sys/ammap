import { listDefects } from "@/domains/quality/queries/list-defects";
import { listOrgProfiles } from "@/domains/profiles/queries/list-org-profiles";
import { DefectsPageClient } from "@/features/quality/components/defects-page-client";

interface Props {
  params: { projectId: string };
  searchParams: { status?: string; severity?: string };
}

export default async function ProjectDefectsPage({ params, searchParams }: Props) {
  const { projectId } = params;

  const [defects, profiles] = await Promise.all([
    listDefects({
      projectId,
      status: searchParams.status as Parameters<typeof listDefects>[0]["status"] | undefined,
      severity: searchParams.severity as Parameters<typeof listDefects>[0]["severity"] | undefined,
    }),
    listOrgProfiles(),
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
