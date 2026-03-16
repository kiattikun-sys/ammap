import { listWorkItemsServer } from "@/domains/work/queries/list-work-items-server";
import { ProgressPageClient } from "@/features/work/components/progress-page-client";

interface Props {
  params: { projectId: string };
}

export default async function ProjectProgressPage({ params }: Props) {
  const { projectId } = params;
  const items = await listWorkItemsServer({ projectId });

  return <ProgressPageClient projectId={projectId} items={items} />;
}
