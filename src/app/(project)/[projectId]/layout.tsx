import { ProjectSidebar } from "@/components/layout/project-sidebar";
import { ProjectHeader } from "@/components/layout/project-header";
import { PageContainer } from "@/components/layout/page-container";
import { getCurrentUserContext } from "@/lib/auth/get-current-user-context";
import { getProjectByIdServer } from "@/domains/project/queries/get-project-server";

interface ProjectLayoutProps {
  children: React.ReactNode;
  params: { projectId: string };
}

export default async function ProjectLayout({ children, params }: ProjectLayoutProps) {
  const [{ displayName, organizationName, initial }, project] = await Promise.all([
    getCurrentUserContext(),
    getProjectByIdServer(params.projectId),
  ]);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <ProjectSidebar projectId={params.projectId} projectName={project?.name} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <ProjectHeader
          projectId={params.projectId}
          title={project?.name}
          username={displayName || undefined}
          organization={organizationName}
          initial={initial || undefined}
        />
        <PageContainer padded={false}>{children}</PageContainer>
      </div>
    </div>
  );
}
