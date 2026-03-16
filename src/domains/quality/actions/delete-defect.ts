"use server";

import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { requirePermission } from "@/lib/permissions/can-perform";

export async function deleteDefect(id: string): Promise<void> {
  await requirePermission("delete:defect");

  const db = (await createSupabaseServer()) as any;

  const { error } = await db
    .from("defects")
    .delete()
    .eq("id", id);

  if (error) throw new Error(`deleteDefect: ${error.message}`);
}
