export interface CreateProjectInput {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateProjectInput {
  id: string;
  name?: string;
  description?: string;
  status?: string;
}
