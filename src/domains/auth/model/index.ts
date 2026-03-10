export interface Organization {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: "owner" | "admin" | "member";
  createdAt: Date;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: "manager" | "engineer" | "viewer";
  createdAt: Date;
}
