import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { createSupabaseAdmin } from "@/lib/supabase/supabase-admin";
import { redirect } from "next/navigation";

export interface PlatformAdminContext {
  userId: string;
  role: "platform_owner" | "platform_admin";
}

/**
 * Asserts the current session user is a platform admin.
 * Uses the admin client to bypass RLS self-reference on platform_admins.
 * Throws "Forbidden" if not a platform admin.
 * Use in server actions. For server components, use requirePlatformAdminPage().
 */
export async function assertPlatformAdmin(): Promise<PlatformAdminContext> {
  const db = (await createSupabaseServer()) as any;
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user) throw new Error("Unauthorized");

  const adminDb = createSupabaseAdmin() as any;
  const { data: admin } = await adminDb
    .from("platform_admins")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!admin) throw new Error("Forbidden: platform admin access required");
  return { userId: user.id, role: admin.role as PlatformAdminContext["role"] };
}

/**
 * Page-level guard for server components.
 * Redirects to /login if not authenticated, to /dashboard if not a platform admin.
 * Returns the platform admin context if allowed.
 */
export async function requirePlatformAdminPage(): Promise<PlatformAdminContext> {
  const db = (await createSupabaseServer()) as any;
  const {
    data: { user },
  } = await db.auth.getUser();

  if (!user) redirect("/login");

  const adminDb = createSupabaseAdmin() as any;
  const { data: admin } = await adminDb
    .from("platform_admins")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!admin) redirect("/dashboard");
  return { userId: user.id, role: admin.role as PlatformAdminContext["role"] };
}
