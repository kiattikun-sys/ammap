import { listProjectsServer } from "@/domains/project/queries/list-projects-server";
import { ProjectsPageClient } from "@/features/projects/components/projects-page-client";

export default async function ProjectsPage() {
  const projects = await listProjectsServer();
  return <ProjectsPageClient initialProjects={projects} />;
}
