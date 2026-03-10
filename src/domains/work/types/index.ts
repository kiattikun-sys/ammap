export interface CreateWorkItemInput {
  projectId: string;
  title: string;
  description?: string;
  zoneId?: string;
  assigneeId?: string;
  dueDate?: string;
}
