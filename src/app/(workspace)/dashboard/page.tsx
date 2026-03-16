import { listProjectsServer } from "@/domains/project/queries/list-projects-server";
import { DashboardPageClient } from "@/features/dashboard/components/dashboard-page-client";

export default async function WorkspaceDashboardPage() {
  const projects = await listProjectsServer();
  const projectIds = projects.map((p) => p.id);
  return <DashboardPageClient projectIds={projectIds} />;
}
