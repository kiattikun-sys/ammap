import { ProjectSidebar } from "@/components/layout/project-sidebar";
import { ProjectHeader } from "@/components/layout/project-header";
import { PageContainer } from "@/components/layout/page-container";
import { getCurrentUserContext } from "@/lib/auth/get-current-user-context";

interface ProjectLayoutProps {
  children: React.ReactNode;
  params: { projectId: string };
}

export default async function ProjectLayout({ children, params }: ProjectLayoutProps) {
  const { displayName, organizationName, initial } = await getCurrentUserContext();

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <ProjectSidebar projectId={params.projectId} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <ProjectHeader
          projectId={params.projectId}
          username={displayName || undefined}
          organization={organizationName}
          initial={initial || undefined}
        />
        <PageContainer padded={false}>{children}</PageContainer>
      </div>
    </div>
  );
}
