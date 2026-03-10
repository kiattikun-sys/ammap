export interface UploadEvidenceInput {
  projectId: string;
  type: string;
  zoneId?: string;
  workItemId?: string;
  inspectionId?: string;
  capturedAt?: string;
}
