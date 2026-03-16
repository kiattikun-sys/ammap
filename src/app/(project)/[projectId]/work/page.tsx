import { listWorkItemsServer } from "@/domains/work/queries/list-work-items-server";
import type { ListWorkItemsFilter } from "@/domains/work/queries/list-work-items";
import { listOrgProfilesServer } from "@/domains/profiles/queries/list-org-profiles-server";
import { WorkPageClient } from "@/features/work/components/work-page-client";

interface Props {
  params: { projectId: string };
  searchParams: { status?: string };
}

export default async function ProjectWorkPage({ params, searchParams }: Props) {
  const { projectId } = params;
  const statusFilter = searchParams.status as ListWorkItemsFilter["status"] | undefined;

  const [items, profiles] = await Promise.all([
    listWorkItemsServer({ projectId, status: statusFilter }),
    listOrgProfilesServer(),
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
