import { createSupabaseServer } from "@/lib/supabase/supabase-server";

export interface UserContext {
  displayName: string;
  organizationName: string | null;
  initial: string;
}

export async function getCurrentUserContext(): Promise<UserContext> {
  const supabase = (await createSupabaseServer()) as any;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { displayName: "", organizationName: null, initial: "" };
  }

  const emailPrefix = (user.email ?? "").split("@")[0] ?? "";

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const displayName: string =
    (profile as { display_name: string | null } | null)?.display_name ||
    emailPrefix ||
    "User";

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organizations(name)")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  const organizationName: string | null =
    (membership as { organizations: { name: string } | null } | null)
      ?.organizations?.name ?? null;

  const initial = displayName.charAt(0).toUpperCase();

  return { displayName, organizationName, initial };
}
