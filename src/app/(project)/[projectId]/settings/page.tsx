import { getProjectByIdServer } from "@/domains/project/queries/get-project-server";
import { ProjectSettingsClient } from "@/features/projects/components/project-settings-client";
import { notFound } from "next/navigation";

interface Props {
  params: { projectId: string };
}

export default async function ProjectSettingsPage({ params }: Props) {
  const project = await getProjectByIdServer(params.projectId);
  if (!project) notFound();

  return <ProjectSettingsClient project={project} />;
}
