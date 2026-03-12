import { SpatialManagerView } from "@/features/spatial/components/spatial-manager-view";

interface Props {
  params: { projectId: string };
}

export default function ProjectSpatialPage({ params }: Props) {
  return <SpatialManagerView projectId={params.projectId} />;
}
