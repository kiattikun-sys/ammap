export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  userId: string;
  avatarUrl?: string;
  phone?: string;
  organization?: string;
}

export type UserRole = "admin" | "manager" | "engineer" | "field_worker" | "viewer";
