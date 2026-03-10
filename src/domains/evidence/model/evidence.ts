export type EvidenceType = "photo" | "video" | "document";

export interface Evidence {
  id: string;
  projectId: string;
  spatialNodeId: string | null;
  workItemId: string | null;
  defectId: string | null;
  type: EvidenceType;
  title: string;
  description: string | null;
  fileUrl: string;
  thumbnailUrl: string | null;
  locationLng: number | null;
  locationLat: number | null;
  capturedBy: string | null;
  capturedAt: Date | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
