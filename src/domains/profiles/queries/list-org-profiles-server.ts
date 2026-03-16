import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import type { OrgProfile } from "./list-org-profiles";

export async function listOrgProfilesServer(): Promise<OrgProfile[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];

  const db = (await createSupabaseServer()) as any;
  const { data, error } = await db
    .from("profiles")
    .select("id, display_name");

  if (error) throw new Error(`listOrgProfilesServer: ${error.message}`);

  return (data ?? []).map((row: { id: string; display_name: string | null }) => ({
    id: row.id,
    displayName: row.display_name ?? row.id.slice(0, 8),
  }));
}
