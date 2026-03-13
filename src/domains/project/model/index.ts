export interface Project {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  status: ProjectStatus;
  startDate?: Date;
  endDate?: Date;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ProjectStatus = "planning" | "active" | "on_hold" | "completed" | "archived";
