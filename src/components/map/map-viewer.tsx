interface MapViewerProps {
  className?: string;
  projectId: string;
}

export function MapViewer({ className, projectId: _projectId }: MapViewerProps) {
  return <div className={className}>Map viewer placeholder</div>;
}
