export interface Drawing {
  id: string;
  projectId: string;
  title: string;
  revision: string;
  fileUrl: string;
  discipline: DrawingDiscipline;
  zoneId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type DrawingDiscipline = "architectural" | "structural" | "mechanical" | "electrical" | "plumbing" | "civil";
