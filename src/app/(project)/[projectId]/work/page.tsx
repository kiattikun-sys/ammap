import { listWorkItems } from "@/domains/work/queries/list-work-items";
import { listOrgProfiles } from "@/domains/profiles/queries/list-org-profiles";
import { WorkPageClient } from "@/features/work/components/work-page-client";

interface Props {
  params: { projectId: string };
  searchParams: { status?: string };
}

export default async function ProjectWorkPage({ params, searchParams }: Props) {
  const { projectId } = params;
  const statusFilter = searchParams.status as Parameters<typeof listWorkItems>[0]["status"] | undefined;

  const [items, profiles] = await Promise.all([
    listWorkItems({ projectId, status: statusFilter }),
    listOrgProfiles(),
  ]);

  return (
    <WorkPageClient
      projectId={projectId}
      items={items}
      profiles={profiles}
      activeStatus={statusFilter}
    />
  );
}
