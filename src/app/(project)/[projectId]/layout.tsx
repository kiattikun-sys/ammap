import { ProjectSidebar } from "@/components/layout/project-sidebar";
import { ProjectHeader } from "@/components/layout/project-header";
import { PageContainer } from "@/components/layout/page-container";

interface ProjectLayoutProps {
  children: React.ReactNode;
  params: { projectId: string };
}

export default function ProjectLayout({ children, params }: ProjectLayoutProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <ProjectSidebar projectId={params.projectId} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <ProjectHeader projectId={params.projectId} />
        <PageContainer padded={false}>{children}</PageContainer>
      </div>
    </div>
  );
}
