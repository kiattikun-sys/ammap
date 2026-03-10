export interface CreateInspectionInput {
  projectId: string;
  title: string;
  zoneId?: string;
  workItemId?: string;
  scheduledAt?: string;
}
