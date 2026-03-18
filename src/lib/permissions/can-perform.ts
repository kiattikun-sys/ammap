import { createSupabaseServer } from "@/lib/supabase/supabase-server";

export type OrgRole =
  | "owner"
  | "admin"
  | "pm"
  | "site_manager"
  | "engineer"
  | "qa"
  | "safety"
  | "planner"
  | "document"
  | "viewer"
  | "member";

export type Permission =
  | "create:work_item"
  | "update:work_item"
  | "update:work_progress"
  | "delete:work_item"
  | "create:defect"
  | "update:defect_status"
  | "close:defect"
  | "delete:defect"
  | "create:corrective_action"
  | "update:corrective_action"
  | "complete:corrective_action"
  | "create:inspection"
  | "update:inspection"
  | "create:evidence"
  | "create:spatial_node"
  | "delete:spatial_node"
  | "archive:project"
  | "create:project";

const ROLE_PERMISSIONS: Record<OrgRole, Permission[]> = {
  owner: [
    "create:work_item", "update:work_item", "update:work_progress", "delete:work_item",
    "create:defect", "update:defect_status", "close:defect", "delete:defect",
    "create:corrective_action", "update:corrective_action", "complete:corrective_action",
    "create:inspection", "update:inspection",
    "create:evidence",
    "create:spatial_node", "delete:spatial_node",
    "archive:project", "create:project",
  ],
  admin: [
    "create:work_item", "update:work_item", "update:work_progress", "delete:work_item",
    "create:defect", "update:defect_status", "close:defect", "delete:defect",
    "create:corrective_action", "update:corrective_action", "complete:corrective_action",
    "create:inspection", "update:inspection",
    "create:evidence",
    "create:spatial_node", "delete:spatial_node",
    "archive:project", "create:project",
  ],
  pm: [
    "create:work_item", "update:work_item", "update:work_progress", "delete:work_item",
    "create:defect", "update:defect_status", "delete:defect",
    "create:corrective_action", "update:corrective_action",
    "create:inspection",
    "create:evidence",
    "create:spatial_node", "delete:spatial_node",
    "create:project",
  ],
  site_manager: [
    "create:work_item", "update:work_item", "update:work_progress", "delete:work_item",
    "create:defect", "update:defect_status", "delete:defect",
    "create:corrective_action", "update:corrective_action", "complete:corrective_action",
    "create:inspection", "update:inspection",
    "create:evidence",
    "create:spatial_node", "delete:spatial_node",
  ],
  engineer: [
    "update:work_item", "update:work_progress",
    "create:corrective_action", "update:corrective_action", "complete:corrective_action",
    "create:evidence",
  ],
  qa: [
    "create:defect", "update:defect_status", "close:defect",
    "create:corrective_action", "update:corrective_action", "complete:corrective_action",
    "create:inspection", "update:inspection",
    "create:evidence",
  ],
  safety: [
    "create:defect", "update:defect_status",
    "create:inspection", "update:inspection",
    "create:evidence",
  ],
  planner: [
    "create:work_item", "update:work_item",
    "create:evidence",
  ],
  document: [
    "create:evidence",
  ],
  viewer: [],
  member: [
    "create:work_item", "update:work_item", "update:work_progress",
    "create:defect", "update:defect_status",
    "create:corrective_action", "update:corrective_action", "complete:corrective_action",
    "create:inspection", "update:inspection",
    "create:evidence",
  ],
};

export function roleHasPermission(role: OrgRole, permission: Permission): boolean {
  return (ROLE_PERMISSIONS[role] ?? []).includes(permission);
}

export async function getCallerRole(): Promise<OrgRole | null> {
  const db = (await createSupabaseServer()) as any;
  const { data: { user } } = await db.auth.getUser();
  if (!user) return null;

  const { data, error } = await db
    .from("organization_members")
    .select("role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return (data as { role: OrgRole } | null)?.role ?? null;
}

export async function requirePermission(permission: Permission): Promise<void> {
  const role = await getCallerRole();
  if (!role) throw new Error("Not authenticated");
  if (!roleHasPermission(role, permission)) {
    throw new Error(
      `Permission denied: role '${role}' cannot perform '${permission}'`
    );
  }
}
