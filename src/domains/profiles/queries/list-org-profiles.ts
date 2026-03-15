import { createSupabaseBrowser } from "@/lib/supabase/supabase-browser";

export interface OrgProfile {
  id: string;
  displayName: string;
}

export async function listOrgProfiles(): Promise<OrgProfile[]> {
  const supabase = createSupabaseBrowser();

  const { data, error } = await (supabase as any)
    .from("profiles")
    .select("id, display_name");

  if (error) throw new Error(`listOrgProfiles: ${error.message}`);

  return (data ?? []).map((row: { id: string; display_name: string | null }) => ({
    id: row.id,
    displayName: row.display_name ?? row.id.slice(0, 8),
  }));
}
