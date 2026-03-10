import { MapWorkspace } from "@/features/map-workspace";

interface ProjectMapPageProps {
  params: { projectId: string };
}

export default function ProjectMapPage({ params }: ProjectMapPageProps) {
  return <MapWorkspace projectId={params.projectId} />;
}
