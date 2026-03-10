export interface Project {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  status: ProjectStatus;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type ProjectStatus = "planning" | "active" | "on_hold" | "completed" | "archived";
